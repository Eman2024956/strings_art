import math
import sys
from pathlib import Path
import numpy as np
import pytest

backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.algorithms.line import bresenham_line
from app.algorithms.generator import get_nail_positions, StringArtGenerator

def test_bresenham_line_endpoints_and_bounds():
    p0 = (10, 20)
    p1 = (50, 80)
    ys, xs = bresenham_line(p0, p1)
    
    # Endpoint checks
    assert xs[0] == 10 and ys[0] == 20
    assert xs[-1] == 50 and ys[-1] == 80
    
    # Continuity: no step greater than 1 in x or y
    dx = np.abs(np.diff(xs))
    dy = np.abs(np.diff(ys))
    assert np.all(dx <= 1)
    assert np.all(dy <= 1)
    assert np.all(dx + dy >= 1)  # moves at each step

def test_nail_placement_and_clockwise_numbering():
    nails_count = 100
    center = 150.0
    radius = 140.0
    nails_px, angles = get_nail_positions(nails_count, center, radius)
    
    assert nails_px.shape == (nails_count, 2)
    
    # Nail 1 (index 0) must be at the top (12 o'clock)
    # At top: x == center, y == center - radius
    assert abs(nails_px[0, 0] - center) <= 1.0
    assert abs(nails_px[0, 1] - (center - radius)) <= 1.0
    
    # Nail at quarter way (index 25) must be at 3 o'clock (right)
    # At right: x == center + radius, y == center
    assert abs(nails_px[25, 0] - (center + radius)) <= 1.0
    assert abs(nails_px[25, 1] - center) <= 1.0
    
    # Nail at halfway (index 50) must be at 6 o'clock (bottom)
    assert abs(nails_px[50, 0] - center) <= 1.0
    assert abs(nails_px[50, 1] - (center + radius)) <= 1.0
    
    # Unique check
    unique = np.unique(nails_px, axis=0)
    assert len(unique) == nails_count

def test_string_art_generator_synthetic_continuous_and_gap():
    size = 200
    nails_count = 60
    min_gap = 8
    steps = 40
    
    # Synthetic target: black circle in center
    target = np.zeros((size, size), dtype=np.float32)
    center = (size - 1) / 2.0
    radius = center - 2.0
    yy, xx = np.ogrid[:size, :size]
    mask = (xx - center)**2 + (yy - center)**2 <= radius**2
    # Fill inner circle with 0.8 darkness
    inner_mask = (xx - center)**2 + (yy - center)**2 <= (radius * 0.5)**2
    target[inner_mask] = 0.8
    target[~mask] = 0.0
    
    gen = StringArtGenerator(
        target=target,
        mask=mask,
        nails_count=nails_count,
        steps=steps,
        strength=0.12,
        min_gap=min_gap,
        start_nail=1,
        diameter_mm=400.0
    )
    
    result = gen.run()
    sequence = result["sequence"]
    
    # Must have completed some lines
    assert len(sequence) > 5
    assert sequence[0] == 1  # Started at nail 1
    
    # Verify continuity & minimum circular nail gap
    for idx in range(1, len(sequence)):
        n_prev = sequence[idx - 1]
        n_curr = sequence[idx]
        assert n_prev != n_curr
        # Circular distance between 1-based nails
        diff = abs(n_curr - n_prev)
        circ_gap = min(diff, nails_count - diff)
        assert circ_gap >= min_gap, f"Step {idx}: gap {circ_gap} < {min_gap} between {n_prev} and {n_curr}"

def test_deterministic_generation():
    size = 150
    nails_count = 50
    steps = 25
    
    target = np.zeros((size, size), dtype=np.float32)
    center = (size - 1) / 2.0
    radius = center - 2.0
    yy, xx = np.ogrid[:size, :size]
    mask = (xx - center)**2 + (yy - center)**2 <= radius**2
    target[(xx - center)**2 + (yy - center)**2 <= (radius * 0.4)**2] = 0.7
    
    gen1 = StringArtGenerator(target=target, mask=mask, nails_count=nails_count, steps=steps, min_gap=5)
    res1 = gen1.run()
    
    gen2 = StringArtGenerator(target=target, mask=mask, nails_count=nails_count, steps=steps, min_gap=5)
    res2 = gen2.run()
    
    assert res1["sequence"] == res2["sequence"]
    assert res1["total_lines"] == res2["total_lines"]
