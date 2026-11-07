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

class TestCaseIssue(BaseModel):
    category: str
    score: int
    description: str

class TestCaseAnalysisLLM(BaseModel):
    analysis: str
    issues:list[TestCaseIssue]
    suggestion: str | None

class TestCaseAnalysisResponse(BaseModel):
    test_case_id: str
    analysis: str
    issues: list[TestCaseIssue]
    confidence: float
    suggestion: str | None
    llm_model: str
    prompt_version: str

class TestCaseBatchAnalysisRequest(BaseModel):
    test_case_ids: list[str]

class TestCaseBatchAnalysisError(BaseModel):
    test_case_id: str
    error: str

class TestCaseBatchAnalysisResponse(BaseModel):
    results: list[TestCaseAnalysisResponse]
    errors: list[TestCaseBatchAnalysisError]