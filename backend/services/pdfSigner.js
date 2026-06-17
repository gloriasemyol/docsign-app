const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function signPDF(filePath, signatures) {
  // Read the original PDF file
  const pdfBytes = fs.readFileSync(filePath);

  // Load it into pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const sig of signatures) {
    const page = pdfDoc.getPage(sig.page - 1); // pages are 0-indexed
    const { height } = page.getSize();

    // pdf-lib counts Y from the BOTTOM, browser counts from TOP
    // so we flip the y coordinate
    const flippedY = height - sig.y - 30;

    // Draw the signature text on the page
    page.drawText(sig.signerName || 'Signed', {
      x: sig.x,
      y: flippedY,
      size: 14,
      font,
      color: rgb(0.1, 0.1, 0.6)  // dark blue
    });

    // Draw a line under it
    page.drawLine({
      start: { x: sig.x, y: flippedY - 2 },
      end:   { x: sig.x + 120, y: flippedY - 2 },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.6)
    });
  }

  // Save the modified PDF with a new name
  const signedBytes = await pdfDoc.save();
  const signedPath = filePath.replace('.pdf', '-signed.pdf');
  fs.writeFileSync(signedPath, signedBytes);

  return signedPath;
}

module.exports = { signPDF };