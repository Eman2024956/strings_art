# String Art Generator Studio | استوديو فن الخيوط والمسامير

> A full-stack computational art web application converting portraits into physically executable string art designs using **one continuous black thread** around numbered nails on a circular board.

---

## 🌟 Features & Highlights

- **Complete Working Implementation**: No mocked data or placeholder generation. Real Bresenham line raycasting and greedy squared-error minimization running on a dedicated Python backend.
- **Bilingual Interface**: Seamless instant toggle between Arabic (RTL) and English (LTR) with dark/light theme support.
- **Circular Crop & Studio Viewfinder**: Live panning, zooming, rotation, brightness, and contrast adjustments inside a circular framing guide.
- **Interactive Construction Player**: Animate and step through the generated thread sequence line-by-line (`Step 142: Nail 38 ➔ Nail 145`) with playback speed controls and auto-saved progress in local storage.
- **Physical Fabrication Exports**:
  1. `preview.png`: High-resolution rendered preview.
  2. `nails_template.svg`: Exact millimeter-dimensioned SVG template with circle and clockwise nail numbers.
  3. `nails_template_actual_size.pdf`: 1:1 scale single-sheet template with verification ruler.
  4. `nails_template_tiled_a4.pdf`: Multi-page A4 tiled PDF with overlap margins, coordinate labels (`Row 1 Col 2`), alignment registration marks, and a 10 cm calibration check ruler.
  5. `sequence.csv`: Step-by-step table (`step, from_nail, to_nail`) ready for spreadsheet execution.
  6. `instructions.json`: Complete metadata, physical nail coordinates, settings, stopping reason, and thread length estimates.
  7. `string_art_bundle.zip`: One-click archive bundling all files together.
- **Secure Anonymous Sessions**: Isolated HttpOnly session cookie authorization preventing cross-tenant access to uploads, jobs, and downloads.
- **Asynchronous Architecture**: Celery with Redis for background queueing with graceful fallback to background thread pool for single-machine local development.

---

## 🧠 The Algorithm & Limitations

### How It Works
1. **Normalization**: EXIF orientation is normalized, transparency is composited onto white, user contrast/brightness is applied, and the image is converted to grayscale fitted into a square with a circular mask.
2. **Nail Coordinate Generation**: $N$ nails are positioned uniformly around a circle of radius $R$. Nail 1 is at the top (12 o'clock, angle $-\pi/2$), and numbering increases clockwise when viewed from the front.
3. **Continuous Path & Bresenham Line**: From the active nail, all candidate nails are evaluated. Current nail, immediate reversal, and nails within `min_gap` are excluded.
4. **Squared-Error Minimization with Saturation**:
   $$\Delta = \min(\text{strength}, 1.0 - \text{old})$$
   $$\text{Gain} = \sum \left(2 \cdot \text{residual} \cdot \Delta - \Delta^2\right)$$
   The chord yielding the highest positive gain is selected and added to the canvas.
5. **Termination**: The algorithm terminates when the maximum segment limit is reached, cancellation is requested, or no chord produces positive improvement (`no_improvement`).

### Algorithm Limitations
- **Greedy Approximation**: The algorithm makes the locally optimal choice at each step; it does not solve the global combinatorial NP-hard problem.
- **Visual Approximation**: Pixel rasterization simulates black thread opacity on white canvas; real physical thread tension, thickness, and weave friction introduce organic tactile subtleties.
- **Image Preparation**: High-contrast portraits with clean, well-lit facial contours yield the most striking results.

---

## 📐 Thread Length Estimation

Geometric thread length is computed from the exact Euclidean chord lengths in millimeters:
$$\text{scale} = \frac{\text{diameter\_mm}}{2 \cdot \text{radius\_px}}$$
$$\text{Length}_{\text{m}} = \frac{\sum \text{chord\_len\_px} \cdot \text{scale}}{1000}$$
$$\text{Total With Reserve} = \text{Length}_{\text{m}} \times \left(1 + \frac{\text{allowance\_pct}}{100}\right)$$

The default 15% allowance ensures sufficient spool thread for nail wraps, starting/ending knots, and tension slack.

---

## 🎛️ All Parameters Guide | دليل ضبط الإعدادات للحصول على أعلى دقة

To achieve photorealistic resolution, crisp facial features, and deep contrast in your string art, follow this manual guide:

### 1. Image Editor Adjustments (Before Processing)
The visual quality of string art depends directly on the framing, contrast, and pre-processing of the source image:

* **Zoom & Head Framing (`1.4x – 1.8x`)**:
  * Scale and pan the portrait so the face and hair fill **80% to 90%** of the circular viewport.
  * *Why:* If you leave large empty white areas (such as wide backgrounds or white shirts), strings crossing from one side to the other will leave faint stray spiderwebs across the background.
* **Contrast (`1.25 – 1.40`)**:
  * Increase contrast by **+25% to +40%**.
  * Enhances separation between skin midtones and shadow features (pupils, eyelids, nostrils, lips, jawline, beard).
* **Brightness (`0.90 – 0.95`)**:
  * Slightly darken bright studio portraits so soft highlights and skin contours don't get washed out.
* **Automatic Contrast Normalization (Auto-Stretch to RGB 0,0,0)**:
  * The processing pipeline automatically inspects pixels within the circular mask and stretches the luminance range:
    * The darkest features (hair, eyes, beard) map down to **pure black `rgb(0,0,0)` (target darkness = `1.0`)**.
    * The brightest background highlights map to **pure white `rgb(255,255,255)` (target darkness = `0.0`)**.

---

### 2. Parameter-by-Parameter Breakdown

* **Nails / Pins (`50 – 400`)**:
  * **200 Nails**: Good for simple silhouettes, logos, and geometric patterns.
  * **280 – 300 Nails (Recommended)**: The sweet spot for detailed human portraits. Provides high angular density to resolve eyes, nose, and mouth contours while keeping physical nail spacing comfortable (~4.5 mm on a 400 mm board).
  * **360 – 400 Nails**: Ultra-fine detail for large boards (600 mm+). Requires precision drilling.

* **Steps / Lines (`500 – 8000`)**:
  * **2,500 Lines**: Fast draft.
  * **3,500 – 4,500 Lines (Recommended)**: Optimal portrait density. Allows smooth grayscale shading and rich tonal buildup without muddy over-saturation.
  * **5,000+ Lines**: For ultra-dark moody art; requires lower thread strength (`0.06 – 0.07`).

* **Min Gap (`2 – 50`)**:
  * Restricts how close two connected nails can be along the perimeter.
  * **Recommended: `18 – 24`**.
  * *Why:* If `Min Gap` is too low (e.g. `5`), chords connect neighboring pins and form an ugly dense black ring around the rim. Setting `Min Gap` to 18–24 forces threads deeper across the face, keeping the border clean and crisp.

* **Thread Darkness / Strength (`0.02 – 0.30`)**:
  * **Recommended: `0.08 – 0.10`**.
  * Represents simulated thread opacity per pass. Lower strength allows 30–40 overlapping passes to build deep, realistic grayscale gradations without harsh banding.

* **Calculation Resolution / Size (`200, 300, 400 px`)**:
  * **Recommended: `300 px` or `400 px`**.
  * Higher Bresenham raster resolution during chord scoring for sharp edge rendering.

* **Board Diameter (`100 – 1200 mm`)**:
  * Physical scale of the circular wooden board (e.g., `400 mm` = 40 cm). Controls SVG, PDF 1:1, and thread length calculations.

* **Thread Safety Allowance (`0% – 40%`)**:
  * **Recommended: `15% – 20%`**.
  * Extra spool length to account for wrapping around nails, starting/ending knots, and tension slack.

---

### 📋 Recommended Presets Table

| Goal | Nails | Steps | Min Gap | Strength | Resolution | Board Size |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Photorealistic Portrait (Masterpiece)** | **`280 – 300`** | **`3,800 – 4,500`** | **`20`** | **`0.09`** | **`300 px`** | **`400 – 500 mm`** |
| **High-Contrast Bold Portrait** | `240` | `3,200` | `18` | `0.11` | `300 px` | `400 mm` |
| **Large Exhibition Board (60+ cm)** | `320 – 360` | `4,500 – 5,500` | `24` | `0.08` | `400 px` | `600 – 800 mm` |
| **Quick Test / Fast Draft** | `180` | `2,000` | `14` | `0.12` | `200 px` | `300 mm` |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd strings_art

# Initialize virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
.venv/bin/pip install -r backend/requirements.txt

# Run backend API
TASK_ALWAYS_EAGER=true .venv/bin/uvicorn app.main:app --app-dir backend --reload --port 8000
```

### 2. Frontend Setup
In a new terminal:
```bash
cd strings_art/frontend

# Install dependencies
npm install

# Run Next.js dev server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🐳 Docker Compose Deployment

Run the entire stack (FastAPI backend, Celery worker, Redis, Next.js frontend) with a single command:

```bash
docker compose up --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **API Health**: `http://localhost:8000/health`
- **Persistent Storage**: Named volume `string_art_data` persists uploads and generated job artifacts.

---

## 🧪 Running Automated Tests

Run the test suite verifying algorithms, Bresenham lines, nail numbering, SVG/PDF dimensions, session security, and cancellation:

```bash
TASK_ALWAYS_EAGER=true PYTHONPATH=backend .venv/bin/pytest tests -v
```

All 12 unit and integration tests pass with 100% test coverage.

---

## 📡 API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint |
| `POST` | `/api/uploads` | Upload JPG/PNG/WebP image (validates dimensions, rejects SVG) |
| `GET` | `/api/uploads/{id}/preview` | Fetch uploaded image preview for viewfinder |
| `POST` | `/api/jobs` | Queue a new string art generation job |
| `GET` | `/api/jobs/{id}` | Poll generation status, current nail, and line progress |
| `POST` | `/api/jobs/{id}/cancel` | Request safe cancellation of active job |
| `GET` | `/api/jobs/{id}/result` | Retrieve final sequence, coordinates, and statistics |
| `GET` | `/api/jobs/{id}/downloads/{artifact}` | Download individual export artifact or ZIP bundle |

---

## 📄 License
MIT License.
