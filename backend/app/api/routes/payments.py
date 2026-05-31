import logging
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.schemas.payment import PaymentVerify, PaymentResponse
from app.models.payment import Payment
from app.models.adoption import Adoption
from app.models.tree import Tree
from app.models.user import User
from app.models.memory import TreeMemory
from app.models.farm import Farm
from app.services.payment import RazorpayService
from app.services.transaction import TransactionService
from app.workers.tasks import generate_adoption_certificate_task
from app.services.notification import NotificationService

router = APIRouter()
razorpay_service = RazorpayService()
logger = logging.getLogger(__name__)

@router.post("/verify", status_code=status.HTTP_200_OK)
async def verify_and_activate_adoption(
    payload: PaymentVerify,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verifies the Razorpay payment signature. If authentic, activates the
    pending adoption, sets the tree to 'adopted', generates a payment log,
    and schedules async background jobs for certificate and timeline creation.
    """
    # 1. Verify Signature
    is_valid = await razorpay_service.verify_payment(
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification signature mismatch. Transaction denied."
        )

    # 2. Query tree
    query_tree = select(Tree).where(Tree.id == payload.tree_id)
    result_tree = await db.execute(query_tree)
    tree = result_tree.scalar_one_or_none()
    
    if not tree:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tree not found.")

    # 3. Create or Fetch Adoption
    # We locate the pending adoption using user_id and tree_id
    query_adoption = select(Adoption).where(
        (Adoption.user_id == current_user.id) & 
        (Adoption.tree_id == tree.id) & 
        (Adoption.subscription_status == "pending")
    ).order_by(Adoption.adoption_date.desc()).limit(1)
    
    result_adoption = await db.execute(query_adoption)
    adoption = result_adoption.scalar_one_or_none()
    
    if not adoption:
        # Create directly if order failed or was direct
        adoption = Adoption(
            user_id=current_user.id,
            tree_id=tree.id,
            custom_tree_name=payload.custom_tree_name or f"My {tree.fruit_type}",
            occasion_type=payload.occasion_type,
            dedication_message=payload.dedication_message,
            subscription_status="active"
        )
        db.add(adoption)
        await db.flush()
    else:
        # Elevate status
        adoption.subscription_status = "active"
        if payload.custom_tree_name:
            adoption.custom_tree_name = payload.custom_tree_name
        db.add(adoption)

    # 4. Log Payment
    payment = Payment(
        user_id=current_user.id,
        adoption_id=adoption.id,
        amount=tree.price,
        payment_gateway="Razorpay",
        order_id=payload.razorpay_order_id,
        transaction_id=payload.razorpay_payment_id,
        status="completed"
    )
    db.add(payment)
    await db.flush()

    # 4a. Create Transaction Record (Payment holding in admin account)
    await TransactionService.create_adoption_payment_transaction(
        db=db,
        user_id=current_user.id,
        adoption_id=adoption.id,
        payment_id=payment.id,
        amount=tree.price,
        payment_gateway="Razorpay"
    )

    # 4b. Get farmer and create commission record
    query_farm = select(Farm).where(Farm.id == tree.farm_id)
    result_farm = await db.execute(query_farm)
    farm = result_farm.scalar_one_or_none()
    
    if farm:
        # Create commission (70% for farmer, 30% commission for platform)
        commission_percentage = 70  # Farmer gets 70% of adoption price
        await TransactionService.create_commission_record(
            db=db,
            adoption_id=adoption.id,
            farmer_id=farm.farmer_id,
            adoption_price=tree.price,
            commission_percentage=commission_percentage
        )

    # 5. Lock Tree Status
    tree.status = "adopted"
    db.add(tree)

    # 6. Add initial timeline memory entry
    ceremony_memory = TreeMemory(
        adoption_id=adoption.id,
        title="Welcome Home! 🎉",
        description=f"Naming Ceremony Completed! You adopted your {tree.fruit_type} tree and named it '{adoption.custom_tree_name}'. We are preparing the land and watering its soil with love today.",
        memory_type="story",
        media=tree.tree_images or []
    )
    db.add(ceremony_memory)
    
    # Save active database transactions
    await db.commit()

    # 7. Dispath async worker tasks for PDF certificate and live camera integrations
    try:
        generate_adoption_certificate_task.delay(
            adoption_id=str(adoption.id),
            adopter_name=current_user.name,
            tree_name=adoption.custom_tree_name,
            occasion=adoption.occasion_type or "",
            dedication=adoption.dedication_message or "",
            adoption_date=datetime.now(timezone.utc).strftime("%B %d, %Y")
        )
    except Exception as e:
        logger.error(f"Failed to queue certificate task in Celery: {e}")

    # 8. Notify user via stubs
    await NotificationService.dispatch_multichannel(
        db=db,
        user_id=str(current_user.id),
        mobile=current_user.mobile,
        title="Adoption Ceremony Complete! 🌲",
        message=f"Congratulations! You adopted {adoption.custom_tree_name}. We are preparing its digital ceremony certificate.",
        notification_type="ceremony"
    )

    return {
        "status": "success",
        "message": "Payment verified and adoption successfully activated.",
        "adoption_id": adoption.id
    }
