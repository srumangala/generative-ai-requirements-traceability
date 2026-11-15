from pydantic import BaseModel, ConfigDict

class RequirementCreate(BaseModel):
    requirement_id: str
    description: str

class RequirementResponse(BaseModel):
    id: int
    requirement_id: str
    description: str

    model_config = ConfigDict(from_attributes=True)

class RequirementUploadResponse(BaseModel):
    created_count: int
    skipped_count: int
    created_items: list[RequirementResponse]
    skipped_ids: list[str]

class RequirementIssue(BaseModel):
    category: str
    score: int
    description: str

class RequirementAnalysisLLM(BaseModel):
    analysis: str
    issues:list[RequirementIssue]
    suggestion: str | None

class RequirementAnalysisResponse(BaseModel):
    requirement_id: str
    analysis: str
    issues: list[RequirementIssue]
    confidence: float
    suggestion: str | None
    llm_model: str
    prompt_version: str

class RequirementBatchAnalysisRequest(BaseModel):
    requirement_ids: list[str]

class RequirementBatchAnalysisError(BaseModel):
    requirement_id: str
    error: str

class RequirementBatchAnalysisResponse(BaseModel):
    results: list[RequirementAnalysisResponse]
    errors: list[RequirementBatchAnalysisError]

# Single test case
class GenerateTestCase(BaseModel):
    title: str
    description: str
    prerequisites: list[str]
    steps: list[str]
    expected_result: str

# All LLM generated test cases
class LLMTestCaseGenerationResponse(BaseModel):
    generated_test_cases: list[GenerateTestCase]

## Response of the ai generation function
class GeneratedTestCaseResponse(BaseModel):
    id: int
    title: str
    description: str
    prerequisites: list[str]
    steps: list[str]
    expected_result: str

    model_config = ConfigDict(from_attributes=True)

## Response passed to the frontend
class TestCaseGenerationResponse(BaseModel):
    requirement_id: str
    generated_test_cases: list[GeneratedTestCaseResponse]

class GeneratedTestCaseActionResponse(BaseModel):
    id: int
    status: str
    test_case_id: str | None = None