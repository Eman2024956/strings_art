/**
 * High-performance parser and geometry calculator for string art nail sequences.
 * Supports:
 *  - Raw TXT: Comma, space, or newline-separated integers (e.g., "1, 190, 24, 188...")
 *  - Arrow / dash steps: "1 -> 190 -> 24" or "1 -> 190 \n 190 -> 24"
 *  - CSV: Table with columns (e.g. "step,from_nail,to_nail" or "from,to" or single-column "nail")
 *  - JSON: Array of integers or full instructions.json format
 *  - Metadata comments: "# Nails: 200", "# Diameter: 400"
 */

export function parseSequenceText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("File content is empty or invalid.");
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error("File content is empty.");
  }

  // 1. Check if JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const data = JSON.parse(trimmed);
      let seq = [];
      let nailsCount = null;
      let diameterMm = 400.0;
      let allowancePct = 15.0;

      if (Array.isArray(data)) {
        seq = data.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n > 0);
      } else if (typeof data === "object" && data !== null) {
        if (Array.isArray(data.sequence)) {
          seq = data.sequence.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n > 0);
        }
        if (data.settings?.nails_count) nailsCount = parseInt(data.settings.nails_count, 10);
        else if (data.nails_count) nailsCount = parseInt(data.nails_count, 10);
        else if (data.nails) nailsCount = parseInt(data.nails, 10);

        if (data.settings?.diameter_mm) diameterMm = parseFloat(data.settings.diameter_mm);
        else if (data.diameter_mm) diameterMm = parseFloat(data.diameter_mm);

        if (data.statistics?.allowance_pct !== undefined) {
          allowancePct = parseFloat(data.statistics.allowance_pct);
        }
      }

      if (seq.length >= 2) {
        return {
          sequence: seq,
          nailsCount: nailsCount && nailsCount > 0 ? nailsCount : null,
          diameterMm: diameterMm && diameterMm > 0 ? diameterMm : 400.0,
          allowancePct,
        };
      }
    } catch {
      // Continue to CSV / text parsing if JSON parsing fails
    }
  }

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let explicitNailsCount = null;
  let explicitDiameter = 400.0;

  // Extract metadata comments if present (e.g., "# Nails: 200", "// Diameter: 400")
  for (const line of lines) {
    const nailsMatch = line.match(/(?:nails?|pins?)\s*[:=]\s*(\d+)/i);
    if (nailsMatch) {
      explicitNailsCount = parseInt(nailsMatch[1], 10);
    }
    const diaMatch = line.match(/(?:diameter|diam|size)\s*[:=]\s*(\d+(?:\.\d+)?)/i);
    if (diaMatch) {
      explicitDiameter = parseFloat(diaMatch[1]);
    }
  }

  // 2. Check if CSV with header row
  if (lines.length > 1) {
    const headerLine = lines[0].toLowerCase();
    const isCsvHeader = headerLine.includes("from") && headerLine.includes("to");
    if (isCsvHeader) {
      const colIdx = headerLine.split(/[,;\t]/).map((c) => c.trim().toLowerCase());
      const fromIdx = colIdx.findIndex((c) => c.includes("from"));
      const toIdx = colIdx.findIndex((c) => c.includes("to"));

      if (fromIdx !== -1 && toIdx !== -1) {
        const seq = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(/[,;\t]/).map((p) => p.trim());
          const fromN = parseInt(parts[fromIdx], 10);
          const toN = parseInt(parts[toIdx], 10);
          if (!isNaN(fromN) && !isNaN(toN) && fromN > 0 && toN > 0) {
            if (seq.length === 0) {
              seq.push(fromN);
            }
            seq.push(toN);
          }
        }
        if (seq.length >= 2) {
          return {
            sequence: seq,
            nailsCount: explicitNailsCount,
            diameterMm: explicitDiameter,
            allowancePct: 15.0,
          };
        }
      }
    }
  }

  // 3. General delimiter-separated text (commas, spaces, tabs, newlines, arrows, dashes)
  const cleanText = lines
    .filter((l) => !l.startsWith("#") && !l.startsWith("//"))
    .join(" ")
    .replace(/->|➔|→|—/g, " ");

  const tokens = cleanText.match(/\b\d+\b/g);
  if (!tokens || tokens.length < 2) {
    throw new Error(
      "No valid nail sequence found. The text file must contain at least 2 nail numbers (e.g. 1, 190, 24...)."
    );
  }

  const rawNumbers = tokens.map((t) => parseInt(t, 10)).filter((n) => !isNaN(n) && n > 0);

  // If input is repeated pairs [from1, to1, from2, to2...] where to1 === from2
  let finalSequence = [];
  if (rawNumbers.length >= 4 && rawNumbers[1] === rawNumbers[2] && rawNumbers[3] === rawNumbers[4]) {
    finalSequence.push(rawNumbers[0]);
    for (let i = 1; i < rawNumbers.length; i += 2) {
      finalSequence.push(rawNumbers[i]);
    }
  } else {
    finalSequence = rawNumbers;
  }

  if (finalSequence.length < 2) {
    throw new Error("The sequence must have at least 2 consecutive nail steps.");
  }

  return {
    sequence: finalSequence,
    nailsCount: explicitNailsCount,
    diameterMm: explicitDiameter,
    allowancePct: 15.0,
  };
}

/**
 * Builds a full jobResult object from parsed sequence and physical parameters.
 */
export function computeSequenceResult({
  sequence,
  nailsCount = null,
  diameterMm = 400.0,
  allowancePct = 15.0,
  filename = "sequence.txt",
  customJobId = null,
}) {
  if (!sequence || sequence.length < 2) {
    throw new Error("Sequence requires at least 2 steps.");
  }

  const maxNail = Math.max(...sequence);

  // Auto-resolve nailsCount if not explicitly provided
  let resolvedNails = nailsCount;
  if (!resolvedNails || resolvedNails < maxNail) {
    if (maxNail <= 200) {
      resolvedNails = 200;
    } else if (maxNail <= 240) {
      resolvedNails = 240;
    } else if (maxNail <= 280) {
      resolvedNails = 280;
    } else if (maxNail <= 300) {
      resolvedNails = 300;
    } else {
      resolvedNails = Math.ceil(maxNail / 10) * 10;
    }
  }

  const resolvedDiameter = Math.max(50, parseFloat(diameterMm) || 400.0);
  const resolvedAllowance = Math.max(0, parseFloat(allowancePct) || 15.0);

  // Standard calculation resolution
  const size = 300;
  const resCenter = (size - 1) / 2.0;
  const resRadius = resCenter - 2.0;

  // Nail points in internal canvas coordinates
  const nailsPx = [];
  const angleStep = (2.0 * Math.PI) / resolvedNails;
  for (let i = 0; i < resolvedNails; i++) {
    const a = -Math.PI / 2.0 + i * angleStep;
    nailsPx.push([
      parseFloat((resCenter + resRadius * Math.cos(a)).toFixed(2)),
      parseFloat((resCenter + resRadius * Math.sin(a)).toFixed(2)),
    ]);
  }

  // Calculate physical thread length in meters using circular chords
  const radiusMeters = resolvedDiameter / 2000.0;
  let totalThreadMeters = 0;

  for (let i = 1; i < sequence.length; i++) {
    const from = sequence[i - 1];
    const to = sequence[i];
    const diff = Math.abs(from - to);
    const chord = 2.0 * radiusMeters * Math.sin((diff * Math.PI) / resolvedNails);
    totalThreadMeters += chord;
  }

  const totalThreadM = parseFloat(totalThreadMeters.toFixed(1));
  const estimatedWithAllowanceM = parseFloat(
    (totalThreadM * (1.0 + resolvedAllowance / 100.0)).toFixed(1)
  );

  const jobId = customJobId || `imported_${Date.now()}`;

  return {
    job_id: jobId,
    is_imported: true,
    imported_filename: filename,
    sequence,
    nails_count: resolvedNails,
    total_lines: sequence.length - 1,
    size,
    diameter_mm: resolvedDiameter,
    allowance_pct: resolvedAllowance,
    total_thread_m: totalThreadM,
    estimated_with_allowance_m: estimatedWithAllowanceM,
    min_gap: 0,
    start_nail: sequence[0],
    stopping_reason: "uploaded_sequence",
    nails_px: nailsPx,
  };
}

/**
 * Generates an aesthetic geometric string art sample sequence (Cardioid / Mandala).
 * 200 nails, ~1400 steps with beautiful harmonic density.
 */
export function generateSampleSequence(nails = 200, multiplier = 2, totalSteps = 1200) {
  const seq = [1];
  let curr = 1;
  const stepGap = 67; // coprime step generator for rich interlacing

  for (let i = 0; i < totalSteps; i++) {
    // Harmonic jump between complementary arcs
    let next;
    if (i % 2 === 0) {
      next = ((curr * multiplier) % nails) + 1;
      if (Math.abs(next - curr) < 15 || next === curr) {
        next = ((curr + stepGap) % nails) + 1;
      }
    } else {
      next = ((curr + stepGap + (i % 7)) % nails) + 1;
    }
    seq.push(next);
    curr = next;
  }

  return seq;
}
