import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const MM_TO_PT = 72.0 / 25.4; // ~2.834645669

export async function generateActualSizePdf(nailsCount, diameterMm, marginMm = 30.0) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageDimMm = diameterMm + 2 * marginMm;
  const pageW = pageDimMm * MM_TO_PT;
  const pageH = pageDimMm * MM_TO_PT;

  const page = pdfDoc.addPage([pageW, pageH]);
  const centerX = pageW / 2.0;
  const centerY = pageH / 2.0;
  const radius = (diameterMm / 2.0) * MM_TO_PT;

  // Title
  page.drawText("STRING ART NAILS TEMPLATE (ACTUAL SIZE 1:1)", {
    x: marginMm * MM_TO_PT,
    y: pageH - 18 * MM_TO_PT,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(
    `Board Diameter: ${diameterMm.toFixed(0)} mm | Total Nails: ${nailsCount} | Nail 1 is at 12 o'clock (Top)`,
    {
      x: marginMm * MM_TO_PT,
      y: pageH - 23 * MM_TO_PT,
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    }
  );

  page.drawText("PRINT AT 100% / ACTUAL SIZE. Do not select 'Fit to Page' or 'Shrink'.", {
    x: marginMm * MM_TO_PT,
    y: pageH - 28 * MM_TO_PT,
    size: 9,
    font: fontBold,
    color: rgb(0.8, 0, 0),
  });

  // 10 cm test ruler
  const rulerX = marginMm * MM_TO_PT;
  const rulerY = marginMm * MM_TO_PT * 0.5;
  page.drawLine({
    start: { x: rulerX, y: rulerY },
    end: { x: rulerX + 100 * MM_TO_PT, y: rulerY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  for (let tick = 0; tick <= 100; tick += 10) {
    const tickH = tick % 50 === 0 ? 5 * MM_TO_PT : 2.5 * MM_TO_PT;
    page.drawLine({
      start: { x: rulerX + tick * MM_TO_PT, y: rulerY },
      end: { x: rulerX + tick * MM_TO_PT, y: rulerY + tickH },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });
    if (tick % 20 === 0) {
      page.drawText(`${tick / 10}cm`, {
        x: rulerX + tick * MM_TO_PT - 4,
        y: rulerY + tickH + 2,
        size: 6,
        font,
      });
    }
  }

  // Draw circular perimeter guideline
  page.drawCircle({
    x: centerX,
    y: centerY,
    size: radius,
    borderWidth: 0.5,
    borderColor: rgb(0.5, 0.5, 0.5),
  });

  // Draw nails and numbers
  // In PDF coordinate system Y grows upward, so Nail 1 at 12 o'clock is pi/2, clockwise is angle decreasing!
  const angleStep = (2.0 * Math.PI) / nailsCount;
  const fontSize = nailsCount <= 200 ? 6 : nailsCount <= 300 ? 5 : 4;

  for (let i = 0; i < nailsCount; i++) {
    const a = Math.PI / 2.0 - i * angleStep;
    const nx = centerX + radius * Math.cos(a);
    const ny = centerY + radius * Math.sin(a);

    // Nail mark
    page.drawCircle({
      x: nx,
      y: ny,
      size: 1.2,
      color: rgb(0, 0, 0),
    });

    // Label
    const tx = centerX + (radius + 4.5 * MM_TO_PT) * Math.cos(a);
    const ty = centerY + (radius + 4.5 * MM_TO_PT) * Math.sin(a);
    const text = `${i + 1}`;
    const textW = font.widthOfTextAtSize(text, fontSize);

    page.drawText(text, {
      x: tx - textW / 2.0,
      y: ty - fontSize / 3.0,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}

export async function generateTiledA4Pdf(nailsCount, diameterMm, overlapMm = 15.0) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A4 dimensions in pt: 595.28 x 841.89 pt (210 x 297 mm)
  const a4W = 210 * MM_TO_PT;
  const a4H = 297 * MM_TO_PT;

  const pageMarginMm = 12.0;
  const usableWMm = 210.0 - 2 * pageMarginMm;
  const usableHMm = 297.0 - 2 * pageMarginMm;

  const stepX = (usableWMm - overlapMm) * MM_TO_PT;
  const stepY = (usableHMm - overlapMm) * MM_TO_PT;

  const totalMarginMm = 20.0;
  const discBoundPt = (diameterMm + 2 * totalMarginMm) * MM_TO_PT;

  const cols = Math.max(1, Math.ceil((discBoundPt - overlapMm * MM_TO_PT) / stepX));
  const rows = Math.max(1, Math.ceil((discBoundPt - overlapMm * MM_TO_PT) / stepY));

  const fullW = cols * stepX + overlapMm * MM_TO_PT;
  const fullH = rows * stepY + overlapMm * MM_TO_PT;
  const globalCenterX = fullW / 2.0;
  const globalCenterY = fullH / 2.0;
  const radius = (diameterMm / 2.0) * MM_TO_PT;

  const totalPages = rows * cols;
  let pageIndex = 0;
  const fontSize = nailsCount <= 200 ? 6 : 4.5;
  const angleStep = (2.0 * Math.PI) / nailsCount;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pageIndex++;
      const page = pdfDoc.addPage([a4W, a4H]);

      // Origin of current tile in global space
      const tileOriginX = c * stepX;
      const tileOriginY = (rows - 1 - r) * stepY;

      // Header
      page.drawText(
        `String Art Tiled Template | Row ${r + 1} of ${rows}, Col ${c + 1} of ${cols} (Page ${pageIndex} of ${totalPages})`,
        {
          x: pageMarginMm * MM_TO_PT,
          y: a4H - 8 * MM_TO_PT,
          size: 9,
          font: fontBold,
        }
      );
      page.drawText(
        `Board Diameter ${diameterMm.toFixed(0)} mm | ${nailsCount} Nails | Overlap: ${overlapMm} mm | Print at 100% Actual Size`,
        {
          x: pageMarginMm * MM_TO_PT,
          y: a4H - 12 * MM_TO_PT,
          size: 7.5,
          font,
        }
      );

      // Calibration ruler at bottom
      const rulerX = pageMarginMm * MM_TO_PT;
      const rulerY = 6 * MM_TO_PT;
      page.drawLine({
        start: { x: rulerX, y: rulerY },
        end: { x: rulerX + 100 * MM_TO_PT, y: rulerY },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });
      for (let t = 0; t <= 100; t += 10) {
        const th = t % 50 === 0 ? 3 * MM_TO_PT : 1.5 * MM_TO_PT;
        page.drawLine({
          start: { x: rulerX + t * MM_TO_PT, y: rulerY },
          end: { x: rulerX + t * MM_TO_PT, y: rulerY + th },
          thickness: 0.6,
          color: rgb(0, 0, 0),
        });
      }
      page.drawText("10cm Check Ruler (Verify with hand ruler)", {
        x: rulerX + 105 * MM_TO_PT,
        y: rulerY - 1,
        size: 6,
        font,
      });

      // Printable tile boundary
      const clipX = pageMarginMm * MM_TO_PT;
      const clipY = pageMarginMm * MM_TO_PT + 5 * MM_TO_PT;
      const clipW = usableWMm * MM_TO_PT;
      const clipH = usableHMm * MM_TO_PT - 10 * MM_TO_PT;

      page.drawRectangle({
        x: clipX,
        y: clipY,
        width: clipW,
        height: clipH,
        borderWidth: 0.4,
        borderColor: rgb(0.8, 0.8, 0.8),
      });

      // Alignment crosshairs at corners
      const corners = [
        [clipX, clipY],
        [clipX + clipW, clipY],
        [clipX, clipY + clipH],
        [clipX + clipW, clipY + clipH],
      ];
      for (const [cx, cy] of corners) {
        page.drawLine({
          start: { x: cx - 3 * MM_TO_PT, y: cy },
          end: { x: cx + 3 * MM_TO_PT, y: cy },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        page.drawLine({
          start: { x: cx, y: cy - 3 * MM_TO_PT },
          end: { x: cx, y: cy + 3 * MM_TO_PT },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      // Draw nails that fall inside or near this tile
      for (let i = 0; i < nailsCount; i++) {
        const a = Math.PI / 2.0 - i * angleStep;
        const gx = globalCenterX + radius * Math.cos(a);
        const gy = globalCenterY + radius * Math.sin(a);

        // Convert global coordinate to this tile coordinate
        const localX = clipX + (gx - tileOriginX);
        const localY = clipY + (gy - tileOriginY);

        if (
          localX >= clipX - 10 &&
          localX <= clipX + clipW + 10 &&
          localY >= clipY - 10 &&
          localY <= clipY + clipH + 10
        ) {
          page.drawCircle({
            x: localX,
            y: localY,
            size: 1.2,
            color: rgb(0, 0, 0),
          });

          const labelGx = globalCenterX + (radius + 4.5 * MM_TO_PT) * Math.cos(a);
          const labelGy = globalCenterY + (radius + 4.5 * MM_TO_PT) * Math.sin(a);
          const labelLocalX = clipX + (labelGx - tileOriginX);
          const labelLocalY = clipY + (labelGy - tileOriginY);

          const text = `${i + 1}`;
          const textW = font.widthOfTextAtSize(text, fontSize);
          page.drawText(text, {
            x: labelLocalX - textW / 2.0,
            y: labelLocalY - fontSize / 3.0,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }
      }
    }
  }

  return await pdfDoc.save();
}
