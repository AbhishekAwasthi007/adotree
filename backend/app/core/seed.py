import uuid
import logging
from decimal import Decimal
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.farmer import Farmer
from app.models.farm import Farm
from app.models.tree import Tree

logger = logging.getLogger(__name__)

async def seed_data():
    """Seeds default organic farms, farmers, and trees if tables are empty."""
    async with SessionLocal() as db:
        try:
            # Check if any user exists
            res = await db.execute(select(User))
            if res.scalars().first() is not None:
                logger.info("Database already seeded. Skipping initialization.")
                return
            
            logger.info("Starting database seeding...")

            # 1. Create Farmer User
            farmer_user = User(
                id=uuid.uuid4(),
                name="Ramesh Patil",
                mobile="+919876543210",
                role=UserRole.FARMER,
                eco_points=250,
                streak_count=10
            )
            db.add(farmer_user)
            await db.flush()

            # 2. Create Farmer Profile
            farmer_profile = Farmer(
                id=uuid.uuid4(),
                user_id=farmer_user.id,
                farm_name="Ratnagiri Alphonso Farms",
                farm_description="Dedicated to cultivating premium organic fruits utilizing traditional Vedic farming techniques blended with modern soil science.",
                location="Ratnagiri, Maharashtra",
                latitude=17.3625,
                longitude=73.3167,
                organic_certified=True,
                verified=True,
                rating=4.9
            )
            db.add(farmer_profile)
            await db.flush()

            # 3. Create Farm
            farm = Farm(
                id=uuid.UUID("c8696e60-0091-44f3-8af2-3f01cd82e3a9"),
                farmer_id=farmer_profile.id,
                name="Ratnagiri Alphonso Farms",
                soil_type="Laterite Soil (Rich in Iron and Aluminium)",
                farm_size=12.5,
                cover_image="https://images.unsplash.com/photo-1775298116276-56bad682022f?w=1200",
                gallery=[
                    "https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600",
                    "https://images.unsplash.com/photo-1628486930648-fed98c4d56cb?w=600",
                    "https://images.unsplash.com/photo-1667559794596-27c6019ba5b6?w=600"
                ]
            )
            db.add(farm)
            await db.flush()

            # 4. Create Trees matching the frontend expectations
            trees = [
                Tree(
                    id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
                    farm_id=farm.id,
                    fruit_type="Mango",
                    tree_age=3,
                    health_score=9.5,
                    expected_yield=15.0,
                    price=Decimal("4999.00"),
                    tree_images=["https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600"],
                    live_camera_enabled=True,
                    status="available"
                ),
                Tree(
                    id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
                    farm_id=farm.id,
                    fruit_type="Apple",
                    tree_age=5,
                    health_score=9.8,
                    expected_yield=25.0,
                    price=Decimal("6999.00"),
                    tree_images=["https://images.unsplash.com/photo-1628486930648-fed98c4d56cb?w=600"],
                    live_camera_enabled=True,
                    status="available"
                ),
                Tree(
                    id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
                    farm_id=farm.id,
                    fruit_type="Orange",
                    tree_age=4,
                    health_score=9.2,
                    expected_yield=30.0,
                    price=Decimal("3999.00"),
                    tree_images=["https://images.unsplash.com/photo-1667559794596-27c6019ba5b6?w=600"],
                    live_camera_enabled=False,
                    status="available"
                )
            ]
            db.add_all(trees)
            await db.commit()
            logger.info("Successfully seeded database with farms, farmers, and trees.")
        except Exception as e:
            await db.rollback()
            logger.error(f"Error seeding database: {e}", exc_info=True)
