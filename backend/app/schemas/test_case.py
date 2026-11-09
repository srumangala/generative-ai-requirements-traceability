from pydantic import BaseModel, ConfigDict

class TestCaseCreate(BaseModel):
    title: str
    description: str
    prerequisites: list[str]
    steps: list[str]
    expected_result: str
    related_requirement: str

class TestCaseResponse(BaseModel):
    id: int
    test_case_id: str
    title: str
    description: str
    prerequisites: list[str]
    steps: list[str]
    expected_result: str
    related_requirement: str

    model_config = ConfigDict(from_attributes=True)

class TestCaseUploadResponse(BaseModel):
    created_count: int
    skipped_count: int
    created_items: list[TestCaseResponse]
    skipped_ids: list[str]
