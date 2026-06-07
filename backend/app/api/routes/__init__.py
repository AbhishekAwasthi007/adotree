from fastapi import APIRouter

# Import all route handlers
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.farmers import router as farmers_router
from app.api.routes.farms import router as farms_router
from app.api.routes.trees import router as trees_router
from app.api.routes.adoptions import router as adoptions_router
from app.api.routes.ceremonies import router as ceremonies_router
from app.api.routes.memories import router as memories_router
from app.api.routes.harvests import router as harvests_router
from app.api.routes.deliveries import router as deliveries_router
from app.api.routes.payments import router as payments_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.farmer import router as farmer_panel_router
from app.api.routes.admin import router as admin_router
from app.api.routes.admin_payments import router as admin_payments_router
from app.api.routes.farmer_wallet import router as farmer_wallet_router
from app.api.routes.ai import router as ai_router
from app.api.routes.websocket import router as ws_router
from app.api.routes.chat import router as chat_router

# Create root API router
api_router = APIRouter()

# Register sub-routers with appropriate prefixes and tags
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(farmers_router, prefix="/farmers", tags=["Farmers Directory"])
api_router.include_router(farms_router, prefix="/farms", tags=["Farms Directory"])
api_router.include_router(trees_router, prefix="/trees", tags=["Trees Catalog"])
api_router.include_router(adoptions_router, prefix="/adoptions", tags=["Tree Adoptions"])
api_router.include_router(ceremonies_router, prefix="/ceremonies", tags=["Naming Ceremonies"])
api_router.include_router(memories_router, prefix="/memories", tags=["Tree Growth Timeline & Memories"])
api_router.include_router(harvests_router, prefix="/harvests", tags=["Harvest Records"])
api_router.include_router(deliveries_router, prefix="/deliveries", tags=["Harvest Deliveries"])
api_router.include_router(payments_router, prefix="/payments", tags=["Payments & Invoices"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Multi-channel Notifications"])
api_router.include_router(farmer_panel_router, prefix="/farmer", tags=["Farmer Dashboard Panel"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin Portal & Analytics"])
api_router.include_router(admin_payments_router)  # Already has /admin prefix in router
api_router.include_router(farmer_wallet_router)  # Already has /farmer prefix in router
api_router.include_router(ai_router, prefix="/ai", tags=["Google Gemini AI Services"])
api_router.include_router(ws_router, prefix="/ws", tags=["Real-time WebSockets"])
api_router.include_router(chat_router, prefix="/chat", tags=["Chat"])
