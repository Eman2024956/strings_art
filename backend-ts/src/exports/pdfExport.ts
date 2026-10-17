import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const MM_TO_PT = 72.0 / 25.4; // 1 mm in PDF points (approx 2.8346 pt)

/**
 * Generates an actual size 1:1 physical template PDF with millimeter accuracy
 */
export async function generateActualSizePdf(
  nailsCount: number,
  diameterMm: number,
  title = "String Art Pin Template (1:1 Actual Size)"
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const marginMm = 30.0;
  const totalSizeMm = diameterMm + marginMm * 2.0;
  const widthPt = totalSizeMm * MM_TO_PT;
  const heightPt = totalSizeMm * MM_TO_PT;

  const page = pdfDoc.addPage([widthPt, heightPt]);
  const centerPtX = widthPt / 2.0;
  const centerPtY = heightPt / 2.0;
  const radiusPt = (diameterMm / 2.0) * MM_TO_PT;

  // Title & Metadata
  page.drawText(title, {
    x: 40,
    y: heightPt - 40,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(
    `Pins: ${nailsCount} | Diameter: ${diameterMm} mm | Scale: 100% (Do not fit/shrink to printable area)`,
    {
      x: 40,
      y: heightPt - 58,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    }
  );

  // 50mm Calibration Ruler for print verification
  const rulerStartX = 40;
  const rulerStartY = heightPt - 85;
  const rulerLengthPt = 50 * MM_TO_PT;

  page.drawLine({
    start: { x: rulerStartX, y: rulerStartY },
    end: { x: rulerStartX + rulerLengthPt, y: rulerStartY },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawLine({
    start: { x: rulerStartX, y: rulerStartY - 5 },
    end: { x: rulerStartX, y: rulerStartY + 5 },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawLine({
    start: { x: rulerStartX + rulerLengthPt, y: rulerStartY - 5 },
    end: { x: rulerStartX + rulerLengthPt, y: rulerStartY + 5 },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText("50 mm Verification Ruler (Measure with physical ruler after print)", {
    x: rulerStartX,
    y: rulerStartY - 15,
    size: 8,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Center crosshair
  page.drawLine({
    start: { x: centerPtX - 20, y: centerPtY },
    end: { x: centerPtX + 20, y: centerPtY },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawLine({
    start: { x: centerPtX, y: centerPtY - 20 },
    end: { x: centerPtX, y: centerPtY + 20 },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Circular board outline
  page.drawCircle({
    x: centerPtX,
    y: centerPtY,
    size: radiusPt,
    borderWidth: 0.75,
    borderColor: rgb(0.4, 0.4, 0.4),
  });

  // Pins & Pin labels
  for (let i = 0; i < nailsCount; i++) {
    // 0 pin is top
    const angle = (2.0 * Math.PI * i) / nailsCount - Math.PI / 2.0;
    // PDF coordinate system has (0,0) at bottom-left, so Y increases upwards
    const px = centerPtX + radiusPt * Math.cos(angle);
    const py = centerPtY - radiusPt * Math.sin(angle);

    // Draw pin dot
    page.drawCircle({
      x: px,
      y: py,
      size: 1.2,
      color: rgb(0.8, 0.1, 0.1),
    });

    // Draw label
    const labelDistance = radiusPt + 14.0;
    const lx = centerPtX + labelDistance * Math.cos(angle);
    const ly = centerPtY - labelDistance * Math.sin(angle);

    const labelText = String(i + 1);
    const labelSize = nailsCount > 250 ? 5 : 6.5;

    page.drawText(labelText, {
      x: lx - (labelText.length * labelSize) / 3.5,
      y: ly - labelSize / 2.5,
      size: labelSize,
      font: font,
      color: rgb(0.15, 0.15, 0.15),
    });
  }

  return pdfDoc.save();
}

/**
 * Generates multi-page tiled A4 PDF for standard home/office printers
 */
export async function generateTiledA4Pdf(
  nailsCount: number,
  diameterMm: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A4 dimensions in pt: 210 x 297 mm
  const a4WidthMm = 210.0;
  const a4HeightMm = 297.0;
  const a4WidthPt = a4WidthMm * MM_TO_PT;
  const a4HeightPt = a4HeightMm * MM_TO_PT;

  const printableMarginMm = 15.0;
  const usableWidthMm = a4WidthMm - printableMarginMm * 2;
  const usableHeightMm = a4HeightMm - printableMarginMm * 2;

  // Outer dimension including pin number clearance
  const totalModelSizeMm = diameterMm + 30.0;
  const cols = Math.ceil(totalModelSizeMm / usableWidthMm);
  const rows = Math.ceil(totalModelSizeMm / usableHeightMm);

  const modelCenterMm = totalModelSizeMm / 2.0;
  const radiusMm = diameterMm / 2.0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const page = pdfDoc.addPage([a4WidthPt, a4HeightPt]);
      const tileIndex = r * cols + c + 1;
      const totalTiles = rows * cols;

      // Header on each tile
      page.drawText(
        `Tile ${tileIndex}/${totalTiles} (Row ${r + 1}, Col ${c + 1}) | Diameter: ${diameterMm}mm | Nails: ${nailsCount}`,
        {
          x: printableMarginMm * MM_TO_PT,
          y: a4HeightPt - 25,
          size: 8,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        }
      );

      page.drawText("Scale: 100% Actual Size. Align alignment marks & tape pages together.", {
        x: printableMarginMm * MM_TO_PT,
        y: a4HeightPt - 37,
        size: 7,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Bounding box of this tile in model coordinates (mm)
      const tileMinMmX = c * usableWidthMm;
      const tileMinMmY = r * usableHeightMm;

      // Draw model pins that fall within or near this tile
      for (let i = 0; i < nailsCount; i++) {
        const angle = (2.0 * Math.PI * i) / nailsCount - Math.PI / 2.0;
        const modelX = modelCenterMm + radiusMm * Math.cos(angle);
        const modelY = modelCenterMm + radiusMm * Math.sin(angle);

        // Convert model mm to tile mm
        const localMmX = modelX - tileMinMmX + printableMarginMm;
        const localMmY = modelY - tileMinMmY + printableMarginMm;

        // Check if on this A4 sheet
        if (
          localMmX >= printableMarginMm &&
          localMmX <= a4WidthMm - printableMarginMm &&
          localMmY >= printableMarginMm &&
          localMmY <= a4HeightMm - printableMarginMm
        ) {
          const ptX = localMmX * MM_TO_PT;
          // Invert Y for PDF coordinates
          const ptY = a4HeightPt - localMmY * MM_TO_PT;

          // Draw pin
          page.drawCircle({
            x: ptX,
            y: ptY,
            size: 1.5,
            color: rgb(0.8, 0.1, 0.1),
          });

          // Label
          const labelDistMm = radiusMm + 5.0;
          const lModelX = modelCenterMm + labelDistMm * Math.cos(angle);
          const lModelY = modelCenterMm + labelDistMm * Math.sin(angle);
          const lLocalMmX = lModelX - tileMinMmX + printableMarginMm;
          const lLocalMmY = lModelY - tileMinMmY + printableMarginMm;

          if (
            lLocalMmX >= 5 &&
            lLocalMmX <= a4WidthMm - 5 &&
            lLocalMmY >= 5 &&
            lLocalMmY <= a4HeightMm - 5
          ) {
            const lPtX = lLocalMmX * MM_TO_PT;
            const lPtY = a4HeightPt - lLocalMmY * MM_TO_PT;
            const labelText = String(i + 1);
            page.drawText(labelText, {
              x: lPtX - (labelText.length * 5) / 3,
              y: lPtY - 2.5,
              size: 6,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            });
          }
        }
      }

      // Draw tile border crop guides
      const bLeft = printableMarginMm * MM_TO_PT;
      const bBottom = printableMarginMm * MM_TO_PT;
      const bRight = (a4WidthMm - printableMarginMm) * MM_TO_PT;
      const bTop = (a4HeightMm - printableMarginMm) * MM_TO_PT;

      page.drawRectangle({
        x: bLeft,
        y: bBottom,
        width: bRight - bLeft,
        height: bTop - bBottom,
        borderWidth: 0.5,
        borderColor: rgb(0.7, 0.7, 0.7),
      });
    }
  }

  return pdfDoc.save();
}
