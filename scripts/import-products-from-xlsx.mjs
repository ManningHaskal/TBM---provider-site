import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import * as XLSX from "xlsx";

const xlsxPath = resolve(process.cwd(), "Healthcare Provider Live Products & Prices.xlsx");
const workbook = XLSX.read(readFileSync(xlsxPath), { type: "buffer" });
const sheetName = workbook.SheetNames[0];
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

const categoryOrder = new Map();

function buildVariantLabel(row) {
  const dose = String(row[" Dose"] ?? row.Dose ?? "").trim();
  const form = String(row[" Form"] ?? row.Form ?? "").trim();
  const delivery = String(row[" Delivery Method"] ?? row["Delivery Method"] ?? "").trim();
  const parts = [dose, form].filter(Boolean);
  let label = parts.join(" · ");
  if (delivery) {
    label = label ? `${label} · ${delivery}` : delivery;
  }
  return label || "Standard";
}

const products = rows
  .map((row, index) => {
    const id = row["Product ID"] ?? row[" ID #"] ?? index + 1;
    const baseName = String(row[" Product"] ?? row.Product ?? "").trim();
    const variantLabel = buildVariantLabel(row);
    const price = Number(row[" Price"] ?? row.Price ?? 0);
    const category = String(row.Category ?? "Uncategorized").trim() || "Uncategorized";
    const name = variantLabel === "Standard" ? baseName : `${baseName} - ${variantLabel}`;

    if (!categoryOrder.has(category)) {
      categoryOrder.set(category, categoryOrder.size);
    }

    return {
      name,
      baseName,
      variantLabel,
      sku: String(id),
      price,
      active: true,
      sortOrder: Number(id) || index + 1,
      category,
      dose: String(row[" Dose"] ?? row.Dose ?? "").trim() || undefined,
      form: String(row[" Form"] ?? row.Form ?? "").trim() || undefined,
      deliveryMethod:
        String(row[" Delivery Method"] ?? row["Delivery Method"] ?? "").trim() || undefined,
    };
  })
  .filter((product) => product.baseName && product.price > 0)
  .sort((a, b) => {
    const categorySort =
      (categoryOrder.get(a.category) ?? 999) - (categoryOrder.get(b.category) ?? 999);
    if (categorySort !== 0) return categorySort;
    const nameSort = a.baseName.localeCompare(b.baseName);
    if (nameSort !== 0) return nameSort;
    return a.sortOrder - b.sortOrder || a.variantLabel.localeCompare(b.variantLabel);
  });

writeFileSync(
  resolve(process.cwd(), "src/data/products.json"),
  `${JSON.stringify(products, null, 2)}\n`,
);

const csvLines = ["name,base_name,variant_label,sku,price,active,sort_order,category"];
for (const product of products) {
  csvLines.push(
    [
      JSON.stringify(product.name),
      JSON.stringify(product.baseName),
      JSON.stringify(product.variantLabel),
      product.sku,
      product.price,
      "TRUE",
      product.sortOrder,
      JSON.stringify(product.category),
    ].join(","),
  );
}

writeFileSync(resolve(process.cwd(), "products-for-google-sheet.csv"), `${csvLines.join("\n")}\n`);

console.log(`Imported ${products.length} products into src/data/products.json`);
console.log("Updated products-for-google-sheet.csv");
