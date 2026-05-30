import logging
import razorpay
from app.core.config import settings

logger = logging.getLogger(__name__)

class RazorpayService:
    def __init__(self):
        # Initialize client. Handle missing key cases or default mock values cleanly.
        try:
            self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        except Exception as e:
            logger.error(f"Razorpay Client initialization failed: {e}")
            self.client = None

    async def create_order(self, amount_in_rupees: float, receipt_id: str) -> dict:
        # Convert rupees to paise (Razorpay takes amount in standard subunits)
        amount_in_paise = int(amount_in_rupees * 100)
        
        # If mock credentials are used, return simulated order metadata
        if not settings.RAZORPAY_KEY_ID or "mock" in settings.RAZORPAY_KEY_ID or not self.client:
            logger.info("Simulating Razorpay Order creation.")
            return {
                "id": f"order_mock_{receipt_id}",
                "entity": "order",
                "amount": amount_in_paise,
                "amount_paid": 0,
                "amount_due": amount_in_paise,
                "currency": "INR",
                "receipt": receipt_id,
                "status": "created",
                "created_at": 1618827070
            }

        try:
            order_data = {
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": receipt_id,
                "payment_capture": 1 # capture immediately
            }
            order = self.client.order.create(data=order_data)
            return order
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            raise ValueError(f"Failed to create payment order: {str(e)}")

    async def verify_payment(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        # If mock credentials are used, pass authentication simulation automatically
        if "mock" in razorpay_order_id or not settings.RAZORPAY_KEY_ID or "mock" in settings.RAZORPAY_KEY_ID or not self.client:
            logger.info("Simulating Razorpay Payment verification - success.")
            return True

        try:
            # Verify the payment signature using the Razorpay utility
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except Exception as e:
            logger.error(f"Razorpay payment verification signature mismatch: {e}")
            return False
