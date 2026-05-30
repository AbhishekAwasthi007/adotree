import uuid
from typing import Dict, Optional
from pydantic import BaseModel

class YieldPredictionInput(BaseModel):
    weather: str
    soil: str
    tree_age: int
    season: str

class YieldPredictionOutput(BaseModel):
    predicted_yield_kg: float
    confidence_score: float
    analysis_summary: str

class TreePersonalityInput(BaseModel):
    tree_id: uuid.UUID
    weather_condition: str

class TreePersonalityOutput(BaseModel):
    tree_name: str
    emotional_message: str

class DiseaseDetectionOutput(BaseModel):
    disease_detected: str
    treatment_plan: str
    severity: str # Low, Medium, High
    recommendations: str
