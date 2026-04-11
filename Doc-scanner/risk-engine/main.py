from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from services.model_service import load_models

# Load .env manually without python-dotenv
env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_file):
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Risk Engine...")
    load_models()
    print("✅ Ready")
    yield

app = FastAPI(
    title="Tax Risk Analyzer — Risk Engine",
    description="ML-powered tax risk scoring from financial data",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {
        "service": "Risk Engine",
        "status":  "running",
        "port":    8001,
        "endpoints": {
            "analyze_risk":    "POST /api/analyze-risk",
            "generate_report": "POST /api/generate-report",
            "health":          "GET  /api/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)