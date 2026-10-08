from pydantic import BaseModel, ConfigDict

class TestCaseCreate(BaseModel):
    test_case_id: str
    title: str
    description: str

class TestCaseResponse(BaseModel):
    id: int
    test_case_id: str
    title: str
    description: str

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, ConfigDict


class TestCaseCreate(BaseModel):
    test_case_id: str
    title: str
    description: str


class TestCaseResponse(BaseModel):
    id: int
    test_case_id: str
    title: str
    description: str

    model_config = ConfigDict(from_attributes=True)


class TestCaseUploadResponse(BaseModel):
    created_count: int
    skipped_count: int
    created_items: list[TestCaseResponse]
    skipped_ids: list[str]