Act as a senior full-stack engineer specializing in Next.js, Python, image processing, and computational art. Build a complete working String Art Generator web application.

STACK
- Frontend: Next.js App Router with JavaScript (.js/.jsx), React, and Tailwind CSS. Do not use TypeScript.
- Backend: Python with FastAPI, NumPy, and Pillow.
- Background processing: Celery with Redis.
- Deployment: Docker Compose for frontend, API, worker, and Redis.
- Keep image processing in the Python backend.

PRODUCT
Users upload a photo and convert it into a physically executable string art design using one continuous black thread around numbered nails on a circular board.

Build a polished, responsive interface with Arabic RTL and English LTR support, light/dark themes, and clear visual controls.

USER WORKFLOW
1. Upload a JPG, PNG, or WebP image using drag and drop.
2. Crop, rotate, and position the subject inside a circular preview.
3. Adjust brightness, contrast, and grayscale.
4. Set generation parameters.
5. Start processing and display real progress.
6. Compare the processed reference image with the generated string art.
7. Play the thread path as an animation.
8. Download the construction files.

PARAMETERS
- Nails: default 200; range 50–400.
- Maximum thread segments: default 3000; range 100–8000.
- Processing resolution: 200, 300, or 400 pixels.
- Board diameter: default 400 mm.
- Thread darkness: default 0.12; range 0.02–0.30.
- Minimum circular nail gap: default 10.
- Starting nail: default 1.
- Preview and final quality presets.
- Explain that thread darkness is a rendering parameter, not a physical thread thickness measurement.

ALGORITHM
Implement the actual algorithm, with no mocked generation:
- Normalize image orientation using EXIF.
- Composite transparent images onto white.
- Apply the user's crop and adjustments consistently.
- Convert to grayscale and apply a circular mask.
- Position nails uniformly around a circle.
- Nail 1 is at the top; numbering runs clockwise when viewed from the front.
- Maintain a continuous path from the current nail.
- Use Bresenham's line algorithm to calculate line pixels.
- For each eligible next nail, calculate the reduction in total squared image error after adding a black thread segment.
- Account for darkness saturation when evaluating improvement.
- Select the candidate with the largest positive improvement.
- Exclude the current nail, nails inside the minimum circular gap, and immediate reversal to the previous nail.
- Update the rendered canvas and repeat.
- Stop when the requested limit is reached, cancellation is requested, or no candidate improves the result.
- Explain this is a greedy approximation and does not guarantee a globally optimal result.
- Use consistent line rasterization for optimization and exported previews.
- Use the same final nail coordinates and sequence for every export.
- Separate numerical image processing from file export code.

PERFORMANCE
- Never run CPU-heavy generation inside an async request handler.
- Submit work to Celery and return a job ID immediately.
- Vectorize numerical calculations where practical.
- Use bounded caches or bounded precomputation for line coordinates.
- Enforce memory, execution-time, image-size, and parameter limits.
- Configure worker concurrency to avoid exhausting memory.
- Check cancellation between iterations.
- Report actual completed iterations and the stopping reason.
- Do not fabricate completion percentages or remaining-time estimates.

INTERFACE
Create a professional studio workspace:
- Settings sidebar.
- Large central canvas with zoom, pan, and fit-to-screen.
- Original / Processed / String Art / Overlay views.
- Before-and-after comparison.
- Numbered nail visibility toggle.
- Generation status and cancellation.
- Final segment count and estimated thread length.
- Clear loading, empty, validation, and failure states.

CONSTRUCTION PLAYER
- Animate the actual generated sequence.
- Play, pause, next, previous, restart, and speed controls.
- Highlight the current nail, next nail, and active segment.
- Show “Step 125: nail 38 → nail 142”.
- Allow direct navigation to a step.
- Save construction progress locally so the user can resume.
- Keep nail numbering identical across canvas, CSV, JSON, SVG, and PDF.

EXPORTS
Generate real downloadable files:
1. PNG preview.
2. SVG numbered nail template with exact physical dimensions.
3. PDF nail template at actual size.
4. Multi-page A4 tiled PDF for large boards, with overlap, alignment marks, page coordinates, and a calibration ruler.
5. CSV: step, from_nail, to_nail.
6. JSON: generation settings, nail coordinates, units, complete sequence, stopping reason, and thread-length estimate.
7. ZIP containing all exports.

For PDFs, use ReportLab or another appropriate Python library.
Ensure Arabic text uses an embedded Arabic-capable font with correct shaping where needed.
Warn users to print at 100% / Actual Size.
Estimate thread length from physical distances between nails.
Clearly state that the estimate excludes nail wraps, knots, and slack; provide a configurable allowance percentage.
Explain that raster previews approximate the appearance of physical thread.

API
Implement:
- POST /api/uploads
- POST /api/jobs
- GET /api/jobs/{job_id}
- POST /api/jobs/{job_id}/cancel
- GET /api/jobs/{job_id}/result
- GET /api/jobs/{job_id}/downloads/{artifact}
- GET /health

Use polling for job progress initially.
Define explicit queued, running, cancelling, cancelled, completed, and failed states.
Ensure cancellation cannot be overwritten by a later success update.
Return structured validation errors and user-friendly failure messages.

STORAGE AND SECURITY
- Start without account registration.
- Use an anonymous session token in a secure HttpOnly cookie.
- Authorize every job, upload, result, and download against its owning session; a UUID alone is not authorization.
- Store uploads and outputs in a persistent Docker volume outside public static directories.
- Store job ownership and metadata persistently.
- Use generated filenames and safe server-side artifact mappings.
- Verify decoded image format and pixel dimensions; reject corrupt images and decompression bombs.
- Reject SVG uploads.
- Configure rate limits, restrictive CORS, and same-origin protections.
- Never expose internal paths, stack traces, or secrets.
- Provide configurable automatic retention and cleanup.
- Do not delete active job files.
- Do not log uploaded image contents or session credentials.

PROJECT STRUCTURE
/frontend
/backend
  /app
    /api
    /services
    /algorithms
    /workers
    /exports
    /storage
/tests
/docker-compose.yml
/.env.example
/README.md

Keep the Next.js frontend and Python backend independently deployable.
Use a same-origin reverse proxy for the local Docker setup.
Document that long-running Python workers need a suitable container host.

VALIDATION
Add meaningful tests for:
- Bresenham line endpoints and bounds.
- Nail placement and numbering.
- Continuous sequence and minimum nail gap.
- Squared-error reduction after accepted segments.
- Deterministic results for identical inputs.
- Physical SVG/PDF dimensions.
- Agreement between exported sequences.z
- Session isolation for uploads, jobs, and downloads.
- Cancellation and cleanup behavior.

Run a small end-to-end generation using a synthetic image.
Verify that the generated files open and that the A4 template tiles preserve scale.
Test the complete upload → generation → download flow.

DELIVERY
Build the working implementation, not only a plan or UI mockup.
Use real backend generation and real export files.
Include installation instructions, environment variables, Docker commands, API documentation, and an explanation of algorithm limitations.
Run the available checks, fix failures, and report what was verified.