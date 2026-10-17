import math
from pathlib import Path
from typing import List, Tuple
import numpy as np

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

try:
    import arabic_reshaper
    from bidi.algorithm import get_display

    def shape_arabic(text: str) -> str:
        try:
            reshaped = arabic_reshaper.reshape(text)
            return get_display(reshaped)
        except Exception:
            return text
except Exception:
    def shape_arabic(text: str) -> str:
        return text

def draw_nail_disc_to_canvas(
    canv: canvas.Canvas,
    center_x: float,
    center_y: float,
    radius_pt: float,
    nails_count: int,
    font_size: float = 6.0
):
    """Draws circular guideline, nails, and numbers at (center_x, center_y) in points."""
    canv.setStrokeColor(colors.HexColor("#777777"))
    canv.setLineWidth(0.5)
    canv.circle(center_x, center_y, radius_pt, stroke=1, fill=0)

    # Center mark
    canv.setStrokeColor(colors.HexColor("#999999"))
    canv.line(center_x - 10, center_y, center_x + 10, center_y)
    canv.line(center_x, center_y - 10, center_x, center_y + 10)

    # In ReportLab coordinate system, Y points UPWARD.
    # To maintain clockwise numbering with Nail 1 at TOP:
    # 12 o'clock is angle = pi/2.
    # Clockwise means angle decreases as index increases!
    # a_i = pi/2 - i * (2*pi / N)
    angles = (math.pi / 2.0) - (np.arange(nails_count) * (2.0 * math.pi / nails_count))

    canv.setFillColor(colors.black)
    canv.setFont("Helvetica", font_size)

    for i, a in enumerate(angles):
        nx = center_x + radius_pt * math.cos(a)
        ny = center_y + radius_pt * math.sin(a)

        # Draw nail circle dot
        canv.circle(nx, ny, 1.2, stroke=0, fill=1)

        # Text label offset outward by 4.5 mm
        label_offset = 4.5 * mm
        tx = center_x + (radius_pt + label_offset) * math.cos(a)
        ty = center_y + (radius_pt + label_offset) * math.sin(a)

        # Center string around (tx, ty)
        canv.drawCentredString(tx, ty - (font_size * 0.35), str(i + 1))


def generate_actual_size_pdf(
    output_path: Path,
    nails_count: int,
    diameter_mm: float,
    margin_mm: float = 30.0
) -> Path:
    """Generates a single-page 1:1 scale PDF file with custom page size."""
    page_dim_mm = diameter_mm + 2 * margin_mm
    page_w_pt = page_dim_mm * mm
    page_h_pt = page_dim_mm * mm

    c = canvas.Canvas(str(output_path), pagesize=(page_w_pt, page_h_pt))

    center_x = page_w_pt / 2.0
    center_y = page_h_pt / 2.0
    radius_pt = (diameter_mm / 2.0) * mm

    # Title & calibration notice
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin_mm * mm, page_h_pt - 18 * mm, "STRING ART NAILS TEMPLATE (ACTUAL SIZE 1:1)")
    c.setFont("Helvetica", 9)
    c.drawString(
        margin_mm * mm,
        page_h_pt - 23 * mm,
        f"Board Diameter: {diameter_mm:.0f} mm | Total Nails: {nails_count} | Nail 1 is at 12 o'clock (Top)"
    )
    c.setFillColor(colors.HexColor("#cc0000"))
    c.drawString(
        margin_mm * mm,
        page_h_pt - 28 * mm,
        "PRINT AT 100% / ACTUAL SIZE. Do not select 'Fit to Page' or 'Shrink'."
    )
    c.setFillColor(colors.black)

    # 10 cm (100 mm) calibration ruler
    ruler_x = margin_mm * mm
    ruler_y = margin_mm * mm * 0.5
    c.setLineWidth(1)
    c.setStrokeColor(colors.black)
    c.line(ruler_x, ruler_y, ruler_x + 100 * mm, ruler_y)
    for tick_mm in range(0, 101, 10):
        tick_h = 5 * mm if tick_mm % 50 == 0 else (3 * mm if tick_mm % 10 == 0 else 1.5 * mm)
        c.line(ruler_x + tick_mm * mm, ruler_y, ruler_x + tick_mm * mm, ruler_y + tick_h)
        if tick_mm % 20 == 0:
            c.setFont("Helvetica", 6)
            c.drawCentredString(ruler_x + tick_mm * mm, ruler_y + tick_h + 2, f"{tick_mm//10}cm")

    c.setFont("Helvetica-Oblique", 7)
    c.drawString(ruler_x, ruler_y - 8, "Verification Ruler: Confirm 10cm matches physical ruler exactly")

    # Draw template disc
    font_size = 6.0 if nails_count <= 200 else (5.0 if nails_count <= 300 else 4.0)
    draw_nail_disc_to_canvas(c, center_x, center_y, radius_pt, nails_count, font_size=font_size)

    c.showPage()
    c.save()
    return output_path


def generate_tiled_a4_pdf(
    output_path: Path,
    nails_count: int,
    diameter_mm: float,
    overlap_mm: float = 15.0
) -> Path:
    """
    Generates a multi-page tiled A4 PDF for large templates.
    Each page includes:
    - Sliced template section with overlap
    - Alignment crosshairs at overlap borders
    - Grid coordinates (Row X / Col Y)
    - 10cm calibration verification ruler
    - 100% scale print warning
    """
    # Standard A4 in mm: 210 x 297 mm
    page_w_pt, page_h_pt = A4
    page_w_mm = page_w_pt / mm
    page_h_mm = page_h_pt / mm

    page_margin_mm = 12.0
    usable_w_mm = page_w_mm - 2 * page_margin_mm
    usable_h_mm = page_h_mm - 2 * page_margin_mm

    # Step per tile is usable dimension minus overlap
    step_x_mm = usable_w_mm - overlap_mm
    step_y_mm = usable_h_mm - overlap_mm

    total_margin_mm = 20.0
    disc_bound_mm = diameter_mm + 2 * total_margin_mm

    cols = int(math.ceil((disc_bound_mm - overlap_mm) / step_x_mm))
    rows = int(math.ceil((disc_bound_mm - overlap_mm) / step_y_mm))
    cols = max(1, cols)
    rows = max(1, rows)

    c = canvas.Canvas(str(output_path), pagesize=A4)

    full_w_mm = cols * step_x_mm + overlap_mm
    full_h_mm = rows * step_y_mm + overlap_mm
    global_center_x_mm = full_w_mm / 2.0
    global_center_y_mm = full_h_mm / 2.0
    radius_pt = (diameter_mm / 2.0) * mm

    font_size = 6.0 if nails_count <= 200 else (5.0 if nails_count <= 300 else 4.0)
    total_pages = rows * cols
    page_index = 0

    for r in range(rows):
        for col in range(cols):
            page_index += 1

            # Origin of current tile in global mm
            # In PDF Y points up, so top row is highest Y
            tile_origin_x_mm = col * step_x_mm
            tile_origin_y_mm = (rows - 1 - r) * step_y_mm

            # Draw header on current A4 page
            c.setFont("Helvetica-Bold", 10)
            c.drawString(
                page_margin_mm * mm,
                page_h_pt - 8 * mm,
                f"String Art Tiled Template | Row {r + 1} of {rows}, Col {col + 1} of {cols} (Page {page_index} of {total_pages})"
            )
            c.setFont("Helvetica", 7.5)
            c.drawString(
                page_margin_mm * mm,
                page_h_pt - 11.5 * mm,
                f"Board Ø {diameter_mm:.0f} mm | {nails_count} Nails | Overlap: {overlap_mm} mm | Print at 100% Actual Size"
            )

            # Draw calibration ruler on bottom margin
            ruler_x_pt = page_margin_mm * mm
            ruler_y_pt = 6 * mm
            c.setLineWidth(0.8)
            c.setStrokeColor(colors.black)
            c.line(ruler_x_pt, ruler_y_pt, ruler_x_pt + 100 * mm, ruler_y_pt)
            for tick in range(0, 101, 10):
                th = 3 * mm if tick % 50 == 0 else 1.8 * mm
                c.line(ruler_x_pt + tick * mm, ruler_y_pt, ruler_x_pt + tick * mm, ruler_y_pt + th)
                if tick % 50 == 0:
                    c.setFont("Helvetica", 5.5)
                    c.drawCentredString(ruler_x_pt + tick * mm, ruler_y_pt + th + 1.5, f"{tick//10}cm")
            c.setFont("Helvetica-Oblique", 6)
            c.drawString(ruler_x_pt + 105 * mm, ruler_y_pt, "Check: 10cm must match physical ruler exactly")

            # Clipping rectangle for the printable tile area
            clip_x = page_margin_mm * mm
            clip_y = page_margin_mm * mm + 5 * mm
            clip_w = usable_w_mm * mm
            clip_h = usable_h_mm * mm - 10 * mm

            # Draw border around printable tile area
            c.setLineWidth(0.3)
            c.setStrokeColor(colors.HexColor("#dddddd"))
            c.rect(clip_x, clip_y, clip_w, clip_h, stroke=1, fill=0)

            # Draw alignment cut/join marks
            c.setStrokeColor(colors.HexColor("#888888"))
            c.setLineWidth(0.5)
            # Corner crosses
            for cx, cy in [
                (clip_x, clip_y),
                (clip_x + clip_w, clip_y),
                (clip_x, clip_y + clip_h),
                (clip_x + clip_w, clip_y + clip_h),
            ]:
                c.line(cx - 3 * mm, cy, cx + 3 * mm, cy)
                c.line(cx, cy - 3 * mm, cx, cy + 3 * mm)

            # Render the global disc transformed into this tile's coordinate space
            c.saveState()
            # Set clip
            p = c.beginPath()
            p.rect(clip_x, clip_y, clip_w, clip_h)
            c.clipPath(p, stroke=0)

            # Translate canvas so (tile_origin_x_mm, tile_origin_y_mm) is at (clip_x, clip_y)
            offset_x_pt = clip_x - (tile_origin_x_mm * mm)
            offset_y_pt = clip_y - (tile_origin_y_mm * mm)
            c.translate(offset_x_pt, offset_y_pt)

            global_cx_pt = global_center_x_mm * mm
            global_cy_pt = global_center_y_mm * mm

            draw_nail_disc_to_canvas(c, global_cx_pt, global_cy_pt, radius_pt, nails_count, font_size=font_size)

            c.restoreState()
            c.showPage()

    c.save()
    return output_path
