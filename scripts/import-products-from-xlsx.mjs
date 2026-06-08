import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import * as XLSX from "xlsx";

function normalizeToken(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeDose(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function getProductSignature(product) {
  return [
    normalizeToken(product.baseName),
    normalizeDose(product.dose),
    normalizeToken(product.form),
    normalizeToken(product.deliveryMethod),
  ].join("|");
}

function buildVariantLabelFromParts(product) {
  const dose = String(product.dose ?? "").trim();
  const form = String(product.form ?? "").trim();
  const delivery = String(product.deliveryMethod ?? "").trim();
  const parts = [dose, form].filter(Boolean);
  let label = parts.join(" · ");
  if (delivery) {
    label = label ? `${label} · ${delivery}` : delivery;
  }
  return label || "Standard";
}

function rebuildProduct(product) {
  const variantLabel = buildVariantLabelFromParts(product);
  return {
    ...product,
    variantLabel,
    name: variantLabel === "Standard" ? product.baseName : `${product.baseName} - ${variantLabel}`,
  };
}

function choosePreferredProduct(current, candidate) {
  if (candidate.sortOrder < current.sortOrder) return candidate;
  if (candidate.sortOrder > current.sortOrder) return current;

  const currentSku = Number.parseInt(current.sku, 10);
  const candidateSku = Number.parseInt(candidate.sku, 10);

  if (Number.isFinite(currentSku) && Number.isFinite(candidateSku)) {
    return candidateSku < currentSku ? candidate : current;
  }

  return current.sku.localeCompare(candidate.sku) <= 0 ? current : candidate;
}

function mergeSplitVariantProducts(products) {
  const byBase = new Map();

  for (const product of products) {
    const key = normalizeToken(product.baseName);
    const group = byBase.get(key) ?? [];
    group.push(product);
    byBase.set(key, group);
  }

  const merged = [];

  for (const group of byBase.values()) {
    const used = new Set();

    for (let index = 0; index < group.length; index += 1) {
      if (used.has(index)) continue;

      let combined = { ...group[index] };

      for (let otherIndex = index + 1; otherIndex < group.length; otherIndex += 1) {
        if (used.has(otherIndex)) continue;

        const other = group[otherIndex];
        if (combined.price !== other.price) continue;
        if (normalizeToken(combined.deliveryMethod) !== normalizeToken(other.deliveryMethod)) {
          continue;
        }

        const complements =
          (combined.dose && !combined.form && !other.dose && other.form) ||
          (!combined.dose && combined.form && other.dose && !other.form);

        if (!complements) continue;

        combined = rebuildProduct({
          ...combined,
          dose: combined.dose || other.dose,
          form: combined.form || other.form,
          deliveryMethod: combined.deliveryMethod || other.deliveryMethod,
          sortOrder: Math.min(combined.sortOrder, other.sortOrder),
        });
        used.add(otherIndex);
      }

      merged.push(rebuildProduct(combined));
      used.add(index);
    }
  }

  return merged;
}

function deduplicateProducts(products) {
  const unique = new Map();

  for (const product of products) {
    const signature = getProductSignature(product);
    const existing = unique.get(signature);

    if (!existing) {
      unique.set(signature, rebuildProduct(product));
      continue;
    }

    unique.set(signature, rebuildProduct(choosePreferredProduct(existing, product)));
  }

  return [...unique.values()];
}

function finalizeProducts(products) {
  return deduplicateProducts(mergeSplitVariantProducts(products));
}

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

const rawProducts = rows
  .map((row, index) => {
    const id = row["Product ID"] ?? row[" ID #"] ?? index + 1;
    const baseName = String(row[" Product"] ?? row.Product ?? "").trim();
    const variantLabel = buildVariantLabel(row);
    const price = Number(row[" Price"] ?? row.Price ?? 0);
    const category = String(row.Category ?? "Uncategorized").trim() || "Uncategorized";
    const name = variantLabel === "Standard" ? baseName : `${baseName} - ${variantLabel}`;

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
  .filter((product) => product.baseName && product.price > 0);

const products = finalizeProducts(rawProducts);

for (const product of products) {
  if (!categoryOrder.has(product.category)) {
    categoryOrder.set(product.category, categoryOrder.size);
  }
}

products.sort((a, b) => {
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
