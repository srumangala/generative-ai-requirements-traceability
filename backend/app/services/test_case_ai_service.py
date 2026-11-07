from sqlalchemy.orm import Session

from app.config import OPENAI_MODEL
from app.database.models.test_case import TestCase, TestCaseAnalysis # DB Models
from app.schemas.test_case import (
    TestCaseAnalysisLLM, 
    TestCaseAnalysisResponse, 
    TestCaseBatchAnalysisResponse,
    TestCaseBatchAnalysisError,
    ) # Pydantic Schemas
from app.prompts.prompt_loader import load_prompt
from app.services.llm_service import generate_structured_response

def analyse_test_case(
    test_case: TestCase,
    db: Session,
) ->TestCaseAnalysisResponse:

    prompt_file = "test_case_analysis.yaml"
    prompt = load_prompt(prompt_file)

    user_prompt = prompt.user_prompt_template.format(
        test_case_title = test_case.title,
        test_case_description= test_case.description,
        test_case_pre_requisites = test_case.prerequisites,
        test_case_steps = test_case.steps,
        test_case_expected_results = test_case.expected_result
    )

    result = generate_structured_response(
        system_prompt=prompt.system_prompt,
        user_prompt=user_prompt,
        response_model=TestCaseAnalysisLLM,
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

    analysis_record = TestCaseAnalysis(
        test_case_db_id=test_case.id,
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

    return TestCaseAnalysisResponse(
        test_case_id=test_case.test_case_id,
        analysis=analysis_record.analysis,
        issues=analysis_record.issues, # type: ignore
        suggestion=analysis_record.suggestion,
        confidence=analysis_record.confidence,
        llm_model=analysis_record.llm_model,
        prompt_version=analysis_record.prompt_version,
    )

def analyse_test_cases(
    test_cases: list[TestCase],
    db: Session,
) -> TestCaseBatchAnalysisResponse:

    results = []
    errors = []

    for test_case in test_cases:
        try:
            analysis = analyse_test_case(
                test_case=test_case,
                db=db,
            )

            results.append(analysis)

        except Exception as error:
            errors.append(
                TestCaseBatchAnalysisError(
                    test_case_id=test_case.test_case_id,
                    error=str(error),
                )
            )

    return TestCaseBatchAnalysisResponse(
        results=results,
        errors=errors,
    )