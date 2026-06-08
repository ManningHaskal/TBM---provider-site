import { existsSync, readFileSync } from "fs";
import { join } from "path";
import * as XLSX from "xlsx";
import catalogProducts from "@/data/products.json";
import { finalizeProducts } from "@/lib/products/dedupe";
import type { Product } from "@/lib/types";
import { sortProductsByCategory } from "@/lib/products/grouping";

export const DEFAULT_PRODUCTS_XLSX = "Healthcare Provider Live Products & Prices.xlsx";

type ProductRow = Record<string, string | number>;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  if (normalized === "false" || normalized === "no" || normalized === "0") {
    return false;
  }
  return true;
}

function buildVariantLabel(record: ProductRow): string {
  const dose = String(record.dose ?? "").trim();
  const form = String(record.form ?? "").trim();
  const delivery = String(record.delivery_method ?? "").trim();
  const parts = [dose, form].filter(Boolean);
  let label = parts.join(" · ");
  if (delivery) {
    label = label ? `${label} · ${delivery}` : delivery;
  }
  return label || "Standard";
}

function buildDisplayName(baseName: string, variantLabel: string): string {
  return variantLabel === "Standard" ? baseName : `${baseName} - ${variantLabel}`;
}

export function parseProductRecords(rows: ProductRow[]): Product[] {
  const parsed = rows
    .map((record, index) => {
      const sku = String(
        record.product_id ?? record.id ?? record.sku ?? record["product id"] ?? "",
      ).trim();
      const price = Number.parseFloat(String(record.price ?? "0"));
      const sortOrder =
        Number.parseInt(String(record.product_id ?? record.sort_order ?? index + 1), 10) ||
        index + 1;
      const baseName = String(record.product ?? record.name ?? "").trim();
      const variantLabel = buildVariantLabel(record);
      const name = buildDisplayName(baseName, variantLabel);
      const category = String(record.category ?? "Uncategorized").trim() || "Uncategorized";

      return {
        name,
        baseName,
        variantLabel,
        sku,
        price: Number.isFinite(price) ? price : 0,
        active: parseBoolean(String(record.active ?? "true")),
        sortOrder,
        category,
        dose: String(record.dose ?? "").trim() || undefined,
        form: String(record.form ?? "").trim() || undefined,
        deliveryMethod: String(record.delivery_method ?? "").trim() || undefined,
      } satisfies Product;
    })
    .filter((product) => product.baseName && product.sku && product.price > 0);

  return finalizeProducts(parsed);
}

function rowsFromSheetRows(rows: unknown[][]): ProductRow[] {
  if (rows.length < 2) return [];

  const headers = (rows[0] as unknown[]).map((cell) => normalizeHeader(String(cell ?? "")));

  return rows.slice(1).map((row) => {
    const record: ProductRow = {};
    headers.forEach((header, index) => {
      const value = (row as unknown[])[index];
      record[header] =
        value === undefined || value === null ? "" : (value as string | number);
    });
    return record;
  });
}

export function loadProductsFromXlsx(
  filePath = join(process.cwd(), DEFAULT_PRODUCTS_XLSX),
): Product[] {
  if (!existsSync(filePath)) {
    return [];
  }

  const workbook = XLSX.read(readFileSync(filePath), { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
  });

  const products = parseProductRecords(rowsFromSheetRows(rows))
    .filter((product) => product.active);
  return sortProductsByCategory(products);
}

export function loadFallbackProductsFromJson(): Product[] {
  return sortProductsByCategory(finalizeProducts(catalogProducts as Product[]));
}
