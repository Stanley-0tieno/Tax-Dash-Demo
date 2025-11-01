from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy import select, delete
from database import engine, UploadedFile as DBUploadedFile
from services import extract_from_pdf
from datetime import datetime
import json

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload file WITHOUT extracting data (for demo purposes)
    """
    try:
        # Read file content
        pdf_bytes = await file.read()
        
        # Insert into database with 'pending' status
        with engine.connect() as conn:
            result = conn.execute(
                DBUploadedFile.__table__.insert().values(
                    filename=file.filename,
                    file_size=len(pdf_bytes),
                    file_type=file.content_type or "application/pdf",
                    status="pending",  # Changed from 'uploading' to 'pending'
                    upload_time=datetime.utcnow(),
                    file_content=pdf_bytes  # Store file for later analysis
                )
            )
            conn.commit()
            file_id = result.inserted_primary_key[0]
        
        # Get the created record
        with engine.connect() as conn:
            result = conn.execute(
                select(DBUploadedFile).where(DBUploadedFile.id == file_id)
            ).first()
            
            if result:
                return {
                    "id": result.id,
                    "filename": result.filename,
                    "file_size": result.file_size,
                    "status": result.status,
                    "upload_time": result.upload_time.isoformat(),
                    "message": "File uploaded successfully. Click 'Analyze' to extract data."
                }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/{file_id}")
async def analyze_file(file_id: int):
    """
    Analyze a previously uploaded file (triggers LLM Whisperer extraction)
    """
    try:
        # Get the file from database
        with engine.connect() as conn:
            result = conn.execute(
                select(DBUploadedFile).where(DBUploadedFile.id == file_id)
            ).first()
            
            if not result:
                raise HTTPException(status_code=404, detail="File not found")
            
            if not result.file_content:
                raise HTTPException(status_code=400, detail="File content not found")
            
            # Update status to 'analyzing'
            conn.execute(
                DBUploadedFile.__table__.update()
                .where(DBUploadedFile.__table__.c.id == file_id)
                .values(status="analyzing")
            )
            conn.commit()
        
        # Extract data from PDF
        pdf_bytes = result.file_content
        extracted = extract_from_pdf(pdf_bytes)
        
        # Update database with extracted data
        with engine.connect() as conn:
            if extracted.get("success", False):
                conn.execute(
                    DBUploadedFile.__table__.update()
                    .where(DBUploadedFile.__table__.c.id == file_id)
                    .values(
                        status="completed",
                        extracted_data=json.dumps(extracted.get("data", {}))
                    )
                )
            else:
                conn.execute(
                    DBUploadedFile.__table__.update()
                    .where(DBUploadedFile.__table__.c.id == file_id)
                    .values(
                        status="failed",
                        error_message=extracted.get("error", "Unknown error")
                    )
                )
            conn.commit()
        
        return {
            "id": file_id,
            "status": "completed" if extracted.get("success") else "failed",
            "extracted": extracted,
            "message": "Analysis completed successfully" if extracted.get("success") else "Analysis failed"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        # Update status to failed
        try:
            with engine.connect() as conn:
                conn.execute(
                    DBUploadedFile.__table__.update()
                    .where(DBUploadedFile.__table__.c.id == file_id)
                    .values(status="failed", error_message=str(e))
                )
                conn.commit()
        except:
            pass
        
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-all")
async def analyze_all_pending():
    """
    Analyze all pending files at once (for demo bulk analysis)
    """
    try:
        # Get all pending files
        with engine.connect() as conn:
            pending_files = conn.execute(
                select(DBUploadedFile).where(DBUploadedFile.status == "pending")
            ).fetchall()
        
        if not pending_files:
            return {"message": "No pending files to analyze", "analyzed_count": 0}
        
        analyzed_count = 0
        results = []
        
        for file in pending_files:
            try:
                # Update to analyzing
                with engine.connect() as conn:
                    conn.execute(
                        DBUploadedFile.__table__.update()
                        .where(DBUploadedFile.__table__.c.id == file.id)
                        .values(status="analyzing")
                    )
                    conn.commit()
                
                # Extract data
                extracted = extract_from_pdf(file.file_content)
                
                # Update with results
                with engine.connect() as conn:
                    if extracted.get("success", False):
                        conn.execute(
                            DBUploadedFile.__table__.update()
                            .where(DBUploadedFile.__table__.c.id == file.id)
                            .values(
                                status="completed",
                                extracted_data=json.dumps(extracted.get("data", {}))
                            )
                        )
                        analyzed_count += 1
                    else:
                        conn.execute(
                            DBUploadedFile.__table__.update()
                            .where(DBUploadedFile.__table__.c.id == file.id)
                            .values(
                                status="failed",
                                error_message=extracted.get("error", "Unknown error")
                            )
                        )
                    conn.commit()
                
                results.append({
                    "id": file.id,
                    "filename": file.filename,
                    "status": "completed" if extracted.get("success") else "failed"
                })
            
            except Exception as e:
                # Mark as failed
                with engine.connect() as conn:
                    conn.execute(
                        DBUploadedFile.__table__.update()
                        .where(DBUploadedFile.__table__.c.id == file.id)
                        .values(status="failed", error_message=str(e))
                    )
                    conn.commit()
                
                results.append({
                    "id": file.id,
                    "filename": file.filename,
                    "status": "failed",
                    "error": str(e)
                })
        
        return {
            "message": f"Analysis completed for {analyzed_count} files",
            "analyzed_count": analyzed_count,
            "total_processed": len(pending_files),
            "results": results
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files")
async def get_all_files():
    """
    Get all uploaded files
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(
                select(DBUploadedFile).order_by(DBUploadedFile.upload_time.desc())
            ).fetchall()
            
            files = []
            for row in result:
                extracted_data = None
                if row.extracted_data:
                    try:
                        extracted_data = json.loads(row.extracted_data)
                    except:
                        extracted_data = None
                
                files.append({
                    "id": row.id,
                    "filename": row.filename,
                    "file_size": row.file_size,
                    "file_type": row.file_type,
                    "status": row.status,
                    "upload_time": row.upload_time.isoformat() if row.upload_time else None,
                    "extracted_data": extracted_data,
                    "error_message": row.error_message
                })
            
            return {"files": files}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files/{file_id}")
async def get_file(file_id: int):
    """
    Get specific file by ID
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(
                select(DBUploadedFile).where(DBUploadedFile.id == file_id)
            ).first()
            
            if not result:
                raise HTTPException(status_code=404, detail="File not found")
            
            extracted_data = None
            if result.extracted_data:
                try:
                    extracted_data = json.loads(result.extracted_data)
                except:
                    extracted_data = None
            
            return {
                "id": result.id,
                "filename": result.filename,
                "file_size": result.file_size,
                "file_type": result.file_type,
                "status": result.status,
                "upload_time": result.upload_time.isoformat() if result.upload_time else None,
                "extracted_data": extracted_data,
                "error_message": result.error_message
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/files/{file_id}")
async def delete_file(file_id: int):
    """
    Delete file from database
    """
    try:
        with engine.connect() as conn:
            # Check if file exists
            result = conn.execute(
                select(DBUploadedFile).where(DBUploadedFile.id == file_id)
            ).first()
            
            if not result:
                raise HTTPException(status_code=404, detail="File not found")
            
            # Delete the file
            conn.execute(
                delete(DBUploadedFile).where(DBUploadedFile.id == file_id)
            )
            conn.commit()
            
            return {"message": "File deleted successfully", "id": file_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))