from fastapi import APIRouter, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from database import engine, UploadedFile as DBUploadedFile
from services import extract_from_pdf
from websocket_manager import manager
import json
import asyncio

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time scan progress updates."""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@router.post("/analyze-all")
async def analyze_all_pending(background_tasks: BackgroundTasks):
    """
    Trigger background extraction for all pending files.
    Returns immediately — progress comes via WebSocket.
    """
    try:
        with engine.connect() as conn:
            pending = conn.execute(
                select(DBUploadedFile).where(DBUploadedFile.status == "pending")
            ).fetchall()

        if not pending:
            return {
                "success": False,
                "message": "No pending files to analyze",
                "processing_count": 0,
                "file_ids": []
            }

        file_ids = []
        for file in pending:
            file_ids.append(file.id)
            background_tasks.add_task(
                process_single_file,
                file.id,
                file.file_content,
                file.filename
            )

        return {
            "success": True,
            "message": f"Processing {len(file_ids)} file(s). Updates via WebSocket.",
            "processing_count": len(file_ids),
            "file_ids": file_ids,
            "estimated_time_seconds": len(file_ids) * 30
        }

    except Exception as e:
        print(f"Analyze all error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def process_single_file(file_id: int, file_content: bytes, filename: str):
    """Background task: extract financial data from one PDF."""
    try:
        print(f"🔍 Processing file {file_id}: {filename}")

        # Mark as analyzing
        with engine.connect() as conn:
            conn.execute(
                DBUploadedFile.__table__.update()
                .where(DBUploadedFile.__table__.c.id == file_id)
                .values(status="analyzing")
            )
            conn.commit()

        await manager.send_file_status(file_id, "analyzing", {
            "filename": filename, "message": "Starting analysis..."
        })
        await manager.send_analysis_progress(file_id, 10, "Initializing...")
        await manager.send_analysis_progress(file_id, 30, "Extracting text from PDF...")

        try:
            extracted = await asyncio.wait_for(
                asyncio.to_thread(extract_from_pdf, file_content),
                timeout=120.0
            )
            await manager.send_analysis_progress(file_id, 80, "Processing with AI...")

        except asyncio.TimeoutError:
            extracted = {
                "success": False,
                "error": "Processing timeout (exceeded 2 minutes)"
            }

        # Save results
        with engine.connect() as conn:
            if extracted.get("success", False):
                await manager.send_analysis_progress(file_id, 100, "Done!")
                conn.execute(
                    DBUploadedFile.__table__.update()
                    .where(DBUploadedFile.__table__.c.id == file_id)
                    .values(
                        status="completed",
                        extracted_data=json.dumps(extracted.get("data", {}))
                    )
                )
                await manager.send_file_status(file_id, "completed", {
                    "filename": filename,
                    "extracted_data": extracted.get("data", {}),
                    "message": "Analysis complete!"
                })
            else:
                conn.execute(
                    DBUploadedFile.__table__.update()
                    .where(DBUploadedFile.__table__.c.id == file_id)
                    .values(
                        status="failed",
                        error_message=extracted.get("error", "Analysis failed")
                    )
                )
                await manager.send_file_status(file_id, "failed", {
                    "filename": filename,
                    "error": extracted.get("error", "Analysis failed")
                })
            conn.commit()

    except Exception as e:
        print(f"❌ Error on file {file_id}: {e}")
        with engine.connect() as conn:
            conn.execute(
                DBUploadedFile.__table__.update()
                .where(DBUploadedFile.__table__.c.id == file_id)
                .values(status="failed", error_message=str(e))
            )
            conn.commit()
        await manager.send_file_status(file_id, "failed", {
            "filename": filename, "error": str(e)
        })