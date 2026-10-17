import math
from typing import Callable, Optional, Dict, Tuple, List, Any
import numpy as np
from PIL import Image

from app.algorithms.line import bresenham_line

def get_nail_positions(
    nails_count: int,
    center: float,
    radius: float
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Compute nail coordinates (x, y) and angles in radians.
    Nail 1 (index 0) is at the top (-pi/2), and numbering proceeds clockwise.
    Returns:
        nails_px: (N, 2) int array [x, y]
        angles: (N,) float array in radians
    """
    # Nail 1 is at top (-pi/2), angle increases clockwise:
    # In screen coordinates (x right, y down), angle + theta rotates clockwise
    angles = np.arange(nails_count) * (2.0 * np.pi / nails_count) - (np.pi / 2.0)
    xs = center + radius * np.cos(angles)
    ys = center + radius * np.sin(angles)
    nails_px = np.rint(np.column_stack((xs, ys))).astype(np.int32)
    return nails_px, angles

class StringArtGenerator:
    def __init__(
        self,
        target: np.ndarray,
        mask: np.ndarray,
        nails_count: int = 200,
        steps: int = 3000,
        strength: float = 0.12,
        min_gap: int = 10,
        start_nail: int = 1,
        diameter_mm: float = 400.0,
        allowance_pct: float = 15.0
    ):
        self.target = target
        self.mask = mask
        self.size = target.shape[0]
        self.nails_count = nails_count
        self.steps = steps
        self.strength = float(strength)
        self.min_gap = min_gap
        self.start_nail = max(1, min(nails_count, start_nail))
        self.diameter_mm = float(diameter_mm)
        self.allowance_pct = float(allowance_pct)
        
        self.center = (self.size - 1) / 2.0
        self.radius = self.center - 2.0
        self.nails_px, self.angles = get_nail_positions(self.nails_count, self.center, self.radius)
        
        # Verify no two nails occupy identical pixel coordinates
        unique_nails = np.unique(self.nails_px, axis=0)
        if len(unique_nails) != self.nails_count:
            raise ValueError(
                f"Nail overlap detected: {len(unique_nails)} unique pixel locations for {self.nails_count} nails. "
                f"Please increase processing resolution or reduce nail count."
            )
            
        # Bounded on-demand line cache
        self.line_cache: Dict[Tuple[int, int], Tuple[np.ndarray, np.ndarray]] = {}

    def _get_line_pixels(self, i: int, j: int) -> Tuple[np.ndarray, np.ndarray]:
        key = (i, j) if i < j else (j, i)
        cached = self.line_cache.get(key)
        if cached is not None:
            return cached
            
        ys, xs = bresenham_line(self.nails_px[i], self.nails_px[j])
        # Exclude nail endpoints so nails do not falsely over-saturate
        if len(ys) > 2:
            ys = ys[1:-1]
            xs = xs[1:-1]
            valid = self.mask[ys, xs]
            ys = ys[valid]
            xs = xs[valid]
        else:
            ys = np.empty(0, dtype=np.int32)
            xs = np.empty(0, dtype=np.int32)
            
        self.line_cache[key] = (ys, xs)
        return ys, xs

    def run(
        self,
        on_progress: Optional[Callable[[int, int, int, float], None]] = None,
        is_cancelled: Optional[Callable[[], bool]] = None
    ) -> Dict[str, Any]:
        """
        Execute greedy string generation.
        Returns result dict with canvas, sequence (1-based), statistics, and stopping reason.
        """
        canvas = np.zeros_like(self.target, dtype=np.float32)
        current = self.start_nail - 1
        sequence = [current]
        previous = -1
        length_px = 0.0
        stopping_reason = "max_steps_reached"
        
        last_reported_step = 0
        
        for step in range(self.steps):
            if is_cancelled and is_cancelled():
                stopping_reason = "cancelled"
                break
                
            best_gain = 0.0
            best_choice = None
            
            for j in range(self.nails_count):
                if j == current:
                    continue
                gap = min(abs(j - current), self.nails_count - abs(j - current))
                if gap < self.min_gap or j == previous:
                    continue
                    
                ys, xs = self._get_line_pixels(current, j)
                if len(ys) == 0:
                    continue
                    
                old_vals = canvas[ys, xs]
                delta = np.minimum(self.strength, 1.0 - old_vals)
                residual = self.target[ys, xs] - old_vals
                gain = float(np.sum(2.0 * residual * delta - delta * delta))
                
                if gain > best_gain:
                    best_gain = gain
                    best_choice = (j, ys, xs, delta)
                    
            if best_choice is None or best_gain <= 0.0:
                stopping_reason = "no_improvement"
                break
                
            j, ys, xs, delta = best_choice
            canvas[ys, xs] += delta
            
            p1 = self.nails_px[current]
            p2 = self.nails_px[j]
            seg_len = float(math.hypot(p2[0] - p1[0], p2[1] - p1[1]))
            length_px += seg_len
            
            previous = current
            current = j
            sequence.append(current)
            
            # Progress reporting throttle (every 25 steps or last step)
            step_num = step + 1
            if on_progress and (step_num - last_reported_step >= 25 or step_num == self.steps):
                on_progress(step_num, self.steps, current + 1, best_gain)
                last_reported_step = step_num
                
        # Calculate physical lengths
        scale_mm_per_px = self.diameter_mm / (2.0 * self.radius)
        total_length_mm = length_px * scale_mm_per_px
        total_length_m = total_length_mm / 1000.0
        estimated_with_allowance_m = total_length_m * (1.0 + self.allowance_pct / 100.0)
        
        # 1-based sequence for users and exports
        sequence_1based = [idx + 1 for idx in sequence]
        
        return {
            "canvas": canvas,
            "sequence": sequence_1based,
            "total_lines": len(sequence_1based) - 1,
            "length_px": round(length_px, 2),
            "total_thread_m": round(total_length_m, 2),
            "estimated_with_allowance_m": round(estimated_with_allowance_m, 2),
            "allowance_pct": self.allowance_pct,
            "stopping_reason": stopping_reason,
            "nails_count": self.nails_count,
            "diameter_mm": self.diameter_mm,
            "strength": self.strength,
            "min_gap": self.min_gap,
            "start_nail": self.start_nail,
            "size": self.size,
            "nails_px": self.nails_px.tolist(),
        }
