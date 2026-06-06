import { Resend } from "resend";
import type { OrderWithDetails } from "@/lib/types";
import {
  calculateOrderTotal,
  formatLineItemsSummary,
} from "@/lib/google/sheets";

type SendOrderEmailInput = {
  order: OrderWithDetails;
  providerName: string;
  providerEmail: string;
};

export async function sendOrderNotificationEmail({
  order,
  providerName,
  providerEmail,
}: SendOrderEmailInput): Promise<void> {
  const to = process.env.ORDER_NOTIFICATION_EMAIL;
  const from =
    process.env.EMAIL_FROM ?? "TexBioMed Orders <onboarding@resend.dev>";
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  if (!to) {
    console.warn("ORDER_NOTIFICATION_EMAIL not set; skipping email notification.");
    return;
  }

  const patientName = order.patient.full_name;
  const lineItemsSummary = formatLineItemsSummary(order.order_items);
  const orderTotal = calculateOrderTotal(order.order_items);
  const subject = `New provider order ${order.id.slice(0, 8).toUpperCase()} — ${patientName}`;

  const text = [
    "A new order was submitted through the TexBioMed provider portal.",
    "",
    `Order ID: ${order.id}`,
    `Submitted: ${new Date(order.created_at).toLocaleString()}`,
    "",
    "Provider",
    `Name: ${providerName}`,
    `Email: ${providerEmail}`,
    "",
    "Patient",
    `Name: ${patientName}`,
    `Email: ${order.patient.email ?? "N/A"}`,
    `Phone: ${order.patient.phone ?? "N/A"}`,
    `Shipping address: ${order.patient.shipping_address ?? "N/A"}`,
    "",
    "Items",
    lineItemsSummary,
    `Total: $${orderTotal.toFixed(2)}`,
    "",
    order.notes ? `Notes: ${order.notes}` : "Notes: None",
    "",
    `Portal: ${appUrl.replace(/\/$/, "")}/orders`,
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set; email notification logged only.");
    console.info(text);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: [to],
    subject,
    text,
  });
}
