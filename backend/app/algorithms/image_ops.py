from PIL import Image, ImageOps, ImageEnhance
import numpy as np

def process_image(
    image_path,
    size=300,
    crop_box=None,
    rotation=0,
    brightness=1.0,
    contrast=1.0,
):
    """
    Process an uploaded image into normalized target grayscale values:
    - Normalizes EXIF orientation
    - Composites transparent images onto a solid white background
    - Applies rotation & crop box if provided
    - Applies brightness and contrast enhancements
    - Fits into (size, size) circle using Lanczos resampling
    - Returns target numpy float32 array (0.0=white, 1.0=black) and binary mask
    """
    with Image.open(image_path) as img:
        # Prevent decompression bomb
        img.verify()
        
    with Image.open(image_path) as img:
        # EXIF transposition
        img = ImageOps.exif_transpose(img)
        
        # Composite transparent onto white
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img = img.convert("RGBA")
            bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
            bg.alpha_composite(img)
            img = bg.convert("RGB")
        else:
            img = img.convert("RGB")
            
        # Optional user rotation (degrees counter-clockwise or clockwise)
        if rotation != 0:
            # expand=True to preserve borders if rotating free angle
            img = img.rotate(-rotation, expand=True, resample=Image.Resampling.BICUBIC, fillcolor=(255, 255, 255))
            
        # Optional user crop: [left, top, right, bottom]
        if crop_box and len(crop_box) == 4:
            l, t, r, b = crop_box
            w, h = img.size
            # Normalize or clamp coordinates
            l = max(0, min(w, l))
            t = max(0, min(h, t))
            r = max(l + 1, min(w, r))
            b = max(t + 1, min(h, b))
            img = img.crop((l, t, r, b))
            
        # Adjustments
        if brightness != 1.0:
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(max(0.1, float(brightness)))
            
        if contrast != 1.0:
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(max(0.1, float(contrast)))
            
        # Convert to grayscale
        gray = img.convert("L")
        
        # Fit into square (size, size) preserving aspect ratio by center cropping
        fitted = ImageOps.fit(gray, (size, size), method=Image.Resampling.LANCZOS)
        
        # Target: 0.0 is white, 1.0 is black
        target = 1.0 - np.asarray(fitted, dtype=np.float32) / 255.0
        
        # Circular mask
        center = (size - 1) / 2.0
        radius = center - 2.0
        yy, xx = np.ogrid[:size, :size]
        mask = (xx - center)**2 + (yy - center)**2 <= radius**2
        target[~mask] = 0.0
        
        return target, mask, fitted
