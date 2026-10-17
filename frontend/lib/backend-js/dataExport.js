import JSZip from "jszip";

export function exportSequenceCsv(sequence) {
  const rows = [["step", "from_nail", "to_nail"]];
  for (let i = 1; i < sequence.length; i++) {
    rows.push([i, sequence[i - 1], sequence[i]]);
  }
  return rows.map((r) => r.join(",")).join("\n");
}

export function exportInstructionsJson(result, config) {
  const data = {
    generator: "String Art Studio (TypeScript / Next.js Engine)",
    units: {
      diameter: "mm",
      thread_length: "meters",
    },
    settings: {
      nails_count: result.nailsCount,
      steps_requested: config.steps,
      steps_completed: result.totalLines,
      diameter_mm: result.diameterMm,
      strength: result.strength,
      min_gap: result.minGap,
      start_nail: result.startNail,
      resolution_px: result.size,
    },
    statistics: {
      total_lines: result.totalLines,
      raw_thread_meters: result.totalThreadM,
      allowance_pct: result.allowancePct,
      estimated_with_allowance_meters: result.estimatedWithAllowanceM,
      stopping_reason: result.stoppingReason,
    },
    nail_layout: {
      numbering: "Clockwise, Nail 1 at top (12 o'clock), viewed from front",
      nails_px: result.nailsPx,
    },
    notes: [
      "Always print SVG or PDF templates at 100% / Actual Size.",
      "Verify template scale with the 10 cm test ruler before hammering nails.",
      "Thread length estimate accounts for direct span distance. Allowance covers wraps around nails, starting/ending knots, and slack.",
    ],
    sequence: result.sequence,
  };
  return JSON.stringify(data, null, 2);
}

export async function buildZipBundle(files) {
  const zip = new JSZip();
  for (const [filename, content] of Object.entries(files)) {
    if (content) {
      zip.file(filename, content);
    }
  }
  return await zip.generateAsync({ type: "nodebuffer" });
}
