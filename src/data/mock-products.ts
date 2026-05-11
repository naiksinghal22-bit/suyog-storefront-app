export type ProductCard = {
  slug: string;
  name: string;
  collection: string;
  priceLabel: string;
  description: string;
};

export const newArrivals: ProductCard[] = [
  {
    slug: "ivory-zari-kurta-set",
    name: "Ivory Zari Kurta Set",
    collection: "New Arrivals",
    priceLabel: "$149",
    description: "A soft festive silhouette designed for quick discovery in the app and WhatsApp-first ordering.",
  },
  {
    slug: "rose-chikankari-anarkali",
    name: "Rose Chikankari Anarkali",
    collection: "New Arrivals",
    priceLabel: "$169",
    description: "An iOS-first product detail layout should feel premium, visual, and fast to browse for repeat customers.",
  },
];

export const featuredProducts: ProductCard[] = [
  {
    slug: "sage-occasion-edit",
    name: "Sage Occasion Edit",
    collection: "Featured Collection",
    priceLabel: "$189",
    description: "Use this slot later for campaign-led curation, not just raw catalog order.",
  },
  {
    slug: "mehfil-evening-picks",
    name: "Mehfil Evening Picks",
    collection: "Featured Collection",
    priceLabel: "$199",
    description: "A polished home feed matters more than deep ecommerce complexity for your first mobile version.",
  },
];

export function getProductBySlug(slug?: string) {
  return [...newArrivals, ...featuredProducts].find((product) => product.slug === slug);
}
