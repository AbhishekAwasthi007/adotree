import logging
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.schemas.transaction import TransactionResponse, TransactionListResponse
from app.schemas.commission import CommissionResponse, CommissionListResponse
from app.schemas.payment import PaymentResponse
from app.models.commission import Commission, CommissionStatus
from app.models.transaction import Transaction, TransactionType
from app.models.payment import Payment
from app.models.delivery import Delivery
from app.services.transaction import TransactionService
from app.models.adoption import Adoption

router = APIRouter(prefix="/admin", tags=["Admin - Payment Management"])
logger = logging.getLogger(__name__)

def verify_admin(current_user: User):
    """Verify that the current user is an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    return current_user

@router.get("/transactions", response_model=List[TransactionListResponse])
async def get_all_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    transaction_type: str = Query(None),
    status_filter: str = Query(None, alias="status"),
    skip: int = Query(0),
    limit: int = Query(50, le=100)
):
    """
    Get all transactions in the system (admin only).
    Can filter by transaction type and status.
    """
    verify_admin(current_user)
    
    transactions = await TransactionService.get_admin_transactions(
        db,
        transaction_type=transaction_type,
        status=status_filter,
        skip=skip,
        limit=limit
    )
    return transactions

@router.get("/pending-commissions", response_model=List[CommissionListResponse])
async def get_pending_commissions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0),
    limit: int = Query(50, le=100)
):
    """
    Get all pending commissions waiting for payment release.
    Admin needs to verify delivery and release payments.
    """
    verify_admin(current_user)
    
    commissions = await TransactionService.get_pending_commissions(db, skip=skip, limit=limit)
    return commissions

@router.get("/commissions/{commission_id}", response_model=CommissionResponse)
async def get_commission_details(
    commission_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific commission.
    """
    verify_admin(current_user)
    
    query = select(Commission).where(Commission.id == commission_id)
    result = await db.execute(query)
    commission = result.scalar_one_or_none()
    
    if not commission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commission not found"
        )
    
    return commission

@router.post("/release-payment/{commission_id}")
async def release_payment_to_farmer(
    commission_id: uuid.UUID,
    delivery_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Release commission payment to farmer after delivery is confirmed.
    
    Steps:
    1. Admin verifies delivery is marked as 'delivered'
    2. Admin releases payment - money moves from admin account to farmer wallet
    3. Commission status changes to 'released'
    4. Transaction record is created for audit trail
    """
    verify_admin(current_user)
    
    # Verify delivery exists and is delivered
    query = select(Delivery).where(Delivery.id == delivery_id)
    result = await db.execute(query)
    delivery = result.scalar_one_or_none()
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    if delivery.status != "delivered":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Delivery status must be 'delivered', currently: {delivery.status}"
        )
    
    try:
        # Release payment
        transaction = await TransactionService.release_payment_to_farmer(
            db,
            commission_id=commission_id,
            admin_id=current_user.id,
            delivery_id=delivery_id
        )
        
        # Mark delivery as payment released
        delivery.payment_released = True
        delivery.payment_released_at = __import__('datetime').datetime.now(__import__('datetime').timezone.utc).replace(tzinfo=None)
        db.add(delivery)
        
        await db.commit()
        
        return {
            "message": "Payment released successfully",
            "transaction_id": str(transaction.id),
            "amount": str(transaction.amount)
        }
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error releasing payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error releasing payment"
        )

@router.get("/adoption-payment-status/{adoption_id}")
async def get_adoption_payment_status(
    adoption_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete payment, commission, and delivery status for an adoption.
    """
    verify_admin(current_user)
    
    try:
        details = await TransactionService.get_adoption_payment_details(db, adoption_id)
        
        adoption = details["adoption"]
        payment = details["payment"]
        commission = details["commission"]
        tree = details["tree"]
        
        # Get delivery info if exists
        from app.models.harvest import Harvest
        query = select(Harvest).where(Harvest.tree_id == tree.id)
        result = await db.execute(query)
        harvest = result.scalar_one_or_none()
        
        delivery = None
        if harvest:
            query = select(Delivery).where(Delivery.harvest_id == harvest.id)
            result = await db.execute(query)
            delivery = result.scalar_one_or_none()
        
        return {
            "adoption_id": str(adoption.id),
            "user_id": str(adoption.user_id),
            "tree_id": str(tree.id),
            "tree_name": adoption.custom_tree_name or tree.fruit_type,
            "payment": {
                "amount": str(payment.amount) if payment else None,
                "status": payment.status if payment else None,
                "transaction_id": payment.transaction_id if payment else None
            },
            "commission": {
                "amount": str(commission.commission_amount) if commission else None,
                "percentage": str(commission.commission_percentage) if commission else None,
                "status": commission.status if commission else None,
                "released_at": commission.released_at if commission else None
            },
            "delivery": {
                "status": delivery.status if delivery else None,
                "payment_released": delivery.payment_released if delivery else False,
                "payment_released_at": delivery.payment_released_at if delivery else None
            } if delivery else None
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/payment-statistics")
async def get_payment_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get payment statistics for admin dashboard.
    - Total payments received
    - Total payments released to farmers
    - Pending payments
    - Average commission
    """
    verify_admin(current_user)
    
    from sqlalchemy import func
    
    # Total adoption payments
    query = select(func.sum(Transaction.amount)).where(
        Transaction.transaction_type == TransactionType.ADOPTION_PAYMENT
    )
    result = await db.execute(query)
    total_adoption_payments = result.scalar() or 0
    
    # Total payments released
    query = select(func.sum(Transaction.amount)).where(
        Transaction.transaction_type == TransactionType.PAYMENT_RELEASE
    )
    result = await db.execute(query)
    total_payments_released = result.scalar() or 0
    
    # Pending commissions total
    query = select(func.sum(Commission.commission_amount)).where(
        Commission.status == CommissionStatus.PENDING
    )
    result = await db.execute(query)
    pending_commissions_total = result.scalar() or 0
    
    # Pending commissions count
    query = select(func.count(Commission.id)).where(
        Commission.status == CommissionStatus.PENDING
    )
    result = await db.execute(query)
    pending_commissions_count = result.scalar() or 0
    
    # Held commissions total
    query = select(func.sum(Commission.commission_amount)).where(
        Commission.status == CommissionStatus.HELD
    )
    result = await db.execute(query)
    held_commissions_total = result.scalar() or 0
    
    return {
        "total_adoption_payments": str(total_adoption_payments),
        "total_payments_released": str(total_payments_released),
        "held_in_admin_account": str(total_adoption_payments - total_payments_released),
        "pending_commissions": {
            "count": pending_commissions_count,
            "total_amount": str(pending_commissions_total)
        },
        "held_commissions_total": str(held_commissions_total)
    }
