import csv
import io
from fastapi import UploadFile, File, HTTPException
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.test_case import TestCase
from app.schemas.test_case import (
    TestCaseCreate,
    TestCaseResponse,
    TestCaseUploadResponse,
)


router = APIRouter(
    prefix="/test-cases",
    tags=["test-cases"],
)


@router.get("", response_model=list[TestCaseResponse])
def get_test_cases(db: Session = Depends(get_db)):
    return db.query(TestCase).all()

@router.post("", response_model=TestCaseResponse)
def create_test_case(
    test_case: TestCaseCreate,
    db: Session = Depends(get_db),
):

    existing_test_case = (
    db.query(TestCase)
    .filter(TestCase.test_case_id == test_case.test_case_id)
    .first()
    )

    if existing_test_case:
        raise HTTPException(
            status_code=409,
            detail="Test Case ID already exists."
        )

    new_test_case = TestCase(
        test_case_id=test_case.test_case_id,
        title=test_case.title,
        description=test_case.description,
    )

    db.add(new_test_case)
    db.commit()
    db.refresh(new_test_case)

    return new_test_case

@router.post("/upload", response_model=TestCaseUploadResponse)
async def upload_test_cases(
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

    created_test_cases = []
    skipped_ids = []

    for row in reader:
        test_case_id = row.get("test_case_id")
        title = row.get("title")
        description = row.get("description")

        if not test_case_id or not title or not description:
            continue
        
        test_case_id = test_case_id.strip()
        title = title.strip()
        description = description.strip()

        existing_test_case = (
            db.query(TestCase)
            .filter(TestCase.test_case_id == test_case_id)
            .first()
        )

        if existing_test_case:
            skipped_ids.append(test_case_id)
            continue

        test_case = TestCase(
            test_case_id=test_case_id,
            title = title,
            description=description,
        )

        db.add(test_case)
        created_test_cases.append(test_case)

    db.commit()

    for test_case in created_test_cases:
        db.refresh(test_case)

    return {
        "created_count": len(created_test_cases),
        "skipped_count": len(skipped_ids),
        "created_items": created_test_cases,
        "skipped_ids": skipped_ids,
    }

@router.delete("/{test_case_id}")
def delete_test_case(
    test_case_id: str,
    db: Session = Depends(get_db),
):
    test_case = (
        db.query(TestCase)
        .filter(TestCase.test_case_id == test_case_id)
        .first()
    )

    if not test_case:
        raise HTTPException(
            status_code=404,
            detail="Test case not found.",
        )

    db.delete(test_case)
    db.commit()

    return {
        "message": f"Test case {test_case_id} deleted successfully."
    }