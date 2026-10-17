import numpy as np

def bresenham_line(p0, p1):
    """
    Compute integer coordinates of a line from p0=(x0, y0) to p1=(x1, y1)
    using Bresenham's algorithm. Returns (ys, xs) arrays of int32.
    Includes both endpoints.
    """
    x0, y0 = int(round(p0[0])), int(round(p0[1]))
    x1, y1 = int(round(p1[0])), int(round(p1[1]))
    
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    
    xs = []
    ys = []
    
    curr_x, curr_y = x0, y0
    while True:
        xs.append(curr_x)
        ys.append(curr_y)
        if curr_x == x1 and curr_y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            curr_x += sx
        if e2 <= dx:
            err += dx
            curr_y += sy
            
    return np.array(ys, dtype=np.int32), np.array(xs, dtype=np.int32)
