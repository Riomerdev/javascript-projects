import type { ProductPage } from "./types";

const apiBase = import.meta.env.VITE_INVENTORY_API_URL ?? "http://localhost:5080";

export async function getLiveProducts(): Promise<ProductPage> {
  const response = await fetch(apiBase + "/api/products?page=1&pageSize=100");
  if (!response.ok) {
    throw new Error("API respondió con estado " + response.status);
  }
  return response.json() as Promise<ProductPage>;
}
