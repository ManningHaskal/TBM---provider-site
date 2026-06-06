import { google } from "googleapis";
import catalogProducts from "@/data/products.json";
import type { Product } from "@/lib/types";

const PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000;

let productsCache: { expiresAt: number; products: Product[] } | null = null;

const FALLBACK_PRODUCTS: Product[] = catalogProducts.map((product) => ({
  name: product.name,
  sku: product.sku,
  price: product.price,
  active: product.active,
  sortOrder: product.sortOrder,
}));

function getSheetsClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!json) {
    return null;
  }

  const credentials = JSON.parse(json);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

function parseProductsRows(rows: string[][]): Product[] {
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());

  return rows
    .slice(1)
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = row[index]?.trim() ?? "";
      });

      const price = Number.parseFloat(record.price ?? "0");

      return {
        name: record.name ?? "",
        sku: record.sku ?? "",
        price: Number.isFinite(price) ? price : 0,
        active: parseBoolean(record.active),
        sortOrder: Number.parseInt(record.sort_order ?? "0", 10) || 0,
      } satisfies Product;
    })
    .filter((product) => product.name && product.sku);
}

export async function getProducts(forceRefresh = false): Promise<Product[]> {
  const now = Date.now();

  if (!forceRefresh && productsCache && productsCache.expiresAt > now) {
    return productsCache.products;
  }

  const sheetId = process.env.GOOGLE_PRODUCTS_SHEET_ID;
  const sheets = getSheetsClient();

  if (!sheetId || !sheets) {
    productsCache = {
      expiresAt: now + PRODUCTS_CACHE_TTL_MS,
      products: FALLBACK_PRODUCTS,
    };
    return FALLBACK_PRODUCTS;
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Products!A:E",
    });

    const products = parseProductsRows(response.data.values ?? [])
      .filter((product) => product.active)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    productsCache = {
      expiresAt: now + PRODUCTS_CACHE_TTL_MS,
      products: products.length > 0 ? products : FALLBACK_PRODUCTS,
    };

    return productsCache.products;
  } catch (error) {
    console.error("Failed to load products from Google Sheet:", error);
    return productsCache?.products ?? FALLBACK_PRODUCTS;
  }
}

export type OrderSheetPayload = {
  orderId: string;
  providerName: string;
  providerEmail: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  shippingAddress: string;
  lineItemsSummary: string;
  orderTotal: number;
  portalUrl: string;
};

export async function appendOrderToSheet(payload: OrderSheetPayload): Promise<void> {
  const sheetId = process.env.GOOGLE_ORDERS_SHEET_ID;
  const sheets = getSheetsClient();

  if (!sheetId || !sheets) {
    console.warn("Orders sheet not configured; skipping Google Sheets append.");
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Orders!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          payload.orderId,
          payload.providerName,
          payload.providerEmail,
          payload.patientName,
          payload.patientEmail,
          payload.patientPhone,
          payload.shippingAddress,
          payload.lineItemsSummary,
          payload.orderTotal.toFixed(2),
          payload.portalUrl,
        ],
      ],
    },
  });
}

export function formatLineItemsSummary(
  items: Array<{ product_name: string; quantity: number; unit_price: number }>,
): string {
  return items
    .map(
      (item) =>
        `${item.product_name} x${item.quantity} @ $${item.unit_price.toFixed(2)}`,
    )
    .join("; ");
}

export function calculateOrderTotal(
  items: Array<{ quantity: number; unit_price: number }>,
): number {
  return items.reduce(
    (total, item) => total + item.quantity * item.unit_price,
    0,
  );
}
