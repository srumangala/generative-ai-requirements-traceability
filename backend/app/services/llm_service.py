from dataclasses import dataclass
from typing import TypeVar, Generic, Type

from openai import OpenAI
from pydantic import BaseModel

from app.config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

T = TypeVar("T", bound=BaseModel)

@dataclass
class LLMResult(Generic[T]):
    parsed: T
    model: str
    response_id: str
    input_tokens: int | None
    output_tokens: int | None
    total_tokens: int | None

def generate_structured_response(
    system_prompt: str, 
    user_prompt: str, 
    response_model: Type[T],
    llm_model: str
) -> LLMResult[T]:

    response = client.responses.parse(
        model= llm_model,
        input=[
            {
                "role": "system", 
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        text_format=response_model,
    )

    if response.output_parsed is None:
        raise RuntimeError("LLM response could not be parsed.")

    usage = response.usage

    return LLMResult(
        parsed=response.output_parsed,
        model=response.model,
        response_id=response.id,
        input_tokens=usage.input_tokens if usage else None,
        output_tokens=usage.output_tokens if usage else None,
        total_tokens=usage.total_tokens if usage else None,
    )

