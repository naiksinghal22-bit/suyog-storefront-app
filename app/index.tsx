import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { Component, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StorefrontLoader } from "@/src/components/storefront-loader";
import { MobileTabBar } from "@/src/components/mobile-tab-bar";
import { ProductGridCard } from "@/src/components/product-grid-card";
import { fetchMobileCollection, fetchMobileHome } from "@/src/lib/api";
import { buildBrowseHref, buildCategoryTileHref, buildSearchHref, buildWhatsAppUrl, getPrivacyPolicyUrl } from "@/src/lib/storefront";
import { colors, spacing } from "@/src/lib/theme";
import type { MobileHomeResponse, StorefrontCategoryTile, StorefrontItem } from "@/src/types/storefront";

const BRAND_LOGO = require("../assets/icon.png");
const HOME_HERO = require("../assets/home-hero.png");
type SizeCollectionCard = {
  size: string;
  title: string;
  slug: string;
  imageUrl?: string;
};

const EMPTY_HOME: MobileHomeResponse = {
  storefrontItems: [],
  newArrivalItems: [],
  featuredItems: [],
  catalogCollections: [],
  heroSlides: [],
  collectionButtons: [],
  sizeCollectionSlots: [],
  heroAutoRotate: false,
  heroAutoRotateSeconds: 0,
  navItems: [],
};

export default function HomeScreen() {
  const [home, setHome] = useState<MobileHomeResponse>(EMPTY_HOME);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sizeCollections, setSizeCollections] = useState<SizeCollectionCard[]>([]);

  const loadHome = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetchMobileHome();
      setHome(response);
      const sizeCards = await loadSizeCollectionCards(response);
      setSizeCollections(sizeCards);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not load storefront");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  const storefrontItems = sanitizeItems(home.storefrontItems);
  const collectionButtons = sanitizeCollectionTiles(home.collectionButtons);
  const featuredItems = sanitizeItems(home.featuredItems);
  const newArrivalItems = sanitizeItems(home.newArrivalItems);

  const quickCollections = useMemo(() => {
    if (collectionButtons.length > 0) return collectionButtons.slice(0, 10);

    const seen = new Set<string>();
    return storefrontItems
      .filter((item) => Array.isArray(item.itemImages) && item.itemImages[0]?.url)
      .filter((item) => {
        const key = (item.category || "").trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8)
      .map((item) => ({
        id: `fallback-category-${item.id}`,
        name: item.category,
        slug: item.category,
        imageUrl: item.itemImages[0]?.url,
        imageFit: "cover" as const,
      }));
  }, [collectionButtons, storefrontItems]);

  const featured = (featuredItems.length > 0 ? featuredItems : storefrontItems.filter((item) => item.featured)).slice(0, 8);
  const newArrivals = (newArrivalItems.length > 0 ? newArrivalItems : storefrontItems.filter((item) => item.newArrival)).slice(0, 8);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHome("refresh")} tintColor={colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <View style={styles.brandWrap}>
              <View style={styles.brandLogoShell}>
                <Image source={BRAND_LOGO} style={styles.brandLogo} resizeMode="contain" />
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.brandEyebrow}>Curated Indian wear</Text>
                <Text style={styles.brand}>Suyog Fashions</Text>
              </View>
            </View>
            <View style={styles.topBarActions}>
              <Link href={buildSearchHref()} asChild>
                <Pressable style={styles.iconButton}>
                  <Ionicons name="search" size={21} color={colors.accent} />
                </Pressable>
              </Link>
              <Pressable style={styles.iconButton} onPress={() => Linking.openURL(buildWhatsAppUrl("Hi, I want help finding a look from Suyog Fashions."))}>
                <Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.accent} />
              </Pressable>
            </View>
          </View>

          <Link href={buildSearchHref()} asChild>
            <Pressable style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <Text style={styles.searchPlaceholder}>Search styles, colors, sizes</Text>
            </Pressable>
          </Link>

          {loading ? (
            <StorefrontLoader />
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Could not load storefront</Text>
              <Text style={styles.errorCopy}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => loadHome()}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {!loading && !error ? (
            <>
              <Link href={buildSearchHref()} asChild>
                <Pressable style={styles.heroImageCard}>
                  <Image source={HOME_HERO} style={styles.heroPromoImage} resizeMode="cover" />
                </Pressable>
              </Link>

              <SectionBoundary label="new-arrivals">
                {newArrivals.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeading title="New Arrivals" actionLabel="View all" actionHref={buildBrowseHref("new-arrivals", "collection", "New Arrivals")} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRail}>
                      {newArrivals.map((item) => (
                        <View key={item.id} style={styles.productRailItem}>
                          <ProductGridCard item={item} />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </SectionBoundary>

              <SectionBoundary label="collections">
                {quickCollections.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeading title="Collections" />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionRail}>
                      {quickCollections.map((tile) => (
                        <CollectionCard key={tile.id} tile={tile} />
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </SectionBoundary>

              <SectionBoundary label="sizes">
                {sizeCollections.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeading title="Shop by Size" />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeRail}>
                      {sizeCollections.map((entry) => (
                        <Link key={`${entry.size}-${entry.slug}`} href={buildBrowseHref(entry.slug, "collection", entry.title)} asChild>
                          <Pressable style={styles.sizeCard}>
                            {entry.imageUrl ? <Image source={{ uri: entry.imageUrl }} style={styles.sizeCardImage} resizeMode="cover" /> : <View style={styles.sizeCardFallback} />}
                            <View style={styles.sizeCardOverlay}>
                              <Text style={styles.sizeCardLabel}>{entry.size}</Text>
                              <Text style={styles.sizeCardTitle} numberOfLines={1}>
                                {entry.title}
                              </Text>
                            </View>
                          </Pressable>
                        </Link>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </SectionBoundary>

              <SectionBoundary label="featured">
                {featured.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeading title="Featured" actionLabel="Browse" actionHref={buildBrowseHref("featured", "collection", "Featured")} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRail}>
                      {featured.map((item) => (
                        <View key={item.id} style={styles.productRailItem}>
                          <ProductGridCard item={item} />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </SectionBoundary>

              <Pressable style={styles.ctaCard} onPress={() => Linking.openURL(buildWhatsAppUrl("Hi, I need help choosing an outfit from the app or planning a visit to your store in Plano, Texas."))}>
                <View>
                  <Text style={styles.ctaTitle}>Talk to us on WhatsApp</Text>
                  <Text style={styles.ctaText}>Style help or plan a visit to our Plano, Texas store.</Text>
                  <Text style={styles.ctaMeta}>Showroom visits are by appointment.</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </Pressable>

              <View style={styles.homeLinksCard}>
                <Link href="/about" asChild>
                  <Pressable style={styles.homeLinkButton}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                    <Text style={styles.homeLinkText}>About</Text>
                  </Pressable>
                </Link>
                <Pressable style={styles.homeLinkButton} onPress={() => Linking.openURL(getPrivacyPolicyUrl())}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
                  <Text style={styles.homeLinkText}>Privacy</Text>
                </Pressable>
              </View>

              {quickCollections.length === 0 && featured.length === 0 && newArrivals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>Storefront is connected</Text>
                  <Text style={styles.emptyStateText}>The home API returned no visible sections for this build. Pull to refresh after content is added.</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
        <MobileTabBar />
      </View>
    </SafeAreaView>
  );
}

function SectionHeading({ title, actionLabel, actionHref }: { title: string; actionLabel?: string; actionHref?: ReturnType<typeof buildBrowseHref> }) {
  return (
    <View style={styles.sectionHeadingRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && actionHref ? (
        <Link href={actionHref} asChild>
          <Pressable style={styles.sectionLink}>
            <Text style={styles.sectionLinkText}>{actionLabel}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.accent} />
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}

function CollectionCard({ tile }: { tile: StorefrontCategoryTile }) {
  return (
    <Link href={buildCategoryTileHref(tile)} asChild>
      <Pressable style={styles.collectionCard}>
        {tile.imageUrl ? <Image source={{ uri: tile.imageUrl }} style={styles.collectionImage} resizeMode={tile.imageFit === "contain" ? "contain" : "cover"} /> : <View style={styles.collectionFallback} />}
        <Text style={styles.collectionLabel} numberOfLines={1}>
          {tile.name}
        </Text>
      </Pressable>
    </Link>
  );
}

type SectionBoundaryProps = {
  children: ReactNode;
  label: string;
};

type SectionBoundaryState = {
  error: string | null;
};

class SectionBoundary extends Component<SectionBoundaryProps, SectionBoundaryState> {
  state: SectionBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): SectionBoundaryState {
    return {
      error: error instanceof Error ? error.message : "Unknown section error",
    };
  }

  componentDidUpdate(prevProps: SectionBoundaryProps) {
    if (prevProps.label !== this.props.label && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.debugCard}>
          <Text style={styles.debugTitle}>Section skipped: {this.props.label}</Text>
          <Text style={styles.debugText}>{this.state.error}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function sanitizeItems(input: unknown): StorefrontItem[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is StorefrontItem => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<StorefrontItem>;
    return typeof candidate.id === "string" && typeof candidate.slug === "string" && typeof candidate.title === "string";
  });
}

function sanitizeCollectionTiles(input: unknown): StorefrontCategoryTile[] {
  if (!Array.isArray(input)) return [];
  return input.filter((tile): tile is StorefrontCategoryTile => {
    if (!tile || typeof tile !== "object") return false;
    const candidate = tile as Partial<StorefrontCategoryTile>;
    return typeof candidate.id === "string" && typeof candidate.name === "string" && typeof candidate.slug === "string";
  });
}

async function loadSizeCollectionCards(home: MobileHomeResponse) {
  const slots = Array.isArray(home.sizeCollectionSlots) ? home.sizeCollectionSlots.filter((slot) => slot.collectionSlug?.trim() && slot.size?.trim()) : [];
  if (slots.length === 0) return [];

  const uniqueSlots = slots.filter((slot, index) => slots.findIndex((candidate) => candidate.collectionSlug === slot.collectionSlug) === index).slice(0, 8);
  const cards = await Promise.all(
    uniqueSlots.map(async (slot) => {
      try {
        const response = await fetchMobileCollection(slot.collectionSlug);
        const imageUrl = response.collection?.imageUrl || response.items[0]?.itemImages[0]?.url;
        return {
          size: slot.size,
          title: response.collection?.name || `${slot.size} Styles`,
          slug: slot.collectionSlug,
          imageUrl,
        } satisfies SizeCollectionCard;
      } catch {
        return {
          size: slot.size,
          title: `${slot.size} Styles`,
          slug: slot.collectionSlug,
        } satisfies SizeCollectionCard;
      }
    }),
  );

  return cards;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 20,
    paddingBottom: 116,
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brandWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  brandLogoShell: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: 20,
    height: 44,
    justifyContent: "center",
    overflow: "hidden",
    width: 44,
  },
  brandLogo: {
    height: 34,
    width: 34,
  },
  brandCopy: {
    gap: 1,
  },
  brandEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  brand: {
    color: colors.dark,
    fontSize: 22,
    fontWeight: "800",
  },
  topBarActions: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  searchPlaceholder: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500",
  },
  errorCard: {
    backgroundColor: "#fff5f5",
    borderColor: "#fecaca",
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  errorTitle: {
    color: "#991b1b",
    fontSize: 17,
    fontWeight: "800",
  },
  errorCopy: {
    color: "#7f1d1d",
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#991b1b",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  section: {
    gap: 8,
  },
  sectionHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  sectionLinkText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  heroImageCard: {
    borderRadius: 28,
    height: 208,
    overflow: "hidden",
  },
  heroPromoImage: {
    height: "100%",
    width: "100%",
  },
  collectionRail: {
    gap: 10,
    paddingRight: 16,
  },
  sizeRail: {
    gap: 12,
    paddingRight: 16,
  },
  collectionCard: {
    width: 110,
  },
  sizeCard: {
    borderRadius: 22,
    height: 152,
    overflow: "hidden",
    width: 132,
  },
  sizeCardImage: {
    height: "100%",
    width: "100%",
  },
  sizeCardFallback: {
    backgroundColor: colors.surfaceMuted,
    height: "100%",
    width: "100%",
  },
  sizeCardOverlay: {
    backgroundColor: "rgba(17,17,17,0.18)",
    bottom: 0,
    left: 0,
    padding: 12,
    position: "absolute",
    right: 0,
  },
  sizeCardLabel: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  sizeCardTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  collectionImage: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    height: 136,
    width: 110,
  },
  collectionFallback: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    height: 136,
    width: 110,
  },
  collectionLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  productRail: {
    gap: 10,
    paddingRight: 16,
  },
  productRailItem: {
    width: 164,
  },
  ctaCard: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  homeLinksCard: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  homeLinkButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 14,
  },
  homeLinkText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "700",
  },
  ctaTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  ctaText: {
    color: "#ffffff",
    fontSize: 13,
    marginTop: 4,
  },
  ctaMeta: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
  },
  emptyState: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    gap: 8,
    padding: 18,
  },
  emptyStateTitle: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyStateText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  debugCard: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  debugTitle: {
    color: "#9a3412",
    fontSize: 14,
    fontWeight: "700",
  },
  debugText: {
    color: "#9a3412",
    fontSize: 12,
    lineHeight: 18,
  },
});
