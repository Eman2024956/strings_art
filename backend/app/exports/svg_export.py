import math
from pathlib import Path
import numpy as np

def generate_svg_template(
    output_path: Path,
    nails_count: int,
    diameter_mm: float,
    margin_mm: float = 20.0
) -> Path:
    """
    Generate an SVG nail template with exact physical dimensions in millimeters.
    Nail 1 is at 12 o'clock, with clockwise numbering.
    """
    page_size = diameter_mm + 2 * margin_mm
    c = page_size / 2.0
    r = diameter_mm / 2.0
    
    angles = np.arange(nails_count) * (2.0 * math.pi / nails_count) - (math.pi / 2.0)
    
    # Adjust font size dynamically if many nails to prevent crowding
    font_size = 2.4 if nails_count <= 200 else (1.8 if nails_count <= 300 else 1.4)
    
    svg = [
        f'<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{page_size:.1f}mm" height="{page_size:.1f}mm" viewBox="0 0 {page_size:.2f} {page_size:.2f}">',
        f'  <rect width="100%" height="100%" fill="white"/>',
        f'  <!-- Header information -->',
        f'  <text x="{margin_mm}" y="{margin_mm * 0.7:.1f}" font-family="Arial, sans-serif" font-size="4" font-weight="bold" fill="#333">String Art Template | قطر الدائرة: {diameter_mm:.0f} mm | المسامير: {nails_count}</text>',
        f'  <text x="{margin_mm}" y="{margin_mm * 0.7 + 5:.1f}" font-family="Arial, sans-serif" font-size="2.5" fill="#666">IMPORTANT: Print at 100% / Actual Size (Do not fit/shrink to page) | Nail 1 at Top (12 o\'clock)</text>',
        f'  <!-- Center crosshair -->',
        f'  <line x1="{c - 5}" y1="{c}" x2="{c + 5}" y2="{c}" stroke="#999" stroke-width="0.3"/>',
        f'  <line x1="{c}" y1="{c - 5}" x2="{c}" y2="{c + 5}" stroke="#999" stroke-width="0.3"/>',
        f'  <!-- Outer circular perimeter guideline -->',
        f'  <circle cx="{c:.2f}" cy="{c:.2f}" r="{r:.2f}" fill="none" stroke="#666" stroke-width="0.3" stroke-dasharray="1,1"/>',
    ]
    
    # Draw nails and labels
    for i, a in enumerate(angles):
        nx = c + r * math.cos(a)
        ny = c + r * math.sin(a)
        tx = c + (r + 5.5) * math.cos(a)
        ty = c + (r + 5.5) * math.sin(a)
        
        # Nail mark
        svg.append(f'  <circle cx="{nx:.3f}" cy="{ny:.3f}" r="0.5" fill="#000"/>')
        # Nail number
        svg.append(f'  <text x="{tx:.3f}" y="{ty:.3f}" font-family="Arial, sans-serif" font-size="{font_size}" text-anchor="middle" dominant-baseline="central" fill="#111">{i + 1}</text>')
        
    svg.append('</svg>')
    
    output_path.write_text("\n".join(svg), encoding="utf-8")
    return output_path
