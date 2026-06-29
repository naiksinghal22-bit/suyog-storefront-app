import type {
  MobileCollectionResponse,
  MobileHomeResponse,
  MobileProductResponse,
  MobileSearchResponse,
  MobileUpdatesResponse,
} from "@/src/types/storefront";

function getApiBaseUrl() {
  const value = process.env.EXPO_PUBLIC_STOREFRONT_API_BASE_URL?.trim();
  return value && value.length > 0 ? value.replace(/\/+$/, "") : "https://www.suyogfashions.com";
}

async function apiGet<T>(path: string): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const rawMessage = await response.text();
    const message = rawMessage.trim();
    throw new Error(message || `Request failed with status ${response.status} for ${url}`);
  }

  return (await response.json()) as T;
}

export async function fetchMobileHome() {
  return apiGet<MobileHomeResponse>("/api/mobile/home");
}

export async function fetchMobileProduct(slug: string) {
  return apiGet<MobileProductResponse>(`/api/mobile/products/${encodeURIComponent(slug)}`);
}

export async function fetchMobileCollection(slug: string) {
  return apiGet<MobileCollectionResponse>(`/api/mobile/collections/${encodeURIComponent(slug)}`);
}

export async function searchMobileStorefront(query: string) {
  return apiGet<MobileSearchResponse>(`/api/mobile/search?q=${encodeURIComponent(query)}`);
}

export async function fetchMobileUpdates(limit = 50) {
  return apiGet<MobileUpdatesResponse>(`/api/mobile/updates?limit=${limit}`);
}
