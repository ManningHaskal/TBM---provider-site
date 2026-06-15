import { formatPatientName } from "@/lib/format/patient";
import { calculateOrderTotal } from "@/lib/google/sheets";
import type { OrderWithDetails, ShipTo } from "@/lib/types";

export const OPERATIONAL_ORDER_EMAIL = "tracking@texbiomed.us";
export const OPERATIONAL_EMAIL_FROM = "TexBioMed <onboarding@resend.dev>";

type BuildOrderInvoiceTextInput = {
  order: OrderWithDetails;
  providerName: string;
  providerEmail: string;
  providerPractice: string;
  providerPhone?: string | null;
  shipTo: ShipTo;
  shippingAddress: string;
};

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatSubmittedAt(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function buildOrderInvoiceText({
  order,
  providerName,
  providerEmail,
  providerPractice,
  providerPhone,
  shipTo,
  shippingAddress,
}: BuildOrderInvoiceTextInput): string {
  const patientName = formatPatientName(order.patient);
  const orderRef = order.id.slice(0, 8).toUpperCase();
  const orderTotal = calculateOrderTotal(order.order_items);

  const lineItems = order.order_items
    .map((item) => {
      const lineTotal = item.unit_price * item.quantity;
      return [
        item.product_name,
        `  Quantity: ${item.quantity}`,
        `  Unit price: ${formatCurrency(item.unit_price)}`,
        `  Line total: ${formatCurrency(lineTotal)}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    "TexBioMed provider order — invoice details",
    "",
    "Order",
    `Reference: ${orderRef}`,
    `Order ID: ${order.id}`,
    `Submitted: ${formatSubmittedAt(order.created_at)}`,
    "",
    "Provider",
    `Name: ${providerName}`,
    `Practice: ${providerPractice}`,
    `Email: ${providerEmail}`,
    `Phone: ${providerPhone?.trim() || "N/A"}`,
    "",
    "Patient",
    `Name: ${patientName}`,
    `Email: ${order.patient.email ?? "N/A"}`,
    `Phone: ${order.patient.phone ?? "N/A"}`,
    `Date of birth: ${order.patient.date_of_birth ?? "N/A"}`,
    `Sex: ${order.patient.sex ?? "N/A"}`,
    `Allergies: ${order.patient.allergies?.trim() || "None"}`,
    "",
    "Shipping information",
    `Ship to: ${shipTo === "clinic" ? "Clinic" : "Patient"}`,
    shippingAddress,
    "",
    "Line items",
    lineItems,
    "",
    `Order total: ${formatCurrency(orderTotal)}`,
    "",
    order.notes?.trim() ? `Notes: ${order.notes.trim()}` : "Notes: None",
    "",
    "A PDF copy of this order is attached.",
  ].join("\n");
}

export function buildOrderInvoiceSubject(order: OrderWithDetails): string {
  const patientName = formatPatientName(order.patient);
  const orderRef = order.id.slice(0, 8).toUpperCase();
  return `TexBioMed order ${orderRef} — ${patientName}`;
}
