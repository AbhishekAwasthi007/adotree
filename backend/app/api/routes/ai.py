import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.schemas.ai import YieldPredictionInput, YieldPredictionOutput, TreePersonalityInput, TreePersonalityOutput, DiseaseDetectionOutput
from app.models.tree import Tree
from app.models.adoption import Adoption
from app.services.ai import AIService
from app.services.storage import storage_service

router = APIRouter()

@router.post("/predict-yield", response_model=YieldPredictionOutput)
async def predict_tree_yield(payload: YieldPredictionInput):
    """
    Predicts expected tree fruit yields utilizing soil, weather, season, and tree age parameters
    using Gemini AI services.
    """
    result = await AIService.predict_yield(
        weather=payload.weather,
        soil=payload.soil,
        tree_age=payload.tree_age,
        season=payload.season
    )
    return result

@router.post("/tree-personality", response_model=TreePersonalityOutput)
async def get_tree_emotional_update(
    payload: TreePersonalityInput,
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a personalized first-person magical message reflecting the tree's
    feelings toward the current weather condition using Gemini.
    """
    # 1. Fetch adoption & tree details
    query = select(Adoption).join(Tree, Adoption.tree_id == Tree.id).where(Adoption.id == payload.tree_id)
    result = await db.execute(query)
    adoption = result.scalar_one_or_none()
    
    if not adoption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adopted tree record not found."
        )

    # 2. Query tree details to fetch fruit type
    query_tree = select(Tree).where(Tree.id == adoption.tree_id)
    result_tree = await db.execute(query_tree)
    tree = result_tree.scalar_one_or_none()
    
    # 3. Generate emotional dialogues
    msg = await AIService.generate_tree_personality(
        tree_name=adoption.custom_tree_name or "My Tree",
        fruit_type=tree.fruit_type if tree else "fruit",
        weather_condition=payload.weather_condition
    )

    return {
        "tree_name": adoption.custom_tree_name or "My Tree",
        "emotional_message": msg
    }

@router.post("/disease-detection", response_model=DiseaseDetectionOutput)
async def detect_leaf_disease(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Uploads a leaf image. Uses AI vision algorithms to analyze leaf disease,
    severity, and outputs organic treatment advice.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload an image file of the leaf."
        )
        
    # 1. Upload to storage
    file_url = await storage_service.upload_file(file=file, folder="diseases")
    
    # 2. Run vision detection simulation
    diagnosis = await AIService.detect_disease(leaf_image_url=file_url)
    return diagnosis
