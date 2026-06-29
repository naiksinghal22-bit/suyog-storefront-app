import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/src/components/app-header";
import { MobileTabBar } from "@/src/components/mobile-tab-bar";
import { ProductGridCard } from "@/src/components/product-grid-card";
import { fetchMobileCollection, fetchMobileHome } from "@/src/lib/api";
import { addCollectionInterest, addSizePreference } from "@/src/lib/push-admin";
import { slugifyValue } from "@/src/lib/storefront";
import { colors, spacing } from "@/src/lib/theme";
import type { MobileCollectionResponse } from "@/src/types/storefront";

type BrowseKind = "collection" | "category";

export default function BrowseScreen() {
  const params = useLocalSearchParams<{ slug: string; kind?: BrowseKind; title?: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<MobileCollectionResponse | null>(null);
  const [selectedSize, setSelectedSize] = useState("All");

  const slug = typeof params.slug === "string" ? params.slug : "";
  const kind: BrowseKind = params.kind === "category" ? "category" : "collection";

  async function load(mode: "initial" | "refresh" = "initial") {
    if (!slug) {
      setLoading(false);
      setRefreshing(false);
      setError("Missing browse slug");
      return;
    }

    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);

    try {
      if (kind === "category") {
        const home = await fetchMobileHome();
        const items = home.storefrontItems.filter((item) => slugifyValue(item.category) === slugifyValue(slug));
        setData({ collection: null, items });
      } else {
        const response = await fetchMobileCollection(slug);
        setData(response);
      }
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load browse results");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [kind, slug]);

  useEffect(() => {
    setSelectedSize("All");
  }, [slug, kind]);

  useEffect(() => {
    if (!slug) return;
    void addCollectionInterest(slug);
  }, [slug]);

  useEffect(() => {
    if (!selectedSize || selectedSize === "All") return;
    void addSizePreference(selectedSize);
  }, [selectedSize]);

  const screenTitle = useMemo(() => {
    if (typeof params.title === "string" && params.title.trim()) return params.title;
    if (data?.collection?.name) return data.collection.name;
    return slug.replace(/-/g, " ");
  }, [data?.collection?.name, params.title, slug]);

  const heroImage = data?.collection?.imageUrl || data?.items[0]?.itemImages[0]?.url || "";
  const sizeOptions = useMemo(() => {
    const sizes = new Set<string>();
    (data?.items ?? []).forEach((item) => {
      item.variants.forEach((variant) => {
        const value = variant.size?.trim();
        if (value && value !== "Unspecified") sizes.add(value);
      });
    });

    return ["All", ...Array.from(sizes)];
  }, [data?.items]);

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    if (selectedSize === "All") return items;

    return items.filter((item) =>
      item.variants.some((variant) => {
        const size = variant.size?.trim();
        return size === selectedSize && (variant.qtyAvailable > 0 || variant.status === "IN_STOCK");
      }),
    );
  }, [data?.items, selectedSize]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        <AppHeader eyebrow="Suyog Fashions" title={screenTitle} subtitle={data?.items.length ? `${data.items.length} styles ready to browse` : "Collection details"} />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} tintColor={colors.accent} />}
        >
          <View style={styles.heroCard}>
            {heroImage ? <Image source={{ uri: heroImage }} resizeMode="cover" style={styles.heroImage} /> : <View style={styles.heroFallback} />}
            <View style={styles.heroOverlay}>
              <Text style={styles.heroEyebrow}>Suyog Fashions</Text>
              <Text style={styles.heroTitle}>{screenTitle}</Text>
              <Text style={styles.heroMeta}>{data?.items.length === 1 ? "1 style" : `${data?.items.length ?? 0} styles`}</Text>
            </View>
          </View>

          {sizeOptions.length > 1 ? (
            <View style={styles.filterSection}>
              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>Browse by size</Text>
                <Text style={styles.filterMeta}>{selectedSize === "All" ? "All styles" : selectedSize}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>
                {sizeOptions.map((size) => {
                  const active = size === selectedSize;
                  return (
                    <Pressable key={size} style={[styles.filterChip, active ? styles.filterChipActive : null]} onPress={() => setSelectedSize(size)}>
                      <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{size}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingText}>Loading styles...</Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>This section did not load</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!loading && !error ? (
            filteredItems.length > 0 ? (
              <View style={styles.grid}>
                {filteredItems.map((item) => (
                  <View key={item.id} style={styles.gridItem}>
                    <ProductGridCard item={item} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No styles available</Text>
              </View>
            )
          ) : null}
        </ScrollView>

        <MobileTabBar />
      </View>
    </SafeAreaView>
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
    gap: spacing.md,
    padding: 16,
    paddingBottom: 120,
    paddingTop: 14,
  },
  heroCard: {
    borderRadius: 22,
    height: 220,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    height: "100%",
    width: "100%",
  },
  heroFallback: {
    backgroundColor: colors.surfaceMuted,
    height: "100%",
    width: "100%",
  },
  heroOverlay: {
    backgroundColor: "rgba(17,17,17,0.14)",
    bottom: 0,
    left: 0,
    padding: 18,
    position: "absolute",
    right: 0,
  },
  heroEyebrow: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 6,
  },
  heroMeta: {
    color: "#ffffff",
    fontSize: 13,
    marginTop: 4,
  },
  filterSection: {
    gap: 10,
  },
  filterHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "700",
  },
  filterMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  filterRail: {
    gap: 10,
    paddingRight: 10,
  },
  filterChip: {
    backgroundColor: "#ffffff",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  loadingCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  errorTitle: {
    color: "#9f1239",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: "#be123c",
    fontSize: 13,
    lineHeight: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "47.7%",
  },
  emptyCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    padding: 18,
  },
  emptyTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "700",
  },
});
