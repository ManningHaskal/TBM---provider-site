import { google } from "googleapis";
import {
  loadFallbackProductsFromJson,
  loadProductsFromXlsx,
  parseProductRecords,
} from "@/lib/products/catalog";
import { sortProductsByCategory } from "@/lib/products/grouping";
import type { Product } from "@/lib/types";

const PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000;

let productsCache: { expiresAt: number; products: Product[] } | null = null;

function getSheetsClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!json || json.includes('"project_id":"..."')) {
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
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

function parseProductsRows(rows: string[][]): Product[] {
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());

  const records = rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = row[index]?.trim() ?? "";
    });
    return record;
  });

  return parseProductRecords(
    records.map((record) => ({
      product_id: record["product id"] ?? record.sku,
      product: record.product ?? record.name,
      dose: record.dose,
      form: record.form,
      delivery_method: record.delivery ?? record.delivery_method,
      price: record.price,
      category: record.category,
      active: record.active,
      sort_order: record.sort_order,
      name: record.name,
      sku: record.sku,
    })),
  );
}

function loadLocalProducts(): Product[] {
  const fromXlsx = loadProductsFromXlsx();
  if (fromXlsx.length > 0) {
    return fromXlsx;
  }

  return loadFallbackProductsFromJson();
}

type AppsScriptProductsResponse = {
  products?: Array<Record<string, string>>;
  error?: string;
};

async function loadProductsFromAppsScript(): Promise<Product[] | null> {
  const webAppUrl = process.env.GOOGLE_PRODUCTS_WEB_APP_URL;
  const token = process.env.GOOGLE_APPS_SCRIPT_TOKEN;

  if (!webAppUrl || !token || webAppUrl.includes("your-apps-script")) {
    return null;
  }

  const url = new URL(webAppUrl);
  url.searchParams.set("token", token);

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Apps Script products request failed (${response.status}).`);
  }

  const data = (await response.json()) as AppsScriptProductsResponse;

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.products?.length) {
    return [];
  }

  return parseProductRecords(
    data.products.map((record) => ({
      product_id: record.product_id,
      product: record.product,
      dose: record.dose,
      form: record.form,
      delivery_method: record.delivery_method,
      price: record.price,
      category: record.category,
      active: record.active ?? "true",
      sort_order: record.sort_order ?? record.product_id,
    })),
  );
}

function setProductsCache(products: Product[]) {
  productsCache = {
    expiresAt: Date.now() + PRODUCTS_CACHE_TTL_MS,
    products,
  };
}

export async function getProducts(forceRefresh = false): Promise<Product[]> {
  const now = Date.now();

  if (!forceRefresh && productsCache && productsCache.expiresAt > now) {
    return productsCache.products;
  }

  const webAppUrl = process.env.GOOGLE_PRODUCTS_WEB_APP_URL;
  const appsScriptToken = process.env.GOOGLE_APPS_SCRIPT_TOKEN;

  if (webAppUrl && appsScriptToken && !webAppUrl.includes("your-apps-script")) {
    try {
      const products = sortProductsByCategory(
        (await loadProductsFromAppsScript())?.filter((product) => product.active) ?? [],
      );
      const resolved = products.length > 0 ? products : loadLocalProducts();
      setProductsCache(resolved);
      return resolved;
    } catch (error) {
      console.error("Failed to load products from Apps Script:", error);
      const products = productsCache?.products ?? loadLocalProducts();
      setProductsCache(products);
      return products;
    }
  }

  const sheetId = process.env.GOOGLE_PRODUCTS_SHEET_ID;
  const sheets = getSheetsClient();

  if (!sheetId || !sheets || sheetId === "your-products-sheet-id") {
    const products = loadLocalProducts();
    setProductsCache(products);
    return products;
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Products!A:G",
    });

    const products = sortProductsByCategory(
      parseProductsRows(response.data.values ?? []).filter((product) => product.active),
    );

    const resolved = products.length > 0 ? products : loadLocalProducts();
    setProductsCache(resolved);
    return resolved;
  } catch (error) {
    console.error("Failed to load products from Google Sheet:", error);
    const products = productsCache?.products ?? loadLocalProducts();
    setProductsCache(products);
    return products;
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

  if (!sheetId || !sheets || sheetId === "your-orders-sheet-id") {
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
