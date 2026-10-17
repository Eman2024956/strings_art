# String Art Backend (TypeScript / Node.js) 🧶

High-performance computational engine and REST API for generating circular String Art blueprints and physical exports.

## Features
- **Pure TypeScript & Node.js Engine**: Bresenham pin-pair precomputation, greedy squared error minimization with thread opacity and chord length physics.
- **Image Processing**: Fast circular crop, rotation, brightness/contrast correction, and circular mask using `sharp`.
- **Physical Print Exports**:
  - `nails_template.svg`: Scalable vector template.
  - `nails_template_actual_size.pdf`: Exact 1:1 blueprint with calibration ruler.
  - `nails_template_tiled_a4.pdf`: Multi-page tiled A4 printable template with cut/tape alignment guides.
  - `sequence.csv`: Step-by-step pin weaving sequence.
  - `instructions.json`: Full physical specs and thread meter calculations.
  - `string_art_bundle.zip`: Complete zip bundle of all files.
- **Identical REST API**: 100% compatible with the Python FastAPI endpoints.

---

## Getting Started

### Local Development
```bash
cd backend-ts
npm install
npm run dev
```

### Production Build & Run
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t string-art-backend-ts .
docker run -p 8000:8000 string-art-backend-ts
```

---

## API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check & engine status |
| `POST` | `/api/uploads` | Upload image (JPG, PNG, WebP) |
| `GET` | `/api/uploads/:id/preview` | Stream uploaded image |
| `POST` | `/api/jobs` | Start string art generation job |
| `GET` | `/api/jobs/:id` | Poll progress & current pin status |
| `POST` | `/api/jobs/:id/cancel` | Cancel in-flight job |
| `GET` | `/api/jobs/:id/result` | Retrieve completed result & sequence |
| `GET` | `/api/jobs/:id/downloads/:artifact` | Download physical exports (PDF, SVG, ZIP, etc.) |
