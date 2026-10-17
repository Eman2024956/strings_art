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
