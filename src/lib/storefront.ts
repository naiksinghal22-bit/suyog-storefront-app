import type { Href } from "expo-router";

import type { StorefrontCategoryTile, StorefrontItem } from "@/src/types/storefront";

const WEBSITE_BASE_URL = "https://www.suyogfashions.com";
const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() || `${WEBSITE_BASE_URL}/privacy-policy`;
const SUPPORT_URL = process.env.EXPO_PUBLIC_SUPPORT_URL?.trim() || `${WEBSITE_BASE_URL}/contact`;
const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || "contact@suyogfashions.com";

export function slugifyValue(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatProductPrice(item: StorefrontItem) {
  if (item.soldOut) return "Sold out";
  return `$${Math.round(Number(item.sellingPriceUsd || 0))}`;
}

export function buildProductHref(slug: string): Href {
  return `/product/${slug}` as Href;
}

export function buildBrowseHref(slug: string, kind: "collection" | "category", title?: string): Href {
  return {
    pathname: "/browse/[slug]",
    params: {
      slug,
      kind,
      title: title ?? slug,
    },
  } as Href;
}

export function buildSearchHref(query?: string): Href {
  return {
    pathname: "/search",
    params: query ? { q: query } : {},
  } as Href;
}

export function resolveWebsiteHref(href?: string): Href {
  const normalized = (href || "").trim();
  if (!normalized || normalized === "/" || normalized === "/shop") {
    return "/" as Href;
  }

  if (normalized.startsWith("/shop/new-arrivals")) {
    return buildBrowseHref("new-arrivals", "collection", "New Arrivals");
  }

  if (normalized.startsWith("/shop/featured")) {
    return buildBrowseHref("featured", "collection", "Featured");
  }

  const collectionMatch = normalized.match(/^\/shop\/collection\/([^/?#]+)/i);
  if (collectionMatch?.[1]) {
    return buildBrowseHref(collectionMatch[1], "collection");
  }

  const categoryMatch = normalized.match(/^\/shop\/category\/([^/?#]+)/i);
  if (categoryMatch?.[1]) {
    return buildBrowseHref(categoryMatch[1], "category");
  }

  const productMatch = normalized.match(/^\/shop\/product\/([^/?#]+)/i);
  if (productMatch?.[1]) {
    return buildProductHref(productMatch[1]);
  }

  return "/" as Href;
}

export function buildCategoryTileHref(tile: StorefrontCategoryTile): Href {
  if (tile.collectionSlug?.trim()) {
    return buildBrowseHref(tile.collectionSlug.trim(), "collection", tile.name);
  }
  return buildBrowseHref(tile.slug, "category", tile.name);
}

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/19454005058?text=${encodeURIComponent(message)}`;
}

export function buildProductWebsiteUrl(slug: string) {
  return `${WEBSITE_BASE_URL}/products/${slug}`;
}

export function getWebsiteBaseUrl() {
  return WEBSITE_BASE_URL;
}

export function getPrivacyPolicyUrl() {
  return PRIVACY_POLICY_URL;
}

export function getSupportUrl() {
  return SUPPORT_URL;
}

export function getSupportEmail() {
  return SUPPORT_EMAIL;
}

export function buildProductShareMessage(item: StorefrontItem, sku?: string) {
  const pieces = [`${item.title}`, formatProductPrice(item)];
  if (sku) pieces.push(`SKU: ${sku}`);
  pieces.push(buildProductWebsiteUrl(item.slug));
  return pieces.join(" | ");
}

export function buildProductWhatsAppMessage(item: StorefrontItem, options?: { sku?: string; color?: string; size?: string }) {
  const details = [options?.sku ? `SKU: ${options.sku}` : "", options?.color ? `Color: ${options.color}` : "", options?.size ? `Size: ${options.size}` : ""]
    .filter(Boolean)
    .join(", ");

  return `Hi, I want to know more about ${item.title}.${details ? ` ${details}.` : ""} ${buildProductWebsiteUrl(item.slug)}`;
}
