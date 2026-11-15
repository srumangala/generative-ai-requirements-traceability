import csv
import io
from fastapi import UploadFile, File, HTTPException
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.database import get_db
from app.database.models.requirement import Requirement, GeneratedTestCase
from app.database.models.test_case import TestCase
from app.schemas.requirement import (
    RequirementCreate,
    RequirementResponse,
    RequirementUploadResponse,
    RequirementAnalysisResponse,
    RequirementBatchAnalysisRequest,
    RequirementBatchAnalysisError,
    RequirementBatchAnalysisResponse,
    TestCaseGenerationResponse,   
    GeneratedTestCaseActionResponse
)
from app.services.requirement_ai_service import analyse_requirement, analyse_requirements, ai_generate_test_cases
from app.api.test_cases import generate_next_test_case_id

router = APIRouter(prefix="/requirements", tags=["requirements"])

@router.get("", response_model=list[RequirementResponse])
def get_requirements(db: Session = Depends(get_db)):
    return db.query(Requirement).filter(Requirement.is_archived == False).all()

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
    if not file.filename.endswith(".csv"): # type: ignore
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

    requirement.is_archived = True
    requirement.archived_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "message": f"Requirement {requirement_id} deleted successfully."
    }

@router.post(
    "/analyse-batch",
    response_model=RequirementBatchAnalysisResponse,
)
def analyse_batch_requirements(
    request: RequirementBatchAnalysisRequest,
    db: Session = Depends(get_db),
):
    requirements = (
        db.query(Requirement)
        .filter(Requirement.requirement_id.in_(request.requirement_ids))
        .all()
    )

    found_ids = {
        requirement.requirement_id
        for requirement in requirements
    }

    missing_ids = [
        requirement_id
        for requirement_id in request.requirement_ids
        if requirement_id not in found_ids
    ]

    result = analyse_requirements(
        requirements=requirements,
        db=db,
    )

    for requirement_id in missing_ids:
        result.errors.append(
            RequirementBatchAnalysisError(
                requirement_id=requirement_id,
                error="Requirement not found.",
            )
        )

    return result

@router.post(
    "/{requirement_id}/analyse",
    response_model=RequirementAnalysisResponse,
)
def analyse_single_requirement(
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
    
    result = analyse_requirement(
        requirement=requirement,
        db=db,
    )

    return result

@router.post(
    "/{requirement_id}/generate-test-cases",
    response_model=TestCaseGenerationResponse,
)
def generate_test_cases(
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

    generated_test_cases = ai_generate_test_cases(
        requirement=requirement,
        db=db,
    )

    return TestCaseGenerationResponse(
        requirement_id=requirement.requirement_id,
        generated_test_cases=generated_test_cases,
    )

@router.post(
    "/{generated_test_case_id}/accept",
    response_model=GeneratedTestCaseActionResponse
)
def accept_test_case(
    generated_test_case_id: int,
    db: Session = Depends(get_db),
):
    generated = (
        db.query(GeneratedTestCase)
        .filter(GeneratedTestCase.id == generated_test_case_id)
        .first()
    )

    if not generated:
        raise HTTPException(
            status_code=404,
            detail="Generated TC not found.",
        )

    if generated.status != "generated":
        raise HTTPException(
            status_code=409,
            detail=f"Generated test case is already {generated.status}.",
        )

    requirement = (
        db.query(Requirement)
        .filter(Requirement.id == generated.requirement_db_id)
        .first()
    )

    if not requirement:
        raise HTTPException(
            status_code=404,
            detail="Related requirement not found.",
        )

    test_case_id = generate_next_test_case_id(
        db,
        source="ai",
    )

    new_test_case = TestCase(
        test_case_id=test_case_id,
        title=generated.title,
        description=generated.description,
        prerequisites=generated.prerequisites,
        steps=generated.steps,
        expected_result=generated.expected_result,
        related_requirement=requirement.requirement_id,
        source="LLM",
        status="accepted",
        generated_from_id=generated.id,
    )

    generated.status = "accepted"

    db.add(new_test_case)
    db.commit()
    db.refresh(new_test_case)

    return GeneratedTestCaseActionResponse(
        id=generated.id,
        status="accepted",
        test_case_id=test_case_id,
    )

@router.post(
    "/{generated_test_case_id}/reject",
    response_model=GeneratedTestCaseActionResponse
)
def reject_test_case(
    generated_test_case_id: int,
    db: Session = Depends(get_db),
):
    generated = (
        db.query(GeneratedTestCase)
        .filter(GeneratedTestCase.id == generated_test_case_id)
        .first()
    )

    if not generated:
        raise HTTPException(
            status_code=404,
            detail="Generated test case not found.",
        )

    if generated.status != "generated":
        raise HTTPException(
            status_code=409,
            detail=f"Generated test case is already {generated.status}.",
        )

    generated.status = "rejected"

    db.commit()
    db.refresh(generated)

    return GeneratedTestCaseActionResponse(
        id=generated.id,
        status="rejected",
        test_case_id=None,
    )