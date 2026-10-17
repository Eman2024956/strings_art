import logging
from pathlib import Path
from typing import Dict, Any

from app.config import (
    DEFAULT_NAILS,
    DEFAULT_STEPS,
    DEFAULT_DIAMETER_MM,
    DEFAULT_STRENGTH,
    DEFAULT_MIN_GAP,
    DEFAULT_SIZE,
    DEFAULT_ALLOWANCE_PCT,
)
from app.algorithms.image_ops import process_image
from app.algorithms.generator import StringArtGenerator
from app.storage.store import Store
from app.exports.svg_export import generate_svg_template
from app.exports.pdf_export import generate_actual_size_pdf, generate_tiled_a4_pdf
from app.exports.data_export import (
    export_sequence_csv,
    export_instructions_json,
    export_preview_png,
    export_target_png,
    build_zip_bundle,
)

logger = logging.getLogger(__name__)

def execute_job(job_id: str) -> Dict[str, Any]:
    """
    Main execution pipeline for a string art job.
    Called either directly, in a background thread, or via Celery worker.
    """
    job = Store.get_job(job_id)
    if not job:
        raise ValueError(f"Job {job_id} not found")

    upload_id = job["upload_id"]
    upload = Store.get_upload(upload_id)
    if not upload:
        Store.fail_job(job_id, f"Associated upload {upload_id} not found")
        raise ValueError(f"Upload {upload_id} not found")

    config = job["config"]
    job_dir = Store.get_job_dir(job_id)

    # Extract & sanitize parameters
    size = int(config.get("size", DEFAULT_SIZE))
    nails_count = int(config.get("nails", DEFAULT_NAILS))
    steps = int(config.get("steps", DEFAULT_STEPS))
    strength = float(config.get("strength", DEFAULT_STRENGTH))
    min_gap = int(config.get("min_gap", DEFAULT_MIN_GAP))
    start_nail = int(config.get("start_nail", 1))
    diameter_mm = float(config.get("diameter_mm", DEFAULT_DIAMETER_MM))
    allowance_pct = float(config.get("allowance_pct", DEFAULT_ALLOWANCE_PCT))

    crop_box = config.get("crop_box")
    rotation = float(config.get("rotation", 0))
    brightness = float(config.get("brightness", 1.0))
    contrast = float(config.get("contrast", 1.0))

    try:
        # Check cancellation before starting heavy computation
        if Store.is_job_cancelled(job_id):
            Store.complete_job(job_id, {"total_lines": 0}, "cancelled")
            return {"status": "cancelled"}

        # 1. Process source image
        image_path = Path(upload["file_path"])
        target, mask, _ = process_image(
            image_path=image_path,
            size=size,
            crop_box=crop_box,
            rotation=rotation,
            brightness=brightness,
            contrast=contrast
        )

        # 2. Setup Generator
        generator = StringArtGenerator(
            target=target,
            mask=mask,
            nails_count=nails_count,
            steps=steps,
            strength=strength,
            min_gap=min_gap,
            start_nail=start_nail,
            diameter_mm=diameter_mm,
            allowance_pct=allowance_pct
        )

        def on_progress(step_num: int, total: int, curr_nail: int, gain: float):
            Store.update_job_progress(job_id, step_num, total, curr_nail)

        def is_cancelled() -> bool:
            return Store.is_job_cancelled(job_id)

        # 3. Run algorithm
        Store.update_job_progress(job_id, 0, steps, start_nail)
        gen_result = generator.run(on_progress=on_progress, is_cancelled=is_cancelled)

        # Pop canvas array immediately so gen_result is cleanly JSON serializable
        canvas_arr = gen_result.pop("canvas", None)
        stopping_reason = gen_result["stopping_reason"]
        
        if stopping_reason == "cancelled" or Store.is_job_cancelled(job_id):
            Store.complete_job(job_id, gen_result, "cancelled")
            return {"status": "cancelled"}

        # 4. Generate all export artifacts
        sequence = gen_result["sequence"]

        preview_path = job_dir / "preview.png"
        export_preview_png(preview_path, canvas_arr)

        target_path = job_dir / "target.png"
        export_target_png(target_path, target)

        svg_path = job_dir / "nails_template.svg"
        generate_svg_template(svg_path, nails_count, diameter_mm)

        pdf_actual_path = job_dir / "nails_template_actual_size.pdf"
        generate_actual_size_pdf(pdf_actual_path, nails_count, diameter_mm)

        pdf_tiled_path = job_dir / "nails_template_tiled_a4.pdf"
        generate_tiled_a4_pdf(pdf_tiled_path, nails_count, diameter_mm)

        csv_path = job_dir / "sequence.csv"
        export_sequence_csv(csv_path, sequence)

        json_path = job_dir / "instructions.json"
        export_instructions_json(json_path, gen_result, config)

        zip_path = job_dir / "string_art_bundle.zip"
        build_zip_bundle(
            zip_path,
            {
                "preview.png": preview_path,
                "target.png": target_path,
                "nails_template.svg": svg_path,
                "nails_template_actual_size.pdf": pdf_actual_path,
                "nails_template_tiled_a4.pdf": pdf_tiled_path,
                "sequence.csv": csv_path,
                "instructions.json": json_path,
            }
        )

        gen_result["artifacts"] = {
            "preview_png": "preview.png",
            "target_png": "target.png",
            "nails_template_svg": "nails_template.svg",
            "nails_template_actual_size_pdf": "nails_template_actual_size.pdf",
            "nails_template_tiled_a4_pdf": "nails_template_tiled_a4.pdf",
            "sequence_csv": "sequence.csv",
            "instructions_json": "instructions.json",
            "bundle_zip": "string_art_bundle.zip",
        }

        # 5. Mark completed
        Store.complete_job(job_id, gen_result, stopping_reason)
        return {"status": "completed", "result": gen_result}

    except Exception as e:
        logger.exception("Error executing job %s: %s", job_id, e)
        Store.fail_job(job_id, str(e))
        raise
