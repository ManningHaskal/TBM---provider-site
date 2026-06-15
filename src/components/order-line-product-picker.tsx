"use client";

import type { Product, ProductCategoryFilter } from "@/lib/types";
import {
  findProductBySku,
  getInitialLineItem,
  getProductCategories,
  getUniqueBaseNames,
  getVariantsForBaseName,
} from "@/lib/products/grouping";

type OrderLineProductPickerProps = {
  products: Product[];
  categoryFilter: ProductCategoryFilter;
  baseName: string;
  sku: string;
  onCategoryChange: (value: ProductCategoryFilter) => void;
  onBaseNameChange: (baseName: string) => void;
  onSkuChange: (sku: string) => void;
};

const selectClassName =
  "w-full rounded-lg border border-tbm-border px-3 py-2 text-sm text-tbm-navy";

export function OrderLineProductPicker({
  products,
  categoryFilter,
  baseName,
  sku,
  onCategoryChange,
  onBaseNameChange,
  onSkuChange,
}: OrderLineProductPickerProps) {
  const categories = getProductCategories(products);
  const baseNames = getUniqueBaseNames(products, categoryFilter);
  const selectedProduct = sku ? findProductBySku(products, sku) : undefined;

  const displayBaseNames =
    baseName && !baseNames.includes(baseName)
      ? [...baseNames, baseName].sort((a, b) => a.localeCompare(b))
      : baseNames;

  const variants = baseName
    ? getVariantsForBaseName(products, baseName, categoryFilter)
    : [];

  const displayVariants =
    selectedProduct && !variants.some((variant) => variant.sku === selectedProduct.sku)
      ? [selectedProduct, ...variants]
      : variants;

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-tbm-navy">Category</span>
        <select
          value={categoryFilter}
          onChange={(event) => onCategoryChange(event.target.value)}
          className={selectClassName}
        >
          <option value="all">All products (A–Z)</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="font-medium text-tbm-navy">Product</span>
          <select
            value={baseName}
            onChange={(event) => {
              const nextBaseName = event.target.value;
              onBaseNameChange(nextBaseName);
              const nextVariants = getVariantsForBaseName(
                products,
                nextBaseName,
                categoryFilter,
              );
              onSkuChange(nextVariants[0]?.sku ?? "");
            }}
            className={selectClassName}
          >
            <option value="">Select product</option>
            {displayBaseNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="font-medium text-tbm-navy">Dosage / form</span>
          <select
            value={sku}
            onChange={(event) => onSkuChange(event.target.value)}
            className={selectClassName}
            disabled={!baseName && !sku}
          >
            <option value="">Select option</option>
            {displayVariants.map((variant) => (
              <option key={variant.sku} value={variant.sku}>
                {variant.variantLabel} — ${variant.price.toFixed(2)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
