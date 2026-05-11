import { Stack, useLocalSearchParams } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getProductBySlug } from "@/src/data/mock-products";
import { colors, spacing } from "@/src/lib/theme";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const product = getProductBySlug(slug);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>Product not found</Text>
          <Text style={styles.missingText}>We will wire this screen to your real catalog API next.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const whatsappUrl = `https://wa.me/13105551212?text=${encodeURIComponent(
    `Hi, I want to know more about ${product.name}.`
  )}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageLabel}>Hero image area</Text>
          <Text style={styles.imageHint}>Next step: load from media.suyogfashions.com</Text>
        </View>

        <View style={styles.summary}>
          <Text style={styles.collection}>{product.collection}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{product.priceLabel}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        <Pressable style={styles.whatsappButton} onPress={() => Linking.openURL(whatsappUrl)}>
          <Text style={styles.whatsappLabel}>Ask on WhatsApp</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  imagePlaceholder: {
    alignItems: "center",
    backgroundColor: "#eadfcc",
    borderRadius: 28,
    justifyContent: "center",
    minHeight: 360,
    padding: spacing.lg,
  },
  imageLabel: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  imageHint: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  summary: {
    gap: spacing.sm,
  },
  collection: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  name: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  price: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
  },
  whatsappButton: {
    alignItems: "center",
    backgroundColor: "#1d7f4e",
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  whatsappLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  missingState: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  missingTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  missingText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
