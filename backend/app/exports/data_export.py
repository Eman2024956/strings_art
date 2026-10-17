import csv
import json
import zipfile
from pathlib import Path
from typing import Dict, Any, List
import numpy as np
from PIL import Image

def export_sequence_csv(output_path: Path, sequence: List[int]) -> Path:
    """
    Export sequence of 1-based nails to CSV:
    step, from_nail, to_nail
    """
    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["step", "from_nail", "to_nail"])
        for i in range(1, len(sequence)):
            writer.writerow([i, sequence[i - 1], sequence[i]])
    return output_path

def export_instructions_json(
    output_path: Path,
    result: Dict[str, Any],
    config: Dict[str, Any]
) -> Path:
    """
    Export comprehensive JSON metadata including:
    - settings
    - physical units
    - nail coordinates
    - 1-based sequence
    - stopping reason
    - physical thread length estimate with allowance
    - construction notes
    """
    sequence = result.get("sequence", [])
    data = {
        "generator": "String Art Studio",
        "units": {
            "diameter": "mm",
            "thread_length": "meters"
        },
        "settings": {
            "nails_count": result.get("nails_count"),
            "steps_requested": config.get("steps"),
            "steps_completed": result.get("total_lines"),
            "diameter_mm": result.get("diameter_mm"),
            "strength": result.get("strength"),
            "min_gap": result.get("min_gap"),
            "start_nail": result.get("start_nail"),
            "resolution_px": result.get("size")
        },
        "statistics": {
            "total_lines": result.get("total_lines"),
            "raw_thread_meters": result.get("total_thread_m"),
            "allowance_pct": result.get("allowance_pct"),
            "estimated_with_allowance_meters": result.get("estimated_with_allowance_m"),
            "stopping_reason": result.get("stopping_reason")
        },
        "nail_layout": {
            "numbering": "Clockwise, Nail 1 at top (12 o'clock), viewed from the front",
            "nails_px": result.get("nails_px", [])
        },
        "notes": [
            "Always print SVG or PDF templates at 100% / Actual Size.",
            "Verify template scale with the 10 cm test ruler before hammering nails.",
            "Thread length estimate accounts for direct span distance. Allowance percentage covers wraps around nails, starting/ending knots, and minor slack.",
            "Raster preview is an optical approximation; physical thread tension and thickness will produce subtle authentic tactile textures."
        ],
        "sequence": sequence
    }
    
    output_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return output_path

def export_preview_png(output_path: Path, canvas_arr: np.ndarray) -> Path:
    """
    Save rendered preview image (0=white, 1=black thread).
    """
    # Invert so black lines are dark on white background
    img_data = np.uint8(np.clip(1.0 - canvas_arr, 0.0, 1.0) * 255)
    img = Image.fromarray(img_data, mode="L")
    img.save(output_path, format="PNG")
    return output_path

def export_target_png(output_path: Path, target_arr: np.ndarray) -> Path:
    """
    Save processed target reference image.
    """
    img_data = np.uint8(np.clip(1.0 - target_arr, 0.0, 1.0) * 255)
    img = Image.fromarray(img_data, mode="L")
    img.save(output_path, format="PNG")
    return output_path

def build_zip_bundle(output_path: Path, files_to_bundle: Dict[str, Path]) -> Path:
    """
    Bundle generated export artifacts into a single ZIP file.
    """
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as z:
        for arcname, file_path in files_to_bundle.items():
            if file_path.exists():
                z.write(file_path, arcname=arcname)
    return output_path
