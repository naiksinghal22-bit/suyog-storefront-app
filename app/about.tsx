import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/src/components/app-header";
import { buildWhatsAppUrl, getPrivacyPolicyUrl, getSupportEmail, getSupportUrl, getWebsiteBaseUrl } from "@/src/lib/storefront";
import { colors, spacing } from "@/src/lib/theme";

const WHATSAPP_SUPPORT_URL = buildWhatsAppUrl("Hi, I need help with the Suyog Fashions app.");
const WHATSAPP_VISIT_URL = buildWhatsAppUrl("Hi, I would like to plan a visit to your store in Plano, Texas.");

export default function AboutScreen() {
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const iosBuildNumber = Constants.expoConfig?.ios?.buildNumber ?? "1";

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        <AppHeader title="About" subtitle="Privacy, support, and app information" showBack compact />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Suyog Fashions</Text>
            <Text style={styles.heroText}>A simple, iPhone-friendly storefront for browsing new arrivals, getting styling help, and planning a showroom visit in Plano, Texas.</Text>
            <Text style={styles.heroMeta}>Plano, Texas by appointment</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <ActionCard
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              subtitle="Review how app and storefront data are handled."
              onPress={() => void Linking.openURL(getPrivacyPolicyUrl())}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <ActionCard
              icon="logo-whatsapp"
              title="WhatsApp Support"
              subtitle="Chat directly for sizing, styling, or order help."
              onPress={() => void Linking.openURL(WHATSAPP_SUPPORT_URL)}
            />
            <ActionCard
              icon="mail-outline"
              title="Email Support"
              subtitle={getSupportEmail()}
              onPress={() => void Linking.openURL(`mailto:${getSupportEmail()}`)}
            />
            <ActionCard
              icon="globe-outline"
              title="Website Support"
              subtitle={getSupportUrl()}
              onPress={() => void Linking.openURL(getSupportUrl())}
            />
            <ActionCard
              icon="storefront-outline"
              title="Plan a Store Visit"
              subtitle="Want to visit in Plano, Texas? WhatsApp us and we will help plan your visit."
              onPress={() => void Linking.openURL(WHATSAPP_VISIT_URL)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Info</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Version" value={appVersion} />
              <InfoRow label="iOS Build" value={iosBuildNumber} />
              <InfoRow label="Website" value={getWebsiteBaseUrl()} />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={styles.actionIconShell}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
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
    gap: spacing.md,
    padding: 16,
    paddingBottom: 36,
    paddingTop: 14,
  },
  heroCard: {
    backgroundColor: "#f8f4ee",
    borderColor: "#eedfcd",
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  heroTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
  },
  heroText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  heroMeta: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: "800",
  },
  actionCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  actionIconShell: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  actionCopy: {
    flex: 1,
    gap: 3,
  },
  actionTitle: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "700",
  },
  actionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 12,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoValue: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "600",
  },
});
