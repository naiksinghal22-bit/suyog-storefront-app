import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { formatUsd } from "@/src/lib/format";
import { buildProductHref } from "@/src/lib/storefront";
import { colors } from "@/src/lib/theme";
import type { StorefrontItem } from "@/src/types/storefront";

export function ProductGridCard({ item }: { item: StorefrontItem }) {
  const variants = Array.isArray(item.variants) ? item.variants : [];
  const images = Array.isArray(item.itemImages) ? item.itemImages : [];
  const title = typeof item.title === "string" && item.title.trim() ? item.title : "Untitled style";
  const category = typeof item.category === "string" && item.category.trim() ? item.category : "Collection";
  const variantCount = variants.filter((variant) => variant.qtyAvailable > 0 || (variant.variantImages?.length ?? 0) > 0).length;
  const badge = item.soldOut ? "Sold out" : item.newArrival ? "New in" : item.featured ? "Featured" : variantCount > 1 ? `${variantCount} options` : "Available";

  return (
    <Link href={buildProductHref(item.slug)} asChild>
      <Pressable style={styles.card}>
        <View style={styles.imageWrap}>
          {images[0]?.url ? <Image source={{ uri: images[0].url }} style={styles.image} resizeMode="cover" /> : <View style={styles.imageFallback} />}
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{badge}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.price}>{formatUsd(item.sellingPriceUsd)}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {category}
          </Text>
          {variantCount > 1 ? <Text style={styles.optionText}>{variantCount} selectable options</Text> : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    backgroundColor: "#eef0f3",
    height: 230,
    width: "100%",
  },
  imageFallback: {
    backgroundColor: colors.surfaceMuted,
    height: 230,
    width: "100%",
  },
  badgePill: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
  },
  badgePillText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  body: {
    gap: 4,
    padding: 12,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  price: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "400",
  },
  optionText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
  },
});
