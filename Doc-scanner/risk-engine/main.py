from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes import router
from services.model_service import load_models

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Risk Engine...")
    load_models()
    print("✅ Ready")
    yield
    # Shutdown (nothing to clean up)

app = FastAPI(
    title="Tax Risk Analyzer — Risk Engine",
    description="ML-powered tax risk scoring from financial data",
    version="1.0.0",
    lifespan=lifespan        # ← replaces on_event
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
        "service":   "Risk Engine",
        "status":    "running",
        "port":      8001,
        "endpoints": {
            "analyze_risk": "POST /api/analyze-risk",
            "health":       "GET  /api/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)