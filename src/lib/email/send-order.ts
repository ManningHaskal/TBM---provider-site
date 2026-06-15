import { Resend } from "resend";
import {
  buildOrderInvoiceSubject,
  buildOrderInvoiceText,
  OPERATIONAL_EMAIL_FROM,
  OPERATIONAL_ORDER_EMAIL,
} from "@/lib/email/order-invoice-content";
import type { OrderWithDetails } from "@/lib/types";
import {
  generateOrderQuotePdf,
  getOrderQuotePdfFilename,
} from "@/lib/pdf/order-quote-pdf";

type SendOrderEmailInput = {
  order: OrderWithDetails;
  providerName: string;
  providerEmail: string;
  providerPractice: string;
  providerPhone?: string | null;
  shipTo: "clinic" | "patient";
  shippingAddress: string;
};

export async function sendOrderNotificationEmail({
  order,
  providerName,
  providerEmail,
  providerPractice,
  providerPhone,
  shipTo,
  shippingAddress,
}: SendOrderEmailInput): Promise<void> {
  const text = buildOrderInvoiceText({
    order,
    providerName,
    providerEmail,
    providerPractice,
    providerPhone,
    shipTo,
    shippingAddress,
  });
  const subject = buildOrderInvoiceSubject(order);

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set; email notification logged only.");
    console.info(text);
    return;
  }

  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateOrderQuotePdf({
      order,
      providerName,
      providerEmail,
      providerPractice,
      providerPhone,
      shipTo,
      shippingAddress,
    });
  } catch (error) {
    console.error("Order PDF generation failed; sending email without attachment.", error);
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: OPERATIONAL_EMAIL_FROM,
    to: [OPERATIONAL_ORDER_EMAIL],
    subject,
    text: pdfBuffer
      ? text
      : `${text}\n\nNote: PDF attachment could not be generated for this order.`,
    attachments: pdfBuffer
      ? [
          {
            filename: getOrderQuotePdfFilename(order.id),
            content: pdfBuffer,
          },
        ]
      : undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Resend did not accept the email.");
  }
}
