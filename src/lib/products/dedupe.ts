import type { Product } from "@/lib/types";

function normalizeToken(value: string | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeDose(value: string | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

export function getProductSignature(
  product: Pick<Product, "baseName" | "dose" | "form" | "deliveryMethod">,
): string {
  return [
    normalizeToken(product.baseName),
    normalizeDose(product.dose),
    normalizeToken(product.form),
    normalizeToken(product.deliveryMethod),
  ].join("|");
}

function buildVariantLabel(product: Pick<Product, "dose" | "form" | "deliveryMethod">): string {
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

function buildDisplayName(baseName: string, variantLabel: string): string {
  return variantLabel === "Standard" ? baseName : `${baseName} - ${variantLabel}`;
}

function rebuildProduct(product: Product): Product {
  const variantLabel = buildVariantLabel(product);
  return {
    ...product,
    variantLabel,
    name: buildDisplayName(product.baseName, variantLabel),
  };
}

function choosePreferredProduct(current: Product, candidate: Product): Product {
  const currentSort = current.sortOrder;
  const candidateSort = candidate.sortOrder;

  if (candidateSort < currentSort) {
    return candidate;
  }

  if (candidateSort > currentSort) {
    return current;
  }

  const currentSku = Number.parseInt(current.sku, 10);
  const candidateSku = Number.parseInt(candidate.sku, 10);

  if (Number.isFinite(currentSku) && Number.isFinite(candidateSku)) {
    return candidateSku < currentSku ? candidate : current;
  }

  return current.sku.localeCompare(candidate.sku) <= 0 ? current : candidate;
}

export function mergeSplitVariantProducts(products: Product[]): Product[] {
  const byBase = new Map<string, Product[]>();

  for (const product of products) {
    const key = normalizeToken(product.baseName);
    const group = byBase.get(key) ?? [];
    group.push(product);
    byBase.set(key, group);
  }

  const merged: Product[] = [];

  for (const group of byBase.values()) {
    const used = new Set<number>();

    for (let index = 0; index < group.length; index += 1) {
      if (used.has(index)) {
        continue;
      }

      let combined = { ...group[index] };

      for (let otherIndex = index + 1; otherIndex < group.length; otherIndex += 1) {
        if (used.has(otherIndex)) {
          continue;
        }

        const other = group[otherIndex];
        const samePrice = combined.price === other.price;
        const sameDelivery =
          normalizeToken(combined.deliveryMethod) === normalizeToken(other.deliveryMethod);

        if (!samePrice || !sameDelivery) {
          continue;
        }

        const complements =
          (combined.dose && !combined.form && !other.dose && other.form) ||
          (!combined.dose && combined.form && other.dose && !other.form);

        if (!complements) {
          continue;
        }

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

export function deduplicateProducts(products: Product[]): Product[] {
  const unique = new Map<string, Product>();

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

export function finalizeProducts(products: Product[]): Product[] {
  return deduplicateProducts(mergeSplitVariantProducts(products));
}
