import csv
import json
import sys
import zipfile
from pathlib import Path
import pytest
from reportlab.pdfgen import canvas

backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.exports.svg_export import generate_svg_template
from app.exports.pdf_export import generate_actual_size_pdf, generate_tiled_a4_pdf
from app.exports.data_export import (
    export_sequence_csv,
    export_instructions_json,
    export_preview_png,
    export_target_png,
    build_zip_bundle,
)
import numpy as np

def test_svg_export_dimensions_and_content(tmp_path):
    svg_file = tmp_path / "test.svg"
    diameter_mm = 400.0
    nails_count = 100
    
    generate_svg_template(svg_file, nails_count, diameter_mm, margin_mm=20.0)
    assert svg_file.exists()
    
    content = svg_file.read_text(encoding="utf-8")
    assert 'width="440.0mm"' in content
    assert 'height="440.0mm"' in content
    assert 'viewBox="0 0 440.00 440.00"' in content
    assert "<circle" in content
    assert ">1</text>" in content  # Nail 1
    assert f">{nails_count}</text>" in content

def test_pdf_actual_size_and_tiled(tmp_path):
    pdf_actual = tmp_path / "actual.pdf"
    pdf_tiled = tmp_path / "tiled.pdf"
    diameter_mm = 300.0
    nails_count = 80

    generate_actual_size_pdf(pdf_actual, nails_count, diameter_mm)
    assert pdf_actual.exists()
    assert pdf_actual.stat().st_size > 1000

    generate_tiled_a4_pdf(pdf_tiled, nails_count, diameter_mm, overlap_mm=15.0)
    assert pdf_tiled.exists()
    assert pdf_tiled.stat().st_size > 1000

def test_csv_json_and_zip_bundle(tmp_path):
    seq = [1, 25, 60, 12, 1]
    csv_file = tmp_path / "seq.csv"
    export_sequence_csv(csv_file, seq)
    
    # Read CSV
    with csv_file.open("r", encoding="utf-8") as f:
        reader = list(csv.reader(f))
    assert reader[0] == ["step", "from_nail", "to_nail"]
    assert reader[1] == ["1", "1", "25"]
    assert reader[2] == ["2", "25", "60"]
    assert len(reader) == 5  # header + 4 lines

    # JSON export
    json_file = tmp_path / "instructions.json"
    dummy_result = {
        "nails_count": 80,
        "total_lines": 4,
        "diameter_mm": 400.0,
        "strength": 0.12,
        "min_gap": 10,
        "start_nail": 1,
        "size": 300,
        "total_thread_m": 12.5,
        "allowance_pct": 15.0,
        "estimated_with_allowance_m": 14.38,
        "stopping_reason": "max_steps_reached",
        "nails_px": [[150, 10], [290, 150]],
        "sequence": seq
    }
    dummy_config = {"steps": 100}
    export_instructions_json(json_file, dummy_result, dummy_config)
    assert json_file.exists()
    
    data = json.loads(json_file.read_text(encoding="utf-8"))
    assert data["settings"]["nails_count"] == 80
    assert data["sequence"] == seq

    # Preview and Target images
    canvas_arr = np.zeros((100, 100), dtype=np.float32)
    preview_path = tmp_path / "preview.png"
    target_path = tmp_path / "target.png"
    export_preview_png(preview_path, canvas_arr)
    export_target_png(target_path, canvas_arr)
    assert preview_path.exists()
    assert target_path.exists()

    # ZIP bundle
    zip_path = tmp_path / "bundle.zip"
    build_zip_bundle(
        zip_path,
        {
            "seq.csv": csv_file,
            "instructions.json": json_file,
            "preview.png": preview_path
        }
    )
    assert zip_path.exists()
    with zipfile.ZipFile(zip_path, "r") as z:
        names = z.namelist()
        assert "seq.csv" in names
        assert "instructions.json" in names
        assert "preview.png" in names
