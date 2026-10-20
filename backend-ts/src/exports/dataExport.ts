import JSZip from "jszip";
import type { JobResult } from "../types.js";

export function generateCsv(sequence: number[]): string {
  let csv = "step,from_nail,to_nail\n";
  for (let i = 0; i < sequence.length - 1; i++) {
    csv += `${i + 1},${sequence[i]},${sequence[i + 1]}\n`;
  }
  return csv;
}

export function generateTxtInstructions(result: JobResult): string {
  const sequence = result.sequence || [];
  return sequence.join(", ");
}

export function generateInstructionsJson(result: JobResult): string {
  return JSON.stringify(result, null, 2);
}

export async function generateZipBundle(
  files: Record<string, Buffer | Uint8Array | string>
): Promise<Buffer> {
  const zip = new JSZip();

  for (const [filename, content] of Object.entries(files)) {
    if (typeof content === "string") {
      zip.file(filename, content);
    } else {
      zip.file(filename, content);
    }
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return zipBuffer;
}
