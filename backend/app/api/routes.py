import io
import time
import uuid
from pathlib import Path
from typing import Optional, List

from fastapi import (
    APIRouter,
    Request,
    Response,
    UploadFile,
    File,
    HTTPException,
    Depends,
    Query,
)
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from PIL import Image

from app.config import (
    MAX_UPLOAD_BYTES,
    MAX_PIXELS,
    ALLOWED_IMAGE_TYPES,
    DEFAULT_NAILS,
    DEFAULT_STEPS,
    DEFAULT_DIAMETER_MM,
    DEFAULT_STRENGTH,
    DEFAULT_MIN_GAP,
    DEFAULT_SIZE,
    DEFAULT_ALLOWANCE_PCT,
    UPLOADS_DIR,
)
from app.storage.session import get_or_create_session_id
from app.storage.store import Store
from app.workers.tasks import dispatch_job

router = APIRouter()

ALLOWED_ARTIFACTS = {
    "preview.png": "image/png",
    "target.png": "image/png",
    "nails_template.svg": "image/svg+xml",
    "nails_template_actual_size.pdf": "application/pdf",
    "nails_template_tiled_a4.pdf": "application/pdf",
    "sequence.csv": "text/csv",
    "instructions.json": "application/json",
    "string_art_bundle.zip": "application/zip",
}

class CreateJobRequest(BaseModel):
    upload_id: str
    nails: int = Field(default=DEFAULT_NAILS, ge=50, le=400)
    steps: int = Field(default=DEFAULT_STEPS, ge=10, le=8000)
    size: int = Field(default=DEFAULT_SIZE)
    diameter_mm: float = Field(default=DEFAULT_DIAMETER_MM, ge=50.0, le=2000.0)
    strength: float = Field(default=DEFAULT_STRENGTH, ge=0.02, le=0.30)
    min_gap: int = Field(default=DEFAULT_MIN_GAP, ge=1)
    start_nail: int = Field(default=1, ge=1)
    allowance_pct: float = Field(default=DEFAULT_ALLOWANCE_PCT, ge=0.0, le=100.0)
    crop_box: Optional[List[float]] = None
    rotation: float = 0.0
    brightness: float = 1.0
    contrast: float = 1.0

@router.get("/health")
def health_check():
    return {"status": "ok", "timestamp": time.time()}

@router.post("/api/uploads")
async def upload_image(
    request: Request,
    response: Response,
    file: UploadFile = File(...)
):
    session_id = get_or_create_session_id(request, response)
    
    # 1. Content-Type check (reject SVGs, HTML, executables)
    content_type = file.content_type.lower() if file.content_type else ""
    if "svg" in content_type or file.filename.lower().endswith(".svg"):
        raise HTTPException(status_code=400, detail="SVG uploads are prohibited for security reasons.")
        
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{content_type}'. Please upload JPG, PNG, or WebP images."
        )

    # 2. Size check
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_BYTES // (1024 * 1024)} MB."
        )
    if len(data) < 100:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or corrupted.")

    # 3. Decode & Verify Image integrity (prevent decompression bombs)
    try:
        bio = io.BytesIO(data)
        with Image.open(bio) as img:
            img.verify()
            width, height = img.size
            if width * height > MAX_PIXELS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Image resolution {width}x{height} exceeds maximum security limit."
                )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted image: {str(e)}")

    # 4. Save to persistent volume with generated filename
    upload_id = str(uuid.uuid4())
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".png" if content_type == "image/png" else ".jpg"
        
    safe_path = UPLOADS_DIR / f"{upload_id}{ext}"
    safe_path.write_bytes(data)

    Store.save_upload(
        upload_id=upload_id,
        session_id=session_id,
        original_filename=file.filename or f"upload{ext}",
        file_path=safe_path,
        file_size=len(data),
        width=width,
        height=height
    )

    return {
        "upload_id": upload_id,
        "filename": file.filename,
        "width": width,
        "height": height,
        "size_bytes": len(data)
    }

@router.get("/api/uploads/{upload_id}/preview")
def get_upload_preview(
    upload_id: str,
    request: Request,
    response: Response
):
    session_id = get_or_create_session_id(request, response)
    if not Store.verify_upload_access(upload_id, session_id):
        raise HTTPException(status_code=403, detail="Unauthorized access to this upload.")
        
    upload = Store.get_upload(upload_id)
    if not upload or not Path(upload["file_path"]).exists():
        raise HTTPException(status_code=404, detail="Upload file not found.")
        
    ext = Path(upload["file_path"]).suffix.lower()
    media_type = "image/png" if ext == ".png" else ("image/webp" if ext == ".webp" else "image/jpeg")
    return FileResponse(upload["file_path"], media_type=media_type)

@router.post("/api/jobs")
def create_job(
    payload: CreateJobRequest,
    request: Request,
    response: Response
):
    session_id = get_or_create_session_id(request, response)

    # Validate upload ownership
    if not Store.verify_upload_access(payload.upload_id, session_id):
        raise HTTPException(status_code=403, detail="Unauthorized access to specified upload.")

    if payload.size not in (200, 300, 400):
        raise HTTPException(status_code=400, detail="Processing resolution must be 200, 300, or 400 pixels.")

    if payload.min_gap > payload.nails // 2:
        raise HTTPException(status_code=400, detail=f"min_gap cannot exceed half the nails ({payload.nails // 2}).")

    if payload.start_nail > payload.nails:
        raise HTTPException(status_code=400, detail=f"start_nail ({payload.start_nail}) cannot exceed nails count ({payload.nails}).")

    job_id = str(uuid.uuid4())
    config_dict = payload.model_dump()
    Store.create_job(job_id, session_id, payload.upload_id, config_dict)

    # Dispatch to Celery background worker
    dispatch_job(job_id)

    return {
        "job_id": job_id,
        "status": "queued",
        "config": config_dict
    }

@router.get("/api/jobs/{job_id}")
def get_job_status(
    job_id: str,
    request: Request,
    response: Response
):
    session_id = get_or_create_session_id(request, response)
    if not Store.verify_job_access(job_id, session_id):
        raise HTTPException(status_code=403, detail="Unauthorized access to job.")

    job = Store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "progress_step": job["progress_step"],
        "total_steps": job["total_steps"],
        "current_nail": job["current_nail"],
        "stopping_reason": job["stopping_reason"],
        "error_message": job["error_message"],
        "created_at": job["created_at"],
        "updated_at": job["updated_at"]
    }

@router.post("/api/jobs/{job_id}/cancel")
def cancel_job(
    job_id: str,
    request: Request,
    response: Response
):
    session_id = get_or_create_session_id(request, response)
    if not Store.verify_job_access(job_id, session_id):
        raise HTTPException(status_code=403, detail="Unauthorized access to job.")

    job = Store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job["status"] in ("completed", "failed", "cancelled"):
        return {"job_id": job_id, "status": job["status"], "message": f"Job is already in {job['status']} state."}

    Store.request_job_cancellation(job_id)
    return {"job_id": job_id, "status": "cancelling", "message": "Cancellation requested."}

@router.get("/api/jobs/{job_id}/result")
def get_job_result(
    job_id: str,
    request: Request,
    response: Response
):
    session_id = get_or_create_session_id(request, response)
    if not Store.verify_job_access(job_id, session_id):
        raise HTTPException(status_code=403, detail="Unauthorized access to job.")

    job = Store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed yet (current status: {job['status']})."
        )

    result = job["result"]
    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "stopping_reason": job["stopping_reason"],
        "total_lines": result.get("total_lines", 0),
        "total_thread_m": result.get("total_thread_m", 0),
        "estimated_with_allowance_m": result.get("estimated_with_allowance_m", 0),
        "allowance_pct": result.get("allowance_pct", 15),
        "nails_count": result.get("nails_count", 200),
        "diameter_mm": result.get("diameter_mm", 400),
        "strength": result.get("strength", 0.12),
        "min_gap": result.get("min_gap", 10),
        "start_nail": result.get("start_nail", 1),
        "sequence": result.get("sequence", []),
        "nails_px": result.get("nails_px", []),
        "artifacts": result.get("artifacts", {}),
    }

@router.get("/api/jobs/{job_id}/downloads/{artifact}")
def download_job_artifact(
    job_id: str,
    artifact: str,
    request: Request,
    response: Response
):
    session_id = get_or_create_session_id(request, response)
    if not Store.verify_job_access(job_id, session_id):
        raise HTTPException(status_code=403, detail="Unauthorized access to job.")

    # Whitelist check preventing directory traversal
    if artifact not in ALLOWED_ARTIFACTS:
        raise HTTPException(status_code=404, detail=f"Artifact '{artifact}' is not allowed or does not exist.")

    job_dir = Store.get_job_dir(job_id)
    file_path = job_dir / artifact

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"Artifact file '{artifact}' not found on server.")

    media_type = ALLOWED_ARTIFACTS[artifact]
    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=artifact,
        headers={"Content-Disposition": f'attachment; filename="{artifact}"'}
    )
