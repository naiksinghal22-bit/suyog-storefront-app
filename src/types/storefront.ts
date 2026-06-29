export type StorefrontMedia = {
  id: string;
  url: string;
  alt?: string;
  order?: number;
};

export type StorefrontVariant = {
  id: string;
  itemId: string;
  sku: string;
  color: string;
  size: string;
  qtyAvailable: number;
  qtySold: number;
  status: "IN_STOCK" | "SOLD";
  variantImages: StorefrontMedia[];
  linkedInventoryItemIds: string[];
};

export type StorefrontItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  shortDescription?: string;
  fabric?: string;
  workDetails?: string;
  careInstructions?: string;
  sellingPriceUsd: number;
  costPrice: number;
  billId: string;
  billNumber: string;
  billTag?: string;
  seqNo?: number;
  itemImages: StorefrontMedia[];
  itemVideos: StorefrontMedia[];
  totalQtyAvailable: number;
  totalQtySold: number;
  inStock: boolean;
  soldOut: boolean;
  status: "ACTIVE" | "SOLD_OUT";
  catalogItemId?: string;
  featured: boolean;
  newArrival: boolean;
  variants: StorefrontVariant[];
};

export type StorefrontCollection = {
  id: string;
  name: string;
  slug: string;
  kind: "FEATURED" | "NEW_ARRIVAL" | "CUSTOM";
  mode: "MANUAL" | "DYNAMIC";
  inventoryScope: "IN_STOCK_ONLY" | "INCLUDE_SOLD";
  description: string;
  imageUrl: string;
  imagePosition: string;
  itemIds: string[];
  excludedItemIds: string[];
  rule: {
    billTags: string[];
    seqNos: number[];
    categories: string[];
    sizes: string[];
    minSellingPriceUsd?: number;
    maxSellingPriceUsd?: number;
  };
};

export type StorefrontCategoryTile = {
  id: string;
  name: string;
  slug: string;
  collectionSlug?: string;
  imageUrl?: string;
  objectPosition?: string;
  imageFit?: "cover" | "contain";
  imageScalePercent?: number;
};

export type StorefrontHeroSlide = {
  id: string;
  label: string;
  eyebrow?: string;
  title: string;
  copy?: string;
  imageUrl: string;
  href?: string;
  imageFit?: "cover" | "contain";
  imageScalePercent?: number;
  objectPosition?: string;
};

export type StorefrontNavItem = {
  name: string;
  href?: string;
  children?: StorefrontNavItem[];
};

export type StorefrontSizeCollectionSlot = {
  size: string;
  collectionSlug: string;
};

export type MobileHomeResponse = {
  storefrontItems: StorefrontItem[];
  newArrivalItems: StorefrontItem[];
  featuredItems: StorefrontItem[];
  catalogCollections: StorefrontCollection[];
  heroSlides: StorefrontHeroSlide[];
  collectionButtons: StorefrontCategoryTile[];
  sizeCollectionSlots: StorefrontSizeCollectionSlot[];
  heroAutoRotate: boolean;
  heroAutoRotateSeconds: number;
  navItems: StorefrontNavItem[];
};

export type MobileProductResponse = {
  item: StorefrontItem;
};

export type MobileCollectionResponse = {
  collection: StorefrontCollection | null;
  items: StorefrontItem[];
};

export type StorefrontSearchLinkResult = {
  kind: "collection" | "category";
  label: string;
  href: string;
  description?: string;
};

export type MobileSearchResponse = {
  query: string;
  items: StorefrontItem[];
  links: StorefrontSearchLinkResult[];
};

export type MobileUpdateItem = {
  id: string;
  title: string;
  body: string;
  targetUrl: string;
  category?: string;
  createdAt: string;
};

export type MobileUpdatesResponse = {
  items: MobileUpdateItem[];
};
