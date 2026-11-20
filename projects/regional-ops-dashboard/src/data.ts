import type { Product } from "./types";

export const demoProducts: Product[] = [
  { id: "p-1", sku: "BR-1042", name: "Temperature sensor", region: "BR-SC", onHand: 28, reorderPoint: 18, version: 1 },
  { id: "p-2", sku: "US-2081", name: "Industrial gateway", region: "US-EAST", onHand: 9, reorderPoint: 14, version: 1 },
  { id: "p-3", sku: "EU-3310", name: "Power module", region: "EU-WEST", onHand: 44, reorderPoint: 20, version: 1 },
  { id: "p-4", sku: "BR-5177", name: "Fiber connector set", region: "BR-SC", onHand: 7, reorderPoint: 12, version: 1 },
  { id: "p-5", sku: "US-4403", name: "Control board", region: "US-EAST", onHand: 31, reorderPoint: 16, version: 1 },
  { id: "p-6", sku: "EU-9020", name: "Voltage regulator", region: "EU-WEST", onHand: 12, reorderPoint: 12, version: 1 },
  { id: "p-7", sku: "BR-2019", name: "Mounting bracket", region: "BR-SC", onHand: 65, reorderPoint: 24, version: 1 }
];
