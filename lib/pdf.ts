import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type CompanyInfo = {
  name: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  qst_number?: string;
};

type CustomerInfo = {
  name: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
};

type InvoicePdfData = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  company: CompanyInfo;
  customer: CustomerInfo;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  gst_rate?: number; // Default 5%
  qst_rate?: number; // Default 9.975%
  gst_amount?: number;
  qst_amount?: number;
  totalAmount: number;
  notes?: string;
};

// Tax rates are no longer hardcoded — callers should load rates from
// the company's tax_settings table and pass gst_rate / qst_rate in the data.
// When no rate is provided, default to 0 (no tax line rendered as $0.00).
const DEFAULT_TAX_RATE = 0;

export async function generateInvoicePdf(data: InvoicePdfData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // Letter size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.12, 0.3, 0.42);
  const textColor = rgb(0.2, 0.2, 0.2);
  const grayColor = rgb(0.5, 0.5, 0.5);
  const lineColor = rgb(0.8, 0.8, 0.8);

  let yPosition = 780;

  // Company Header
  page.drawText(data.company.name, {
    x: 50,
    y: yPosition,
    size: 22,
    font: boldFont,
    color: primaryColor,
  });
  yPosition -= 20;

  if (data.company.address) {
    page.drawText(data.company.address, { x: 50, y: yPosition, size: 10, font, color: grayColor });
    yPosition -= 14;
  }

  const companyLocation = [data.company.city, data.company.province, data.company.postal_code]
    .filter(Boolean)
    .join(", ");
  if (companyLocation) {
    page.drawText(companyLocation, { x: 50, y: yPosition, size: 10, font, color: grayColor });
    yPosition -= 14;
  }

  if (data.company.phone) {
    page.drawText(`Tél: ${data.company.phone}`, { x: 50, y: yPosition, size: 10, font, color: grayColor });
    yPosition -= 14;
  }

  if (data.company.email) {
    page.drawText(`Email: ${data.company.email}`, { x: 50, y: yPosition, size: 10, font, color: grayColor });
    yPosition -= 14;
  }

  // Invoice Title and Number (right side)
  page.drawText("FACTURE / INVOICE", {
    x: 400,
    y: 780,
    size: 16,
    font: boldFont,
    color: primaryColor,
  });

  page.drawText(`No: ${data.invoiceNumber}`, {
    x: 400,
    y: 760,
    size: 11,
    font: boldFont,
    color: textColor,
  });

  page.drawText(`Date: ${data.invoiceDate}`, {
    x: 400,
    y: 742,
    size: 10,
    font,
    color: textColor,
  });

  page.drawText(`Échéance: ${data.dueDate}`, {
    x: 400,
    y: 724,
    size: 10,
    font,
    color: textColor,
  });

  yPosition -= 30;

  // Customer Information
  page.drawRectangle({
    x: 50,
    y: yPosition - 20,
    width: 250,
    height: 100,
    borderColor: lineColor,
    borderWidth: 1,
  });

  page.drawText("FACTURER À / BILL TO", {
    x: 60,
    y: yPosition - 10,
    size: 9,
    font: boldFont,
    color: grayColor,
  });

  yPosition -= 30;

  page.drawText(data.customer.name, { x: 60, y: yPosition, size: 11, font: boldFont, color: textColor });
  yPosition -= 16;

  if (data.customer.address) {
    page.drawText(data.customer.address, { x: 60, y: yPosition, size: 9, font, color: textColor });
    yPosition -= 14;
  }

  const customerLocation = [data.customer.city, data.customer.province, data.customer.postal_code]
    .filter(Boolean)
    .join(", ");
  if (customerLocation) {
    page.drawText(customerLocation, { x: 60, y: yPosition, size: 9, font, color: textColor });
    yPosition -= 14;
  }

  if (data.customer.phone) {
    page.drawText(`Tél: ${data.customer.phone}`, { x: 60, y: yPosition, size: 9, font, color: textColor });
  }

  yPosition -= 60;

  // Line Items Table Header
  page.drawRectangle({
    x: 50,
    y: yPosition - 22,
    width: 495,
    height: 20,
    color: rgb(0.95, 0.95, 0.95),
  });

  page.drawText("Description", { x: 60, y: yPosition - 16, size: 10, font: boldFont, color: textColor });
  page.drawText("Qté", { x: 340, y: yPosition - 16, size: 10, font: boldFont, color: textColor });
  page.drawText("Prix unit.", { x: 390, y: yPosition - 16, size: 10, font: boldFont, color: textColor });
  page.drawText("Total", { x: 490, y: yPosition - 16, size: 10, font: boldFont, color: textColor });

  yPosition -= 30;

  // Line Items
  for (const item of data.lineItems) {
    if (yPosition < 200) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = 780;
    }

    page.drawText(item.description, { x: 60, y: yPosition, size: 9, font, color: textColor });
    page.drawText(item.quantity.toString(), { x: 350, y: yPosition, size: 9, font, color: textColor });
    page.drawText(`$${item.unit_price.toFixed(2)}`, { x: 390, y: yPosition, size: 9, font, color: textColor });
    page.drawText(`$${item.total.toFixed(2)}`, { x: 470, y: yPosition, size: 9, font, color: textColor });

    yPosition -= 18;
  }

  yPosition -= 20;

  // Totals Section
  const totalsX = 380;

  // Draw horizontal line
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 545, y: yPosition },
    thickness: 1,
    color: lineColor,
  });

  yPosition -= 25;

  // Subtotal
  page.drawText("Sous-total:", { x: totalsX, y: yPosition, size: 10, font, color: textColor });
  page.drawText(`$${data.subtotal.toFixed(2)}`, { x: 480, y: yPosition, size: 10, font, color: textColor });
  yPosition -= 18;

  // GST
  const gstAmount = data.gst_amount ?? data.subtotal * (data.gst_rate ?? DEFAULT_TAX_RATE);
  const gstRate = (data.gst_rate ?? DEFAULT_TAX_RATE) * 100;
  page.drawText(`TPS/GST (${gstRate.toFixed(2)}%):`, { x: totalsX, y: yPosition, size: 10, font, color: textColor });
  page.drawText(`$${gstAmount.toFixed(2)}`, { x: 480, y: yPosition, size: 10, font, color: textColor });
  yPosition -= 18;

  // QST
  const qstAmount = data.qst_amount ?? data.subtotal * (data.qst_rate ?? DEFAULT_TAX_RATE);
  const qstRate = (data.qst_rate ?? DEFAULT_TAX_RATE) * 100;
  page.drawText(`TVQ/QST (${qstRate.toFixed(3)}%):`, { x: totalsX, y: yPosition, size: 10, font, color: textColor });
  page.drawText(`$${qstAmount.toFixed(2)}`, { x: 480, y: yPosition, size: 10, font, color: textColor });
  yPosition -= 25;

  // Total (bold and larger)
  page.drawRectangle({
    x: totalsX - 10,
    y: yPosition - 8,
    width: 175,
    height: 22,
    color: rgb(0.95, 0.95, 0.95),
  });

  page.drawText("TOTAL:", { x: totalsX, y: yPosition, size: 12, font: boldFont, color: primaryColor });
  page.drawText(`$${data.totalAmount.toFixed(2)}`, {
    x: 470,
    y: yPosition,
    size: 12,
    font: boldFont,
    color: primaryColor,
  });

  yPosition -= 40;

  // Tax Registration Numbers
  if (data.company.gst_number || data.company.qst_number) {
    yPosition -= 10;

    if (data.company.gst_number) {
      page.drawText(`No TPS/GST: ${data.company.gst_number}`, {
        x: 60,
        y: yPosition,
        size: 8,
        font,
        color: grayColor,
      });
      yPosition -= 12;
    }

    if (data.company.qst_number) {
      page.drawText(`No TVQ/QST: ${data.company.qst_number}`, {
        x: 60,
        y: yPosition,
        size: 8,
        font,
        color: grayColor,
      });
      yPosition -= 12;
    }
  }

  // Notes
  if (data.notes) {
    yPosition -= 20;
    page.drawText("Notes:", { x: 60, y: yPosition, size: 10, font: boldFont, color: textColor });
    yPosition -= 16;

    // Wrap notes text
    const notesLines = wrapText(data.notes, 70);
    for (const line of notesLines) {
      page.drawText(line, { x: 60, y: yPosition, size: 9, font, color: textColor });
      yPosition -= 14;
    }
  }

  // Footer
  const footerY = 60;
  page.drawText("Merci de votre confiance! / Thank you for your business!", {
    x: 50,
    y: footerY,
    size: 9,
    font: boldFont,
    color: primaryColor,
  });

  page.drawText("Paiement dû à réception / Payment due upon receipt", {
    x: 50,
    y: footerY - 14,
    size: 8,
    font,
    color: grayColor,
  });

  return pdfDoc.save();
}

// Helper function to wrap text
function wrapText(text: string, maxLength: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}
