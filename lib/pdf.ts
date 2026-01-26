import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateInvoicePdf({
  invoiceNumber,
  totalAmount,
  dueDate,
}: {
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText("Entretien Prestige", { x: 50, y: 780, size: 18, font, color: rgb(0.12, 0.3, 0.42) });
  page.drawText(`Invoice: ${invoiceNumber}`, { x: 50, y: 740, size: 12, font });
  page.drawText(`Due date: ${dueDate}`, { x: 50, y: 720, size: 12, font });
  page.drawText(`Total: $${totalAmount.toFixed(2)}`, { x: 50, y: 680, size: 14, font });

  return pdfDoc.save();
}
