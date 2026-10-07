from fastapi import APIRouter

router = APIRouter(prefix="/test-cases", tags=["test-cases"])


@router.get("")
def get_test_cases():
    return[
        {
            "id": "TC-001",
            "title" : "TC-01",
            "description": "Meemee"
        },
        {
            "id": "TC-002",
            "title" : "TC-02",
            "description": "Verify response time is below 2 seconds."
        }
    ]
    