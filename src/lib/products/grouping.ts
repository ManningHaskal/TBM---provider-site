import type { Product, ProductCategoryFilter } from "@/lib/types";
import { deduplicateProducts } from "@/lib/products/dedupe";

export function sortProductsByCategory(products: Product[]): Product[] {
  const categoryOrder = new Map<string, number>();

  for (const product of products) {
    if (!categoryOrder.has(product.category)) {
      categoryOrder.set(product.category, categoryOrder.size);
    }
  }

  return [...products].sort((a, b) => {
    const categorySort =
      (categoryOrder.get(a.category) ?? 999) - (categoryOrder.get(b.category) ?? 999);
    if (categorySort !== 0) return categorySort;
    const nameSort = a.baseName.localeCompare(b.baseName);
    if (nameSort !== 0) return nameSort;
    return a.sortOrder - b.sortOrder || a.variantLabel.localeCompare(b.variantLabel);
  });
}

export function getProductCategories(products: Product[]): string[] {
  const categories = new Set(products.map((product) => product.category));
  return [...categories].sort((a, b) => a.localeCompare(b));
}

export function filterProductsByCategory(
  products: Product[],
  categoryFilter: ProductCategoryFilter,
): Product[] {
  if (categoryFilter === "all") {
    return [...products].sort((a, b) => a.baseName.localeCompare(b.baseName));
  }

  return products.filter((product) => product.category === categoryFilter);
}

export function getUniqueBaseNames(
  products: Product[],
  categoryFilter: ProductCategoryFilter,
): string[] {
  const filtered = filterProductsByCategory(products, categoryFilter);
  return [...new Set(filtered.map((product) => product.baseName))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getVariantsForBaseName(
  products: Product[],
  baseName: string,
  categoryFilter: ProductCategoryFilter,
): Product[] {
  return deduplicateProducts(
    filterProductsByCategory(products, categoryFilter)
      .filter((product) => product.baseName === baseName)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.variantLabel.localeCompare(b.variantLabel)),
  );
}

export function findProductBySku(products: Product[], sku: string): Product | undefined {
  return products.find((product) => product.sku === sku);
}

export function resolveLineItemSelection(
  products: Product[],
  categoryFilter: ProductCategoryFilter,
  baseName: string,
  productSku: string,
): { baseName: string; productSku: string } {
  const variants = getVariantsForBaseName(products, baseName, categoryFilter);
  if (variants.some((variant) => variant.sku === productSku)) {
    return { baseName, productSku };
  }

  const fallbackVariant = variants[0];
  if (fallbackVariant) {
    return { baseName, productSku: fallbackVariant.sku };
  }

  const product = findProductBySku(products, productSku);
  if (product) {
    return { baseName: product.baseName, productSku: product.sku };
  }

  const firstBase = getUniqueBaseNames(products, categoryFilter)[0];
  const firstVariant = firstBase
    ? getVariantsForBaseName(products, firstBase, categoryFilter)[0]
    : undefined;

  return {
    baseName: firstBase ?? "",
    productSku: firstVariant?.sku ?? productSku,
  };
}

export function getInitialLineItem(
  products: Product[],
  categoryFilter: ProductCategoryFilter,
  productSku?: string,
): { baseName: string; productSku: string } {
  if (productSku) {
    const product = findProductBySku(products, productSku);
    if (product) {
      return { baseName: product.baseName, productSku: product.sku };
    }
  }

  const firstBase = getUniqueBaseNames(products, categoryFilter)[0];
  const firstVariant = firstBase
    ? getVariantsForBaseName(products, firstBase, categoryFilter)[0]
    : undefined;

  return {
    baseName: firstBase ?? "",
    productSku: firstVariant?.sku ?? "",
  };
}
