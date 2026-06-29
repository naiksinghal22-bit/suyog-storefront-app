import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/lib/theme";

const BRAND_LOGO = require("../../assets/icon.png");

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightSlot?: ReactNode;
  compact?: boolean;
};

export function AppHeader({ eyebrow, title, subtitle, showBack = true, rightSlot, compact = false }: AppHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }

  return (
    <View style={[styles.shell, compact ? styles.shellCompact : null]}>
      {!compact ? <View style={styles.glowOne} /> : null}
      {!compact ? <View style={styles.glowTwo} /> : null}
      <View style={styles.row}>
        {showBack ? (
          <Pressable style={[styles.backButton, compact ? styles.backButtonCompact : null]} onPress={handleBack}>
            <Ionicons name="chevron-back" size={20} color={colors.dark} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <View style={styles.brandBlock}>
          <View style={[styles.logoShell, compact ? styles.logoShellCompact : null]}>
            <Image source={BRAND_LOGO} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.copy}>
            {!compact && eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={[styles.title, compact ? styles.titleCompact : null]} numberOfLines={1}>
              {title}
            </Text>
            {!compact && subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightSlot}>{rightSlot}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: "#f8fbfb",
    borderColor: "#e0eceb",
    borderRadius: 28,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
    overflow: "hidden",
    padding: 14,
    position: "relative",
  },
  shellCompact: {
    backgroundColor: "#ffffff",
    borderColor: colors.border,
    borderRadius: 18,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  glowOne: {
    backgroundColor: "#daf4f1",
    borderRadius: 999,
    height: 84,
    position: "absolute",
    right: -14,
    top: -18,
    width: 84,
  },
  glowTwo: {
    backgroundColor: "#f4ebe2",
    borderRadius: 999,
    bottom: -24,
    height: 92,
    left: -18,
    position: "absolute",
    width: 92,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: "#e7ebee",
    borderRadius: 18,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  backButtonCompact: {
    borderRadius: 14,
    height: 38,
    width: 38,
  },
  backSpacer: {
    width: 42,
  },
  brandBlock: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  logoShell: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    height: 50,
    justifyContent: "center",
    overflow: "hidden",
    width: 50,
  },
  logoShellCompact: {
    borderRadius: 14,
    height: 38,
    width: 38,
  },
  logo: {
    height: 38,
    width: 38,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  title: {
    color: colors.dark,
    fontSize: 19,
    fontWeight: "800",
  },
  titleCompact: {
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "500",
  },
  rightSlot: {
    minWidth: 42,
  },
});
