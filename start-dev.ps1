# Start PostgreSQL
docker compose up -d

# Start FastAPI in a new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\.venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload"

# Start React/Vite in a new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"