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