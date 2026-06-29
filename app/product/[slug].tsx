import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/src/components/app-header";
import { fetchMobileHome, fetchMobileProduct } from "@/src/lib/api";
import { addProductInterest, addSizePreference } from "@/src/lib/push-admin";
import { ProductGridCard } from "@/src/components/product-grid-card";
import { formatUsd } from "@/src/lib/format";
import { buildProductShareMessage, buildProductWhatsAppMessage, buildSearchHref, buildProductWebsiteUrl, buildWhatsAppUrl } from "@/src/lib/storefront";
import { colors, spacing } from "@/src/lib/theme";
import type { StorefrontItem, StorefrontVariant } from "@/src/types/storefront";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);
  const [product, setProduct] = useState<StorefrontItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<StorefrontItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Missing product slug");
      return;
    }

    let active = true;

    async function load() {
      try {
        const result = await fetchMobileProduct(slug);
        const home = await fetchMobileHome();
        if (!active) return;

        setProduct(result.item);
        const defaultVariant = getDefaultVariant(result.item);
        setSelectedColor(getLabelValue(defaultVariant?.color));
        setSelectedSize(getLabelValue(defaultVariant?.size));
        setRelatedItems(
          home.storefrontItems
            .filter((item) => item.slug !== result.item.slug && item.category === result.item.category)
            .slice(0, 6),
        );
        setError("");
      } catch (nextError) {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to load product");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const visibleVariants = useMemo(() => getVisibleVariants(product), [product]);
  const selectableVariants = useMemo(() => getSelectableVariants(visibleVariants), [visibleVariants]);
  const colorOptions = useMemo(() => getUniqueValues(selectableVariants.map((variant) => getLabelValue(variant.color))), [selectableVariants]);
  const sizeOptions = useMemo(() => getUniqueValues(selectableVariants.map((variant) => getLabelValue(variant.size))), [selectableVariants]);

  const availableColorsForSelectedSize = useMemo(() => {
    if (!selectedSize) return new Set(colorOptions);
    return new Set(
      selectableVariants
        .filter((variant) => getLabelValue(variant.size) === selectedSize)
        .map((variant) => getLabelValue(variant.color)),
    );
  }, [colorOptions, selectableVariants, selectedSize]);

  const availableSizesForSelectedColor = useMemo(() => {
    if (!selectedColor) return new Set(sizeOptions);
    return new Set(
      selectableVariants
        .filter((variant) => getLabelValue(variant.color) === selectedColor)
        .map((variant) => getLabelValue(variant.size)),
    );
  }, [selectableVariants, selectedColor, sizeOptions]);

  const selectedVariant = useMemo(
    () => resolveVariant(selectableVariants, selectedColor, selectedSize) ?? getDefaultVariantFromList(selectableVariants),
    [selectableVariants, selectedColor, selectedSize],
  );

  const galleryImages = useMemo(() => getGalleryImages(product, selectedVariant), [product, selectedVariant]);
  const galleryWidth = Math.max(width, 320);
  const selectedSku = selectedVariant?.sku?.trim() || "";
  const selectedColorLabel = selectedColor || getLabelValue(selectedVariant?.color);
  const selectedSizeLabel = selectedSize || getLabelValue(selectedVariant?.size);
  const productWebsiteUrl = product ? buildProductWebsiteUrl(product.slug) : "";
  const whatsappUrl = product
    ? buildWhatsAppUrl(
        buildProductWhatsAppMessage(product, {
          sku: selectedSku,
          color: selectedColorLabel,
          size: selectedSizeLabel,
        }),
      )
    : "";
  const variantHasGallery = (selectedVariant?.variantImages?.length ?? 0) > 0;
  const variantGalleryCount = selectedVariant?.variantImages?.length ?? 0;
  const showVariantBadge = variantHasGallery && activeImageIndex < variantGalleryCount;

  useEffect(() => {
    setActiveImageIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [product?.id, selectedColor, selectedSize]);

  useEffect(() => {
    if (!slug) return;
    void addProductInterest(slug);
  }, [slug]);

  useEffect(() => {
    if (!selectedSize) return;
    void addSizePreference(selectedSize);
  }, [selectedSize]);

  useEffect(() => {
    const nextVariant =
      resolveVariant(selectableVariants, selectedColor, selectedSize) ??
      findVariantByColor(selectableVariants, selectedColor) ??
      findVariantBySize(selectableVariants, selectedSize) ??
      getDefaultVariantFromList(selectableVariants);

    if (!nextVariant) return;

    const nextColor = getLabelValue(nextVariant.color);
    const nextSize = getLabelValue(nextVariant.size);

    if (nextColor !== selectedColor) setSelectedColor(nextColor);
    if (nextSize !== selectedSize) setSelectedSize(nextSize);
  }, [selectableVariants, selectedColor, selectedSize]);

  function handleSelectColor(color: string) {
    const nextVariant = resolveVariant(selectableVariants, color, selectedSize) ?? findVariantByColor(selectableVariants, color);
    if (!nextVariant) return;
    setSelectedColor(getLabelValue(nextVariant.color));
    setSelectedSize(getLabelValue(nextVariant.size));
  }

  function handleSelectSize(size: string) {
    const nextVariant = resolveVariant(selectableVariants, selectedColor, size) ?? findVariantBySize(selectableVariants, size);
    if (!nextVariant) return;
    setSelectedColor(getLabelValue(nextVariant.color));
    setSelectedSize(getLabelValue(nextVariant.size));
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Product not found</Text>
          <Text style={styles.errorText}>{error || "This item is unavailable right now."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        <AppHeader title="Suyog Fashions" showBack compact />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.galleryWrap}>
            {galleryImages.length > 0 ? (
              <>
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / galleryWidth);
                    setActiveImageIndex(nextIndex);
                  }}
                >
                  {galleryImages.map((image) => (
                    <ScrollView
                      key={image.id}
                      style={{ width: galleryWidth }}
                      contentContainerStyle={styles.zoomFrame}
                      maximumZoomScale={3}
                      minimumZoomScale={1}
                      showsHorizontalScrollIndicator={false}
                      showsVerticalScrollIndicator={false}
                      bouncesZoom
                      centerContent
                    >
                      <Image key={image.id} source={{ uri: image.url }} style={[styles.heroImage, { width: galleryWidth }]} resizeMode="contain" />
                    </ScrollView>
                  ))}
                </ScrollView>
                <View style={styles.galleryTopRow}>
                  {showVariantBadge ? (
                    <View style={styles.galleryBadge}>
                      <Text style={styles.galleryBadgeText}>{selectedColor || selectedSize || "Selected"}</Text>
                    </View>
                  ) : (
                    <View />
                  )}
                  <View style={styles.galleryCounter}>
                    <Text style={styles.galleryCounterText}>
                      {activeImageIndex + 1} / {galleryImages.length}
                    </Text>
                  </View>
                </View>
                {galleryImages.length > 1 ? (
                  <View style={styles.heroDots}>
                    {galleryImages.map((image, index) => (
                      <View key={image.id} style={[styles.heroDot, activeImageIndex === index ? styles.heroDotActive : null]} />
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <View style={[styles.heroImage, styles.heroFallback, { width: galleryWidth }]}>
                <Text style={styles.heroFallbackTitle}>Images coming soon</Text>
              </View>
            )}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.name}>{product.title}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatUsd(product.sellingPriceUsd)}</Text>
              {product.inStock ? <Text style={styles.stockLabel}>In stock</Text> : <Text style={styles.stockLabelMuted}>Sold out</Text>}
            </View>
            {product.category ? <Text style={styles.categoryText}>{product.category}</Text> : null}
            {product.shortDescription || product.description ? <Text style={styles.description}>{product.shortDescription || product.description}</Text> : null}

            <Pressable style={styles.whatsAppCard} onPress={() => Linking.openURL(whatsappUrl)}>
              <View style={styles.whatsAppIconShell}>
                <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
              </View>
              <View style={styles.whatsAppCopy}>
                <Text style={styles.whatsAppCardTitle}>Need help with size or style?</Text>
                <Text style={styles.whatsAppCardText}>{selectedSku ? `WhatsApp us with SKU ${selectedSku}` : "Chat with us directly on WhatsApp"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.dark} />
            </Pressable>

            {colorOptions.length > 0 ? (
              <View style={styles.optionSection}>
                <Text style={styles.optionTitle}>Color</Text>
                <View style={styles.optionWrap}>
                  {colorOptions.map((color) => {
                    const active = color === selectedColor;
                    const available = availableColorsForSelectedSize.has(color);
                    return (
                      <Pressable
                        key={color}
                        disabled={!available}
                        style={[styles.optionChip, active ? styles.optionChipActive : null, !available ? styles.optionChipUnavailable : null]}
                        onPress={() => handleSelectColor(color)}
                      >
                        <Text style={[styles.optionChipText, active ? styles.optionChipTextActive : null, !available ? styles.optionChipTextUnavailable : null]}>{color}</Text>
                        {!available ? <View pointerEvents="none" style={styles.optionChipSlash} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {sizeOptions.length > 0 ? (
              <View style={styles.optionSection}>
                <Text style={styles.optionTitle}>Size</Text>
                <View style={styles.optionWrap}>
                  {sizeOptions.map((size) => {
                    const active = size === selectedSize;
                    const available = availableSizesForSelectedColor.has(size);
                    return (
                      <Pressable
                        key={size}
                        disabled={!available}
                        style={[styles.optionChip, active ? styles.optionChipActive : null, !available ? styles.optionChipUnavailable : null]}
                        onPress={() => handleSelectSize(size)}
                      >
                        <Text style={[styles.optionChipText, active ? styles.optionChipTextActive : null, !available ? styles.optionChipTextUnavailable : null]}>{size}</Text>
                        {!available ? <View pointerEvents="none" style={styles.optionChipSlash} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.infoGrid}>
              <InfoPill label="Category" value={product.category} />
              {selectedVariant?.sku ? <InfoPill label="SKU" value={selectedVariant.sku} /> : null}
              {selectedVariant?.qtyAvailable ? <InfoPill label="Available" value={`${selectedVariant.qtyAvailable}`} /> : null}
              {product.fabric ? <InfoPill label="Fabric" value={product.fabric} /> : null}
            </View>

            {product.workDetails || product.careInstructions ? (
              <View style={styles.detailBlock}>
                <Text style={styles.detailBlockTitle}>Product details</Text>
                {product.workDetails ? <Text style={styles.detailBlockText}>{product.workDetails}</Text> : null}
                {product.careInstructions ? <Text style={styles.detailBlockText}>Care: {product.careInstructions}</Text> : null}
              </View>
            ) : null}
          </View>

          {relatedItems.length > 0 ? (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedHeading}>More to explore</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRail}>
                {relatedItems.map((item) => (
                  <View key={item.id} style={styles.relatedItem}>
                    <ProductGridCard item={item} />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable style={styles.bottomAction} onPress={() => router.replace("/")}>
            <Ionicons name="home-outline" size={20} color={colors.accent} />
            <Text style={styles.bottomActionText}>Home</Text>
          </Pressable>
          <Pressable style={styles.bottomAction} onPress={() => router.push(buildSearchHref())}>
            <Ionicons name="search-outline" size={20} color={colors.accent} />
            <Text style={styles.bottomActionText}>Search</Text>
          </Pressable>
          <Pressable
            style={styles.bottomAction}
            onPress={() => {
              void Share.share({
                message: buildProductShareMessage(product, selectedSku),
                url: productWebsiteUrl,
              });
            }}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.accent} />
            <Text style={styles.bottomActionText}>Share</Text>
          </Pressable>
          <Pressable style={[styles.bottomAction, styles.bottomActionPrimary]} onPress={() => Linking.openURL(whatsappUrl)}>
            <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
            <Text style={styles.bottomActionTextPrimary}>WhatsApp</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function getDefaultVariant(product: StorefrontItem) {
  return getDefaultVariantFromList(getSelectableVariants(getVisibleVariants(product)));
}

function getVisibleVariants(product: StorefrontItem | null) {
  if (!product) return [];
  return product.variants.filter((variant) => {
    const hasRealLabel = getLabelValue(variant.color) || getLabelValue(variant.size);
    return Boolean(hasRealLabel) || variant.qtyAvailable > 0 || variant.variantImages.length > 0;
  });
}

function getSelectableVariants(variants: StorefrontVariant[]) {
  const inStockVariants = variants.filter((variant) => isVariantSelectable(variant));
  return inStockVariants.length > 0 ? inStockVariants : variants;
}

function isVariantSelectable(variant: StorefrontVariant) {
  return variant.qtyAvailable > 0 || variant.status === "IN_STOCK";
}

function getGalleryImages(product: StorefrontItem | null, selectedVariant: StorefrontVariant | null) {
  if (!product) return [];

  const sourceImages = [...(selectedVariant?.variantImages ?? []), ...product.itemImages];
  const seen = new Set<string>();

  return sourceImages.filter((image) => {
    const url = image.url?.trim();
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function getLabelValue(value?: string) {
  if (!value || value === "Unspecified") return "";
  return value.trim();
}

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function resolveVariant(variants: StorefrontVariant[], color: string, size: string) {
  return variants.find((variant) => getLabelValue(variant.color) === color && getLabelValue(variant.size) === size) ?? null;
}

function findVariantByColor(variants: StorefrontVariant[], color: string) {
  return variants.find((variant) => getLabelValue(variant.color) === color) ?? null;
}

function findVariantBySize(variants: StorefrontVariant[], size: string) {
  return variants.find((variant) => getLabelValue(variant.size) === size) ?? null;
}

function getDefaultVariantFromList(variants: StorefrontVariant[]) {
  return variants[0] ?? null;
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
  },
  content: {
    paddingBottom: 108,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  errorTitle: {
    color: colors.dark,
    fontSize: 24,
    fontWeight: "800",
  },
  errorText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  galleryWrap: {
    backgroundColor: "#ffffff",
    paddingTop: 8,
    position: "relative",
  },
  heroImage: {
    backgroundColor: "#ffffff",
    height: 420,
  },
  zoomFrame: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    justifyContent: "center",
  },
  heroFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroFallbackTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "700",
  },
  galleryTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    left: 16,
    position: "absolute",
    right: 16,
    top: 16,
  },
  galleryBadge: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  galleryBadgeText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  galleryCounter: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  galleryCounterText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "700",
  },
  heroDots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 12,
  },
  heroDot: {
    backgroundColor: "#d1d5db",
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  heroDotActive: {
    backgroundColor: colors.accent,
    width: 22,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  name: {
    color: colors.dark,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  priceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  price: {
    color: colors.dark,
    fontSize: 24,
    fontWeight: "800",
  },
  stockLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  stockLabelMuted: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  categoryText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  optionSection: {
    marginTop: 22,
  },
  optionTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minWidth: 72,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "relative",
  },
  optionChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  optionChipUnavailable: {
    backgroundColor: "#f8f8f8",
    borderColor: "#d1d5db",
  },
  optionChipText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "600",
  },
  optionChipTextActive: {
    color: colors.accent,
  },
  optionChipTextUnavailable: {
    color: "#8f8f94",
  },
  optionChipSlash: {
    backgroundColor: "#9ca3af",
    height: 1.5,
    left: -10,
    position: "absolute",
    transform: [{ rotate: "-28deg" }],
    width: 110,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
  },
  whatsAppCard: {
    alignItems: "center",
    backgroundColor: "#f8efe4",
    borderColor: "#ecd7bf",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    padding: 14,
  },
  whatsAppIconShell: {
    alignItems: "center",
    backgroundColor: "#1f6a4a",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  whatsAppCopy: {
    flex: 1,
    gap: 2,
  },
  whatsAppCardTitle: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "700",
  },
  whatsAppCardText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  infoPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoValue: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  detailBlock: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 10,
    marginTop: 22,
    paddingTop: 18,
  },
  detailBlockTitle: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: "700",
  },
  detailBlockText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  relatedSection: {
    marginTop: 24,
  },
  relatedHeading: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  relatedRail: {
    gap: 12,
    paddingHorizontal: 16,
    paddingRight: 24,
  },
  relatedItem: {
    width: 172,
  },
  bottomBar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.98)",
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    bottom: 14,
    flexDirection: "row",
    gap: 8,
    left: 12,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: "absolute",
    right: 12,
  },
  bottomAction: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    gap: 4,
    justifyContent: "center",
    paddingVertical: 8,
  },
  bottomActionText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  bottomActionPrimary: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 16,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  bottomActionTextPrimary: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
});
