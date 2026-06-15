import PDFDocument from "pdfkit";
import { formatPatientName } from "@/lib/format/patient";
import { calculateOrderTotal } from "@/lib/google/sheets";
import type { OrderWithDetails } from "@/lib/types";

const COLORS = {
  navy: "#071F36",
  red: "#BA1E2F",
  blue: "#2C4A6E",
  border: "#D6DCE3",
  muted: "#5A6F85",
  background: "#F7FAFC",
};

type GenerateOrderQuotePdfInput = {
  order: OrderWithDetails;
  providerName: string;
  providerEmail: string;
  providerPractice: string;
  providerPhone?: string | null;
  shipTo: "clinic" | "patient";
  shippingAddress: string;
};

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function drawLabelValue(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  label: string,
  value: string,
  width: number,
) {
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(label.toUpperCase(), x, y, { width });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.navy)
    .text(value || "—", x, y + 12, { width });
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.navy)
    .text(title, 48, y);

  doc
    .moveTo(48, y + 16)
    .lineTo(564, y + 16)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  return y + 28;
}

export async function generateOrderQuotePdf(
  input: GenerateOrderQuotePdfInput,
): Promise<Buffer> {
  const { order, providerName, providerEmail, providerPractice, providerPhone, shipTo, shippingAddress } =
    input;
  const orderRef = order.id.slice(0, 8).toUpperCase();
  const patientName = formatPatientName(order.patient);
  const orderTotal = calculateOrderTotal(order.order_items);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 0, bottom: 48, left: 48, right: 48 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .rect(0, 0, 612, 88)
      .fill(COLORS.navy);

    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#FFFFFF")
      .text("TexBioMed", 48, 28);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#E6EEF5")
      .text("Provider order invoice", 48, 54);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#FFFFFF")
      .text(`Order #${orderRef}`, 420, 32, { width: 144, align: "right" });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#E6EEF5")
      .text(formatDate(order.created_at), 420, 50, { width: 144, align: "right" });

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#E6EEF5")
      .text(order.id, 420, 66, { width: 144, align: "right" });

    doc
      .rect(0, 88, 612, 4)
      .fill(COLORS.red);

    let y = 108;

    doc
      .roundedRect(48, y, 508, 72, 8)
      .fillAndStroke(COLORS.background, COLORS.border);

    drawLabelValue(doc, 64, y + 16, "Provider", providerName, 220);
    drawLabelValue(doc, 300, y + 16, "Practice", providerPractice, 220);
    drawLabelValue(doc, 64, y + 44, "Provider email", providerEmail, 220);
    drawLabelValue(doc, 300, y + 44, "Provider phone", providerPhone?.trim() || "—", 220);

    y += 92;

    y = drawSectionTitle(doc, "Patient information", y);
    drawLabelValue(doc, 48, y, "Name", patientName, 160);
    drawLabelValue(doc, 220, y, "Email", order.patient.email ?? "—", 160);
    drawLabelValue(doc, 392, y, "Phone", order.patient.phone ?? "—", 160);

    y += 40;
    drawLabelValue(doc, 48, y, "Date of birth", order.patient.date_of_birth ?? "—", 160);
    drawLabelValue(doc, 220, y, "Sex", order.patient.sex ?? "—", 160);
    drawLabelValue(
      doc,
      392,
      y,
      "Allergies",
      order.patient.allergies?.trim() || "None",
      160,
    );

    y += 52;
    y = drawSectionTitle(doc, "Shipping information", y);
    drawLabelValue(
      doc,
      48,
      y,
      "Ship to",
      shipTo === "clinic" ? "Clinic" : "Patient",
      508,
    );

    y += 36;
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text("ADDRESS", 48, y, { width: 508 });

    y += 12;
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.navy)
      .text(shippingAddress, 48, y, { width: 508, lineGap: 2 });

    y += Math.max(36, doc.heightOfString(shippingAddress, { width: 508 }) + 12);
    y = drawSectionTitle(doc, "Order items", y);

    const tableTop = y;
    const columns = [
      { label: "Product", x: 48, width: 280 },
      { label: "Qty", x: 340, width: 40 },
      { label: "Unit", x: 388, width: 72 },
      { label: "Line total", x: 468, width: 88 },
    ];

    doc.rect(48, tableTop, 508, 24).fill(COLORS.navy);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#FFFFFF");
    for (const column of columns) {
      doc.text(column.label, column.x + 8, tableTop + 8, {
        width: column.width - 16,
        align: column.label === "Product" ? "left" : "right",
      });
    }

    let rowY = tableTop + 24;
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.navy);

    for (const [index, item] of order.order_items.entries()) {
      const lineTotal = item.unit_price * item.quantity;
      const rowHeight = Math.max(
        28,
        doc.heightOfString(item.product_name, { width: 264 }) + 16,
      );

      if (index % 2 === 0) {
        doc.rect(48, rowY, 508, rowHeight).fill("#FFFFFF");
      } else {
        doc.rect(48, rowY, 508, rowHeight).fill(COLORS.background);
      }

      doc.fillColor(COLORS.navy);
      doc.text(item.product_name, columns[0].x + 8, rowY + 8, { width: 264 });
      doc.text(String(item.quantity), columns[1].x + 8, rowY + 8, {
        width: columns[1].width - 16,
        align: "right",
      });
      doc.text(formatCurrency(item.unit_price), columns[2].x + 8, rowY + 8, {
        width: columns[2].width - 16,
        align: "right",
      });
      doc.text(formatCurrency(lineTotal), columns[3].x + 8, rowY + 8, {
        width: columns[3].width - 16,
        align: "right",
      });

      rowY += rowHeight;
    }

    doc
      .moveTo(48, rowY)
      .lineTo(556, rowY)
      .strokeColor(COLORS.border)
      .lineWidth(1)
      .stroke();

    rowY += 12;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLORS.navy)
      .text("Order total", 388, rowY, { width: 72, align: "right" });

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLORS.red)
      .text(formatCurrency(orderTotal), 468, rowY, { width: 88, align: "right" });

    rowY += 36;

    if (order.notes?.trim()) {
      y = drawSectionTitle(doc, "Notes", rowY);
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.navy)
        .text(order.notes.trim(), 48, y, { width: 508, lineGap: 2 });
      rowY = y + doc.heightOfString(order.notes.trim(), { width: 508 }) + 24;
    }

    const footerY = Math.max(rowY + 24, 720);
    doc
      .moveTo(48, footerY)
      .lineTo(564, footerY)
      .strokeColor(COLORS.border)
      .lineWidth(1)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        "This document confirms products requested through the TexBioMed provider portal. Billing, payment, and fulfillment are handled by TexBioMed staff.",
        48,
        footerY + 12,
        { width: 508, align: "center", lineGap: 2 },
      );

    doc.end();
  });
}

export function getOrderQuotePdfFilename(orderId: string): string {
  return `TexBioMed-Order-${orderId.slice(0, 8).toUpperCase()}.pdf`;
}
