import logging
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.farmer import Farmer
from app.schemas.farmer_wallet import FarmerWalletResponse, FarmerWalletUpdate
from app.schemas.transaction import TransactionListResponse
from app.models.farmer_wallet import FarmerWallet
from app.services.transaction import TransactionService

router = APIRouter(prefix="/farmer", tags=["Farmer - Wallet & Transactions"])
logger = logging.getLogger(__name__)

def verify_farmer(current_user: User):
    """Verify that the current user is a farmer."""
    if current_user.role != UserRole.FARMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only farmers can access this endpoint"
        )
    return current_user

@router.get("/wallet", response_model=FarmerWalletResponse)
async def get_farmer_wallet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get farmer's wallet information.
    Shows:
    - Total earned
    - Available balance (can withdraw)
    - Pending balance (waiting for delivery verification)
    - Bank account details
    """
    verify_farmer(current_user)
    
    # Get farmer profile
    query = select(Farmer).where(Farmer.user_id == current_user.id)
    result = await db.execute(query)
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found"
        )
    
    # Get or create wallet
    wallet = await TransactionService.get_or_create_farmer_wallet(db, farmer.id)
    await db.refresh(wallet)
    
    return wallet

@router.put("/wallet", response_model=FarmerWalletResponse)
async def update_bank_details(
    bank_details: FarmerWalletUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update farmer's bank account details for payment withdrawals.
    """
    verify_farmer(current_user)
    
    # Get farmer profile
    query = select(Farmer).where(Farmer.user_id == current_user.id)
    result = await db.execute(query)
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found"
        )
    
    # Get or create wallet
    wallet = await TransactionService.get_or_create_farmer_wallet(db, farmer.id)
    
    # Update bank details
    update_data = bank_details.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(wallet, field, value)
    
    # Reset verification if bank details changed
    if any(field in update_data for field in [
        'bank_account_number', 'bank_ifsc_code', 'upi_id'
    ]):
        wallet.bank_verified = False
        wallet.bank_verified_at = None
    
    db.add(wallet)
    await db.commit()
    await db.refresh(wallet)
    
    return wallet

@router.get("/transactions", response_model=List[TransactionListResponse])
async def get_farmer_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0),
    limit: int = Query(50, le=100)
):
    """
    Get all transactions (payment releases) for the farmer.
    Shows payment history and when farmer received each payment.
    """
    verify_farmer(current_user)
    
    transactions = await TransactionService.get_farmer_transactions(
        db,
        farmer_id=current_user.id,
        skip=skip,
        limit=limit
    )
    return transactions

@router.get("/earnings-summary")
async def get_earnings_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get farmer's earnings summary.
    - Total earned from all tree adoptions
    - Available balance (can withdraw now)
    - Pending balance (waiting for delivery)
    - Total withdrawn
    - Commission percentage info
    """
    verify_farmer(current_user)
    
    # Get farmer profile
    query = select(Farmer).where(Farmer.user_id == current_user.id)
    result = await db.execute(query)
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found"
        )
    
    # Get wallet
    wallet = await TransactionService.get_or_create_farmer_wallet(db, farmer.id)
    
    # Get commission statistics
    from app.models.commission import Commission, CommissionStatus
    from sqlalchemy import func
    
    # Count released commissions
    query = select(func.count(Commission.id)).where(
        (Commission.farmer_id == farmer.id) & 
        (Commission.status == CommissionStatus.RELEASED)
    )
    result = await db.execute(query)
    released_count = result.scalar() or 0
    
    # Count pending commissions
    query = select(func.count(Commission.id)).where(
        (Commission.farmer_id == farmer.id) & 
        (Commission.status == CommissionStatus.PENDING)
    )
    result = await db.execute(query)
    pending_count = result.scalar() or 0
    
    return {
        "total_earned": str(wallet.total_earned),
        "available_balance": str(wallet.available_balance),
        "pending_balance": str(wallet.pending_balance),
        "withdrawn_amount": str(wallet.withdrawn_amount),
        "commission_stats": {
            "released_count": released_count,
            "pending_count": pending_count
        }
    }

@router.post("/request-withdrawal")
async def request_withdrawal(
    amount: float,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Request a withdrawal of available balance to bank account.
    This creates a pending withdrawal request for admin approval.
    """
    verify_farmer(current_user)
    
    from decimal import Decimal
    
    # Get farmer profile
    query = select(Farmer).where(Farmer.user_id == current_user.id)
    result = await db.execute(query)
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found"
        )
    
    # Get wallet
    wallet = await TransactionService.get_or_create_farmer_wallet(db, farmer.id)
    
    # Validate request
    if wallet.bank_account_number is None and wallet.upi_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please add bank account or UPI details first"
        )
    
    if not wallet.bank_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bank account not verified by admin"
        )
    
    withdrawal_amount = Decimal(str(amount))
    if withdrawal_amount > wallet.available_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Available: {wallet.available_balance}"
        )
    
    if withdrawal_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Withdrawal amount must be greater than 0"
        )
    
    # Create withdrawal transaction (pending)
    from app.models.transaction import Transaction, TransactionType, TransactionStatus
    
    transaction = Transaction(
        transaction_type=TransactionType.PAYMENT_RELEASE,  # Can be updated to WITHDRAWAL type if needed
        status=TransactionStatus.PENDING,
        amount=withdrawal_amount,
        from_user_id=None,
        to_user_id=farmer.user_id,
        description=f"Withdrawal request",
        notes=f"Pending admin approval - withdrawal to {wallet.bank_name or 'UPI'}"
    )
    db.add(transaction)
    
    # Deduct from available balance (move to pending)
    wallet.available_balance -= withdrawal_amount
    wallet.pending_balance += withdrawal_amount
    db.add(wallet)
    
    await db.commit()
    
    return {
        "message": "Withdrawal request created successfully",
        "amount": str(withdrawal_amount),
        "status": "pending_admin_approval"
    }
