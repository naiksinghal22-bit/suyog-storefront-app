import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter, type Href } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { buildBrowseHref, buildSearchHref, buildWhatsAppUrl } from "@/src/lib/storefront";
import { colors } from "@/src/lib/theme";

type IoniconName = string;

type NavItem = {
  key: string;
  label: string;
  icon: IoniconName;
  iconActive: IoniconName;
  active: boolean;
  onPress: () => void;
};

export function MobileTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      key: "home",
      label: "Home",
      icon: "home-outline",
      iconActive: "home",
      active: pathname === "/",
      onPress: () => router.push("/"),
    },
    {
      key: "search",
      label: "Search",
      icon: "search-outline",
      iconActive: "search",
      active: pathname === "/search",
      onPress: () => router.push(buildSearchHref()),
    },
    {
      key: "browse",
      label: "Browse",
      icon: "grid-outline",
      iconActive: "grid",
      active: pathname.startsWith("/browse"),
      onPress: () => router.push(buildBrowseHref("new-arrivals", "collection", "New Arrivals")),
    },
    {
      key: "chat",
      label: "Alerts",
      icon: "notifications-outline",
      iconActive: "notifications",
      active: pathname === "/updates",
      onPress: () => router.push("/updates" as Href),
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: "logo-whatsapp",
      iconActive: "logo-whatsapp",
      active: false,
      onPress: () => {
        void Linking.openURL(buildWhatsAppUrl("Hi, I need help from Suyog Fashions."));
      },
    },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {items.map((item) => (
          <Pressable key={item.key} onPress={item.onPress} style={[styles.item, item.active ? styles.itemActive : null]}>
            <Ionicons
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              name={(item.active ? item.iconActive : item.icon) as any}
              size={22}
              color={item.active ? colors.accent : "#9aa0a6"}
            />
            <Text style={[styles.label, item.active ? styles.labelActive : null]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    bottom: 10,
    left: 12,
    position: "absolute",
    right: 12,
  },
  bar: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: "#e7ebe9",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 14,
    paddingHorizontal: 8,
    paddingTop: 12,
    shadowColor: "#111111",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  item: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    gap: 5,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  itemActive: {
    backgroundColor: colors.accentSoft,
  },
  label: {
    color: "#9aa0a6",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: "700",
  },
});
