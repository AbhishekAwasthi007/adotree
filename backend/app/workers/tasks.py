import asyncio
import logging
from celery import shared_task
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.adoption import Adoption
from app.models.ceremony import Ceremony
from app.services.certificate import CertificateService
from app.workers.celery import celery_app

logger = logging.getLogger(__name__)

async def run_generate_adoption_certificate(
    adoption_id: str,
    adopter_name: str,
    tree_name: str,
    occasion: str,
    dedication: str,
    adoption_date: str
):
    logger.info(f"Starting async processing for certificate: {adoption_id}")
    async with SessionLocal() as db:
        try:
            # Query adoption, tree, and farm to get farm name and location
            query = select(Adoption).where(Adoption.id == adoption_id)
            result = await db.execute(query)
            adoption = result.scalar_one_or_none()
            
            if not adoption:
                logger.error(f"Adoption {adoption_id} not found in database.")
                return
                
            # Fetch tree
            await db.refresh(adoption, ["tree"])
            tree = adoption.tree
            if not tree:
                logger.error(f"Tree for adoption {adoption_id} not found.")
                return
                
            # Fetch farm and farmer
            await db.refresh(tree, ["farm"])
            farm = tree.farm
            if not farm:
                logger.error(f"Farm for tree {tree.id} not found.")
                return
                
            await db.refresh(farm, ["farmer"])
            farmer = farm.farmer
            
            farm_name = farm.name
            location = farmer.location if farmer else "Eco Orchard Sanctuary"
            
            # Generate the PDF certificate
            certificate_url = await CertificateService.generate_adoption_certificate(
                tree_name=tree_name,
                adopter_name=adopter_name,
                occasion=occasion,
                dedication_message=dedication,
                farm_name=farm_name,
                location=location,
                adoption_date=adoption_date
            )
            
            # Check if a ceremony already exists, or create a new one
            query_ceremony = select(Ceremony).where(Ceremony.adoption_id == adoption.id)
            result_ceremony = await db.execute(query_ceremony)
            ceremony = result_ceremony.scalar_one_or_none()
            
            if not ceremony:
                ceremony = Ceremony(
                    adoption_id=adoption.id,
                    certificate_url=certificate_url,
                    ceremony_video=f"https://storage.googleapis.com/tree-adoption-platform/ceremonies/mock_ceremony_{adoption.id}.mp4"
                )
                db.add(ceremony)
            else:
                ceremony.certificate_url = certificate_url
                db.add(ceremony)
                
            await db.commit()
            logger.info(f"Successfully generated and bound certificate for adoption {adoption_id}")
        except Exception as e:
            await db.rollback()
            logger.error(f"Error in async certificate task for adoption {adoption_id}: {e}", exc_info=True)
            raise

@celery_app.task(name="app.workers.tasks.generate_adoption_certificate_task")
def generate_adoption_certificate_task(
    adoption_id: str,
    adopter_name: str,
    tree_name: str,
    occasion: str,
    dedication: str,
    adoption_date: str
):
    """
    Celery task wrapper that initiates the async event loop to run certificate creation.
    """
    logger.info(f"Celery task received for generating certificate: {adoption_id}")
    return asyncio.run(
        run_generate_adoption_certificate(
            adoption_id=adoption_id,
            adopter_name=adopter_name,
            tree_name=tree_name,
            occasion=occasion,
            dedication=dedication,
            adoption_date=adoption_date
        )
    )
