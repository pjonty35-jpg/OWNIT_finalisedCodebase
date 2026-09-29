export interface CatalogColor {
  name: string;
  hex: string;
  variantIdBySize: Record<string, string>;
  sizes: string[];
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  categoryName: string;
  silhouette: string;
  basePrice: number;
  image: string | null;
  printAreas: { side: string; widthPx: number; heightPx: number; method: string }[];
  colors: CatalogColor[];
}
