export type Product = {
  id: string;
  sku: string;
  name: string;
  region: string;
  onHand: number;
  reorderPoint: number;
  version: number;
};

export type ProductPage = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
};
