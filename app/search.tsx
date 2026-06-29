import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/src/components/app-header";
import { MobileTabBar } from "@/src/components/mobile-tab-bar";
import { ProductGridCard } from "@/src/components/product-grid-card";
import { fetchMobileHome, searchMobileStorefront } from "@/src/lib/api";
import { addSizePreference } from "@/src/lib/push-admin";
import { resolveWebsiteHref } from "@/src/lib/storefront";
import { colors, spacing } from "@/src/lib/theme";
import type { MobileSearchResponse, StorefrontItem } from "@/src/types/storefront";

const SUGGESTED_QUERIES = ["Kurti", "Chikankari", "Festive", "Set", "Pink", "FS"];
const SIZE_SYNONYMS: Record<string, string[]> = {
  small: ["s", "small"],
  medium: ["m", "medium"],
  large: ["l", "large"],
  xl: ["xl", "extra large", "x-large"],
  xxl: ["xxl", "2xl", "extra extra large", "double xl"],
  fs: ["fs", "free size", "one size"],
};

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(typeof params.q === "string" ? params.q : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<MobileSearchResponse | null>(null);
  const [catalogItems, setCatalogItems] = useState<StorefrontItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const response = await fetchMobileHome();
        if (!active) return;
        setCatalogItems(response.storefrontItems);
      } catch {
        if (!active) return;
        setCatalogItems([]);
      }
    }

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ query: "", items: [], links: [] });
      setError("");
      setLoading(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await searchMobileStorefront(trimmed);
        if (!active) return;
        setResults(response);
        setError("");
      } catch (nextError) {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : "Search failed");
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const sizes = extractSizesFromQuery(query);
    if (sizes.length === 0) return;
    sizes.forEach((size) => {
      void addSizePreference(size);
    });
  }, [query]);

  const mergedItems = useMemo(() => {
    const apiItems = results?.items ?? [];
    const localItems = searchLocalCatalog(catalogItems, query);
    const seen = new Set<string>();

    return [...apiItems, ...localItems].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [catalogItems, query, results?.items]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        <AppHeader eyebrow="Suyog Fashions" title="Search styles" subtitle="Try a color, category, or size like small, XL, or free size." />
        <View style={styles.header}>
          <View style={styles.searchShell}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search styles, colors, sizes"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
          {!query.trim() ? (
            <View style={styles.suggestionWrap}>
              {SUGGESTED_QUERIES.map((entry) => (
                <Pressable key={entry} style={styles.suggestionChip} onPress={() => setQuery(entry)}>
                  <Text style={styles.suggestionText}>{entry}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : null}

          {!loading && !!error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Search did not load</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!loading && !error && !query.trim() ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Start with a style</Text>
            </View>
          ) : null}

          {!loading && !error && (results?.links.length ?? 0) > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Links</Text>
              <View style={styles.linkList}>
                {results?.links.map((link) => (
                  <Link key={`${link.kind}-${link.href}`} href={resolveWebsiteHref(link.href)} asChild>
                    <Pressable style={styles.linkCard}>
                      <Text style={styles.linkLabel}>{link.label}</Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.accent} />
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          ) : null}

          {!loading && !error && mergedItems.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Results</Text>
              <View style={styles.grid}>
                {mergedItems.map((item) => (
                  <View key={item.id} style={styles.gridItem}>
                    <ProductGridCard item={item} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
        <MobileTabBar />
      </View>
    </SafeAreaView>
  );
}

function searchLocalCatalog(items: StorefrontItem[], rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const matcherGroups = buildQueryMatcherGroups(query);

  return items.filter((item) => {
    const haystacks = [
      item.title,
      item.category,
      item.description,
      item.shortDescription,
      ...item.variants.flatMap((variant) => [variant.color, variant.size, variant.sku]),
    ]
      .filter(Boolean)
      .map((value) => `${value}`.toLowerCase());

    return matcherGroups.every((group) => group.some((term) => haystacks.some((entry) => entry.includes(term))));
  });
}

function buildQueryMatcherGroups(query: string) {
  return query.split(/\s+/).filter(Boolean).map((term) => {
    for (const [canonical, aliases] of Object.entries(SIZE_SYNONYMS)) {
      if (term === canonical || aliases.includes(term)) {
        return [canonical, ...aliases];
      }
    }

    return [term];
  });
}

function extractSizesFromQuery(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .flatMap((term) => {
      for (const [canonical, aliases] of Object.entries(SIZE_SYNONYMS)) {
        if (term === canonical || aliases.includes(term)) {
          return [canonical.toUpperCase()];
        }
      }

      return [];
    });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
  },
  header: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchShell: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  input: {
    color: colors.dark,
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  suggestionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  suggestionText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
    padding: 16,
    paddingBottom: 120,
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
  },
  linkList: {
    gap: 10,
  },
  linkCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  linkLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
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
    borderRadius: 16,
    padding: 18,
  },
  emptyTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "700",
  },
  errorCard: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 16,
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
});
