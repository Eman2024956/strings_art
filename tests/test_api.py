import io
import time
import uuid
from PIL import Image, ImageDraw
import pytest
import sys
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from app.main import app
from app.storage.store import Store
from app.services.job_service import execute_job

client = TestClient(app)

def create_synthetic_png_bytes(width=120, height=120):
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    # Draw a dark circle in the center
    draw.ellipse([(30, 30), (90, 90)], fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_reject_svg_upload():
    svg_content = b"<svg><circle cx='50' cy='50' r='40'/></svg>"
    res = client.post(
        "/api/uploads",
        files={"file": ("test.svg", svg_content, "image/svg+xml")}
    )
    assert res.status_code == 400
    assert "SVG uploads are prohibited" in res.json()["detail"]

def test_upload_and_session_isolation():
    # Session 1 uploads an image
    client1 = TestClient(app)
    img_bytes = create_synthetic_png_bytes()
    res1 = client1.post(
        "/api/uploads",
        files={"file": ("portrait.png", img_bytes, "image/png")}
    )
    assert res1.status_code == 200
    upload_id = res1.json()["upload_id"]
    assert upload_id is not None
    assert "string_art_session" in res1.cookies

    # Session 2 tries to access Session 1's upload preview -> 403 Forbidden
    client2 = TestClient(app)
    res2 = client2.get(f"/api/uploads/{upload_id}/preview")
    assert res2.status_code == 403

    # Session 2 tries to create a job with Session 1's upload -> 403 Forbidden
    res3 = client2.post(
        "/api/jobs",
        json={"upload_id": upload_id, "nails": 100, "steps": 50, "size": 200}
    )
    assert res3.status_code == 403

def test_end_to_end_job_and_downloads():
    session_client = TestClient(app)
    img_bytes = create_synthetic_png_bytes()
    res_up = session_client.post(
        "/api/uploads",
        files={"file": ("face.png", img_bytes, "image/png")}
    )
    assert res_up.status_code == 200
    upload_id = res_up.json()["upload_id"]

    # Create job with fast parameters
    res_job = session_client.post(
        "/api/jobs",
        json={
            "upload_id": upload_id,
            "nails": 60,
            "steps": 30,
            "size": 200,
            "diameter_mm": 350.0,
            "strength": 0.12,
            "min_gap": 6,
            "start_nail": 1
        }
    )
    assert res_job.status_code == 200
    job_id = res_job.json()["job_id"]

    # Since dispatch_job runs in background, execute_job directly or wait
    execute_job(job_id)

    # Check status
    res_status = session_client.get(f"/api/jobs/{job_id}")
    assert res_status.status_code == 200
    assert res_status.json()["status"] == "completed"

    # Check result
    res_res = session_client.get(f"/api/jobs/{job_id}/result")
    assert res_res.status_code == 200
    data = res_res.json()
    assert data["total_lines"] > 0
    assert len(data["sequence"]) > 0
    assert data["diameter_mm"] == 350.0

    # Test downloading artifacts
    for artifact in [
        "preview.png",
        "target.png",
        "nails_template.svg",
        "nails_template_actual_size.pdf",
        "nails_template_tiled_a4.pdf",
        "sequence.csv",
        "instructions.json",
        "string_art_bundle.zip"
    ]:
        res_dl = session_client.get(f"/api/jobs/{job_id}/downloads/{artifact}")
        assert res_dl.status_code == 200
        assert len(res_dl.content) > 0

    # Session 2 cannot download artifacts from Session 1
    unauth_client = TestClient(app)
    res_unauth = unauth_client.get(f"/api/jobs/{job_id}/downloads/preview.png")
    assert res_unauth.status_code == 403

def test_cancellation_flow():
    session_client = TestClient(app)
    img_bytes = create_synthetic_png_bytes()
    res_up = session_client.post(
        "/api/uploads",
        files={"file": ("face.png", img_bytes, "image/png")}
    )
    upload_id = res_up.json()["upload_id"]
    session_id = res_up.cookies.get("string_art_session")

    job_id = f"test-cancel-{uuid.uuid4()}"
    config = {"nails": 80, "steps": 200, "size": 200}
    Store.create_job(job_id, session_id, upload_id, config)

    # 1. Request cancellation on queued job
    res_cancel = session_client.post(f"/api/jobs/{job_id}/cancel")
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "cancelling"

    # 2. Execute the job - it should detect cancellation and complete as cancelled
    execute_job(job_id)

    res_status = session_client.get(f"/api/jobs/{job_id}")
    assert res_status.status_code == 200
    assert res_status.json()["status"] == "cancelled"

    # 3. Verify requirement: Ensure cancellation cannot be overwritten by a later success update
    Store.complete_job(job_id, {"total_lines": 100}, "max_steps_reached")
    res_check = session_client.get(f"/api/jobs/{job_id}")
    assert res_check.json()["status"] == "cancelled"
