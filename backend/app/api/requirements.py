import csv
import io
from fastapi import UploadFile, File, HTTPException
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.requirement import Requirement
from app.schemas.requirement import (
    RequirementCreate,
    RequirementResponse,
    RequirementUploadResponse,
)

router = APIRouter(prefix="/requirements", tags=["requirements"])


@router.get("", response_model=list[RequirementResponse])
def get_requirements(db: Session = Depends(get_db)):
    return db.query(Requirement).all()

@router.post("", response_model=RequirementResponse)
def create_requirement(
    requirement: RequirementCreate,
    db: Session = Depends(get_db),
):

    existing_requirement = (
    db.query(Requirement)
    .filter(Requirement.requirement_id == requirement.requirement_id)
    .first()
    )

    if existing_requirement:
        raise HTTPException(
            status_code=409,
            detail="Requirement ID already exists."
        )

    new_requirement = Requirement(
        requirement_id=requirement.requirement_id,
        description=requirement.description,
    )

    db.add(new_requirement)
    db.commit()
    db.refresh(new_requirement)

    return new_requirement

@router.post("/upload", response_model=RequirementUploadResponse)
async def upload_requirements(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported."
        )

    content = await file.read()
    text_content = content.decode("utf-8")

    reader = csv.DictReader(io.StringIO(text_content))

    created_requirements = []
    skipped_ids = []

    for row in reader:
        requirement_id = row.get("requirement_id")
        description = row.get("description")

        if not requirement_id or not description:
            continue
        
        requirement_id = requirement_id.strip()
        description = description.strip()

        existing_requirement = (
            db.query(Requirement)
            .filter(Requirement.requirement_id == requirement_id)
            .first()
        )

        if existing_requirement:
            skipped_ids.append(requirement_id)
            continue

        requirement = Requirement(
            requirement_id=requirement_id,
            description=description,
        )

        db.add(requirement)
        created_requirements.append(requirement)

    db.commit()

    for requirement in created_requirements:
        db.refresh(requirement)

    return {
        "created_count": len(created_requirements),
        "skipped_count": len(skipped_ids),
        "created_items": created_requirements,
        "skipped_ids": skipped_ids,
    }

@router.delete("/{requirement_id}")
def delete_requirement(
    requirement_id: str,
    db: Session = Depends(get_db),
):
    requirement = (
        db.query(Requirement)
        .filter(Requirement.requirement_id == requirement_id)
        .first()
    )

    if not requirement:
        raise HTTPException(
            status_code=404,
            detail="Requirement not found.",
        )

    db.delete(requirement)
    db.commit()

    return {
        "message": f"Requirement {requirement_id} deleted successfully."
    }