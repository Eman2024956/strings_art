/**
 * High-performance TypeScript library for String Art computational generation
 * and physical export templates (Pure library without Express server).
 */

export * from "./types.js";
export * from "./config.js";
export { Store } from "./store/store.js";
export { dispatchJob, getJobStatus, listJobsForSession } from "./services/jobRunner.js";
export { computeCircularPins, computeSquarePins, bresenhamLine, precomputePinLines, runGreedyStringArt } from "./core/algorithm.js";
export { generateSvgTemplate, renderStringArtPreviewPng } from "./exports/svgExport.js";
export { generateActualSizePdf, generateTiledA4Pdf } from "./exports/pdfExport.js";
export { exportSequenceCsv, exportSequenceTxt, exportInstructionsJson, buildZipBundle } from "./exports/dataExport.js";

