import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.farmer_wallet import FarmerWallet
from app.models.commission import Commission, CommissionStatus
from app.models.adoption import Adoption
from app.models.payment import Payment
from app.models.delivery import Delivery
from app.models.farmer import Farmer
from app.models.tree import Tree

logger = logging.getLogger(__name__)

class TransactionService:
    """
    Service to manage all financial transactions:
    - Track adoption payments (User → Admin)
    - Track payment releases (Admin → Farmer)
    - Manage farmer wallets
    - Handle commissions
    """

    @staticmethod
    async def create_adoption_payment_transaction(
        db: AsyncSession,
        user_id: uuid.UUID,
        adoption_id: uuid.UUID,
        payment_id: uuid.UUID,
        amount: Decimal,
        payment_gateway: str = "Razorpay"
    ) -> Transaction:
        """
        Create a transaction record when user makes an adoption payment.
        Money goes to admin account (holding account).
        """
        transaction = Transaction(
            transaction_type=TransactionType.ADOPTION_PAYMENT,
            status=TransactionStatus.COMPLETED,
            amount=amount,
            from_user_id=user_id,
            to_user_id=None,  # Goes to admin account
            adoption_id=adoption_id,
            payment_id=payment_id,
            description=f"Adoption payment - {payment_gateway}",
            notes=f"Payment captured via {payment_gateway}"
        )
        db.add(transaction)
        await db.flush()
        logger.info(f"Created adoption payment transaction: {transaction.id} for user {user_id}, amount: {amount}")
        return transaction

    @staticmethod
    async def create_commission_record(
        db: AsyncSession,
        adoption_id: uuid.UUID,
        farmer_id: uuid.UUID,
        adoption_price: Decimal,
        commission_percentage: Decimal = Decimal("70.00")
    ) -> Commission:
        """
        Create a commission record when adoption payment is completed.
        Commission is held in pending status until delivery is verified.
        """
        commission_amount = (adoption_price * commission_percentage) / Decimal("100")
        
        commission = Commission(
            adoption_id=adoption_id,
            farmer_id=farmer_id,
            adoption_price=adoption_price,
            commission_percentage=commission_percentage,
            commission_amount=commission_amount,
            status=CommissionStatus.PENDING,
            notes="Pending until delivery confirmation"
        )
        db.add(commission)
        await db.flush()
        logger.info(f"Created commission record: {commission.id} for farmer {farmer_id}, amount: {commission_amount}")
        return commission

    @staticmethod
    async def get_or_create_farmer_wallet(
        db: AsyncSession,
        farmer_id: uuid.UUID
    ) -> FarmerWallet:
        """
        Get or create a farmer wallet for tracking earnings and balance.
        """
        query = select(FarmerWallet).where(FarmerWallet.farmer_id == farmer_id)
        result = await db.execute(query)
        wallet = result.scalar_one_or_none()
        
        if not wallet:
            wallet = FarmerWallet(farmer_id=farmer_id)
            db.add(wallet)
            await db.flush()
            logger.info(f"Created new wallet for farmer: {farmer_id}")
        
        return wallet

    @staticmethod
    async def release_payment_to_farmer(
        db: AsyncSession,
        commission_id: uuid.UUID,
        admin_id: uuid.UUID,
        delivery_id: uuid.UUID
    ) -> Transaction:
        """
        Release payment to farmer wallet when delivery is confirmed.
        This moves money from admin holding account to farmer wallet.
        Updates commission status to "released".
        """
        # Get commission
        query = select(Commission).where(Commission.id == commission_id)
        result = await db.execute(query)
        commission = result.scalar_one_or_none()
        
        if not commission:
            raise ValueError(f"Commission not found: {commission_id}")
        
        if commission.status == CommissionStatus.RELEASED:
            logger.warning(f"Commission already released: {commission_id}")
            return None
        
        # Get farmer wallet
        wallet = await TransactionService.get_or_create_farmer_wallet(db, commission.farmer_id)
        
        # Create transaction record
        transaction = Transaction(
            transaction_type=TransactionType.PAYMENT_RELEASE,
            status=TransactionStatus.COMPLETED,
            amount=commission.commission_amount,
            from_user_id=None,  # From admin account
            to_user_id=commission.farmer_id,
            adoption_id=commission.adoption_id,
            delivery_id=delivery_id,
            released_by_admin_id=admin_id,
            released_at=datetime.now(timezone.utc).replace(tzinfo=None),
            commission_percentage=commission.commission_percentage,
            commission_amount=commission.commission_amount,
            description=f"Payment released for fruit delivery",
            notes=f"Released after delivery confirmation"
        )
        db.add(transaction)
        
        # Update wallet
        wallet.available_balance += commission.commission_amount
        wallet.total_earned += commission.commission_amount
        wallet.pending_balance = max(wallet.pending_balance - commission.commission_amount, Decimal("0"))
        wallet.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.add(wallet)
        
        # Update commission status
        commission.status = CommissionStatus.RELEASED
        commission.released_at = datetime.now(timezone.utc).replace(tzinfo=None)
        commission.released_by_admin_id = admin_id
        commission.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.add(commission)
        
        await db.flush()
        logger.info(
            f"Released payment to farmer {commission.farmer_id}: {commission.commission_amount}, "
            f"transaction: {transaction.id}, commission: {commission_id}"
        )
        return transaction

    @staticmethod
    async def get_farmer_transactions(
        db: AsyncSession,
        farmer_id: uuid.UUID,
        skip: int = 0,
        limit: int = 50
    ) -> list[Transaction]:
        """
        Get all transactions for a farmer (payments released to them).
        """
        query = (
            select(Transaction)
            .where(
                and_(
                    Transaction.to_user_id == farmer_id,
                    Transaction.transaction_type == TransactionType.PAYMENT_RELEASE
                )
            )
            .order_by(desc(Transaction.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_admin_transactions(
        db: AsyncSession,
        transaction_type: str = None,
        status: str = None,
        skip: int = 0,
        limit: int = 50
    ) -> list[Transaction]:
        """
        Get all transactions for admin dashboard.
        Can filter by type and status.
        """
        filters = []
        
        if transaction_type:
            filters.append(Transaction.transaction_type == transaction_type)
        
        if status:
            filters.append(Transaction.status == status)
        
        query = (
            select(Transaction)
            .where(and_(*filters) if filters else True)
            .order_by(desc(Transaction.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_pending_commissions(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50
    ) -> list[Commission]:
        """
        Get all pending commissions waiting for admin approval and payment release.
        """
        query = (
            select(Commission)
            .where(Commission.status == CommissionStatus.PENDING)
            .order_by(desc(Commission.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_adoption_payment_details(
        db: AsyncSession,
        adoption_id: uuid.UUID
    ) -> dict:
        """
        Get complete payment and commission details for an adoption.
        """
        # Get adoption
        query = select(Adoption).where(Adoption.id == adoption_id)
        result = await db.execute(query)
        adoption = result.scalar_one_or_none()
        
        if not adoption:
            raise ValueError(f"Adoption not found: {adoption_id}")
        
        # Get payment
        query = select(Payment).where(Payment.adoption_id == adoption_id)
        result = await db.execute(query)
        payment = result.scalar_one_or_none()
        
        # Get commission
        query = select(Commission).where(Commission.adoption_id == adoption_id)
        result = await db.execute(query)
        commission = result.scalar_one_or_none()
        
        # Get tree details
        query = select(Tree).where(Tree.id == adoption.tree_id)
        result = await db.execute(query)
        tree = result.scalar_one_or_none()
        
        return {
            "adoption": adoption,
            "payment": payment,
            "commission": commission,
            "tree": tree
        }
