from fastapi import APIRouter

router = APIRouter(prefix="/requirements", tags=["requirements"])


@router.get("")
def get_requirements():
    return [
        {
            "id": "REQ-001",
            "text": "The system shall allow users to log in."
        },
        {
            "id": "REQ-002",
            "text": "The system shall respond within 2 seconds."
        },
        {
            "id": "REQ-003",
            "text": "Eenie meenie mine mo"
        },
        {
            "id": "REQ-004",
            "text": "heeho haahaa"
        }

    ]