from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy import select, delete
from database import engine, UploadedFile as DBUploadedFile
from websocket_manager import manager
from datetime import datetime
import json

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a PDF file — stores it with 'pending' status."""
    try:
        pdf_bytes = await file.read()

        with engine.connect() as conn:
            result = conn.execute(
                DBUploadedFile.__table__.insert().values(
                    filename=file.filename,
                    file_size=len(pdf_bytes),
                    file_type=file.content_type or "application/pdf",
                    status="pending",
                    upload_time=datetime.utcnow(),
                    file_content=pdf_bytes
                )
            )
            conn.commit()
            file_id = result.inserted_primary_key[0]

        with engine.connect() as conn:
            row = conn.execute(
                select(DBUploadedFile).where(DBUploadedFile.id == file_id)
            ).first()

            if row:
                await manager.send_file_status(
                    file_id=row.id,
                    status="pending",
                    data={
                        "filename": row.filename,
                        "file_size": row.file_size,
                        "upload_time": row.upload_time.isoformat()
                    }
                )
                return {
                    "id": row.id,
                    "filename": row.filename,
                    "file_size": row.file_size,
                    "status": row.status,
                    "upload_time": row.upload_time.isoformat(),
                    "message": "File uploaded successfully"
                }

    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files")
async def get_all_files():
    """Return all uploaded files with their extraction status."""
    try:
        with engine.connect() as conn:
            rows = conn.execute(
                select(DBUploadedFile).order_by(
                    DBUploadedFile.upload_time.desc()
                )
            ).fetchall()

            files = []
            for row in rows:
                extracted_data = None
                if row.extracted_data:
                    try:
                        extracted_data = json.loads(row.extracted_data)
                    except Exception:
                        pass

                files.append({
                    "id": row.id,
                    "filename": row.filename,
                    "file_size": row.file_size,
                    "file_type": row.file_type,
                    "status": row.status,
                    "upload_time": (
                        row.upload_time.isoformat() if row.upload_time else None
                    ),
                    "extracted_data": extracted_data,
                    "error_message": row.error_message
                })

            return {"files": files}

    except Exception as e:
        print(f"Get files error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/files/{file_id}")
async def delete_file(file_id: int):
    """Delete a file from the database."""
    try:
        with engine.connect() as conn:
            row = conn.execute(
                select(DBUploadedFile).where(DBUploadedFile.id == file_id)
            ).first()

            if not row:
                raise HTTPException(status_code=404, detail="File not found")

            conn.execute(
                delete(DBUploadedFile).where(DBUploadedFile.id == file_id)
            )
            conn.commit()

        await manager.send_file_status(
            file_id=file_id,
            status="deleted",
            data={"filename": row.filename}
        )

        return {"message": "File deleted successfully", "id": file_id}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete file error: {e}")
        raise HTTPException(status_code=500, detail=str(e))