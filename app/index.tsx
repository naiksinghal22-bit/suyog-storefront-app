import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { featuredProducts, newArrivals } from "@/src/data/mock-products";
import { colors, spacing } from "@/src/lib/theme";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Suyog Fashions App</Text>
          <Text style={styles.title}>iPhone-first storefront, still shared across iOS and Android.</Text>
          <Text style={styles.subtitle}>
            This app is focused on discovery: new arrivals, featured collections, and quick WhatsApp handoff.
          </Text>
        </View>

        <SectionTitle title="New Arrivals" actionLabel="See all" />
        {newArrivals.map((product) => (
          <Link key={product.slug} href={`/product/${product.slug}`} asChild>
            <View style={styles.card}>
              <Text style={styles.cardBadge}>New</Text>
              <Text style={styles.cardTitle}>{product.name}</Text>
              <Text style={styles.cardMeta}>{product.collection}</Text>
              <Text style={styles.cardPrice}>{product.priceLabel}</Text>
            </View>
          </Link>
        ))}

        <SectionTitle title="Featured Picks" actionLabel="Curated" />
        {featuredProducts.map((product) => (
          <Link key={product.slug} href={`/product/${product.slug}`} asChild>
            <View style={styles.cardAlt}>
              <Text style={styles.cardTitle}>{product.name}</Text>
              <Text style={styles.cardMeta}>{product.collection}</Text>
            </View>
          </Link>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title, actionLabel }: { title: string; actionLabel: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction}>{actionLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  sectionAction: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  cardAlt: {
    backgroundColor: "#efe6da",
    borderRadius: 24,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  cardBadge: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  cardMeta: {
    color: colors.muted,
    fontSize: 14,
  },
  cardPrice: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
});
