from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, select
from routes import router
from database import init_db, engine, UploadedFile

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Document Scanner...")
    try:
        init_db()
        print("✅ Database ready")
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        raise
    yield

app = FastAPI(
    title="Tax Risk Analyzer — Document Scanner",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {
        "service": "Document Scanner",
        "status":  "running",
        "port":    8000,
        "endpoints": {
            "upload":      "POST /api/upload",
            "analyze_all": "POST /api/analyze-all",
            "list_files":  "GET  /api/files",
            "delete_file": "DELETE /api/files/{id}",
            "websocket":   "WS   /api/ws"
        }
    }

@app.get("/health")
async def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            file_count = len(conn.execute(select(UploadedFile)).fetchall())
        return {"status": "healthy", "database": "connected", "file_count": file_count}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)