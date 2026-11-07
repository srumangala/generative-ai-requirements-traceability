from sqlalchemy.orm import Session

from app.config import OPENAI_MODEL
from app.database.models.requirement import Requirement, RequirementAnalysis, TestCaseGeneration # DB Models
from app.schemas.requirement import (
    RequirementAnalysisLLM, 
    RequirementAnalysisResponse, 
    RequirementBatchAnalysisResponse,
    RequirementBatchAnalysisError,
    TestCaseGenerationLLM,
    TestCaseGenerationResponse
    ) # Pydantic Schemas
from app.prompts.prompt_loader import load_prompt
from app.services.llm_service import generate_structured_response

def analyse_requirement(
    requirement: Requirement,
    db: Session,
) ->RequirementAnalysisResponse:

    prompt_file = "requirement_analysis.yaml"
    prompt = load_prompt(prompt_file)

    user_prompt = prompt.user_prompt_template.format(
        req_id= requirement.requirement_id,
        requirement_description= requirement.description
    )

    result = generate_structured_response(
        system_prompt=prompt.system_prompt,
        user_prompt=user_prompt,
        response_model=RequirementAnalysisLLM,
        llm_model=OPENAI_MODEL,
    )

    scores = [issue.score for issue in result.parsed.issues]

    confidence = (
        sum(scores) / len(scores)
        if scores
        else 0.0
    )

    issues_json = [
        issue.model_dump()
        for issue in result.parsed.issues
    ]

    analysis_record = RequirementAnalysis(
        requirement_db_id=requirement.id,
        analysis=result.parsed.analysis,
        issues=issues_json,
        confidence=confidence,
        suggestion=result.parsed.suggestion,
        llm_model=result.model,
        prompt_version=prompt.version,
    )

    db.add(analysis_record)
    db.commit()
    db.refresh(analysis_record)

    return RequirementAnalysisResponse(
        requirement_id=requirement.requirement_id,
        analysis=analysis_record.analysis,
        issues=analysis_record.issues, # type: ignore
        suggestion=analysis_record.suggestion,
        confidence=analysis_record.confidence,
        llm_model=analysis_record.llm_model,
        prompt_version=analysis_record.prompt_version,
    )

def analyse_requirements(
    requirements: list[Requirement],
    db: Session,
) -> RequirementBatchAnalysisResponse:

    results = []
    errors = []

    for requirement in requirements:
        try:
            analysis = analyse_requirement(
                requirement=requirement,
                db=db,
            )

            results.append(analysis)

        except Exception as error:
            errors.append(
                RequirementBatchAnalysisError(
                    requirement_id=requirement.requirement_id,
                    error=str(error),
                )
            )

    return RequirementBatchAnalysisResponse(
        results=results,
        errors=errors,
    )

def ai_generate_test_cases(
    requirement: Requirement,
    db: Session,
) ->TestCaseGenerationResponse:
    prompt_file = "test_case_generation.yaml"
    prompt = load_prompt(prompt_file)
    
    user_prompt = prompt.user_prompt_template.format(
        requirement_description= requirement.description
    )
    
    result = generate_structured_response(
        system_prompt=prompt.system_prompt,
        user_prompt=user_prompt,
        response_model=TestCaseGenerationLLM,
        llm_model=OPENAI_MODEL,
    )

    generated_results_json = [
        generated.model_dump()
        for generated in result.parsed.generated_test_cases
    ]
    
    generation_record = TestCaseGeneration(
        requirement_db_id=requirement.id,
        generated_test_cases=generated_results_json,
        llm_model=result.model,
        prompt_version=prompt.version,
    )

    db.add(generation_record)
    db.commit()
    db.refresh(generation_record)

    return TestCaseGenerationResponse(
        requirement_id=requirement.requirement_id,
        generated_test_cases=generation_record.generated_test_cases, # type: ignore
        llm_model=generation_record.llm_model,
        prompt_version=generation_record.prompt_version,
    )