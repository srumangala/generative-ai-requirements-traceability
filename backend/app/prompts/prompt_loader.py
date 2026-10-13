from pydantic import BaseModel
from pathlib import Path

import yaml


PROMPTS_DIR = Path(__file__).parent

class PromptTemplate(BaseModel):
    name: str
    version: str
    system_prompt: str
    user_prompt_template: str


def load_prompt(filename: str) -> PromptTemplate:
    path = PROMPTS_DIR / filename

    with path.open("r", encoding="utf-8") as file:
        data = yaml.safe_load(file)

    return PromptTemplate.model_validate(data)
