import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/src/components/app-header";
import { MobileTabBar } from "@/src/components/mobile-tab-bar";
import { fetchMobileUpdates } from "@/src/lib/api";
import { getNotificationPermissionsAsync, openNotificationSettingsAsync } from "@/src/lib/notifications";
import { enableAndSyncPushNotifications } from "@/src/lib/push-admin";
import { filterVisibleUpdates, getUpdatesState, hideUpdate, isUpdateRead, markUpdateRead, UPDATES_CONFIG } from "@/src/lib/updates";
import { colors, spacing } from "@/src/lib/theme";
import type { MobileUpdateItem } from "@/src/types/storefront";

export default function UpdatesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<MobileUpdateItem[]>([]);
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [permissionStatus, setPermissionStatus] = useState("undetermined");
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const loadUpdates = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);

    try {
      const [response, state, nextPermissionStatus] = await Promise.all([
        fetchMobileUpdates(UPDATES_CONFIG.fetchLimit),
        getUpdatesState(),
        getNotificationPermissionsAsync(),
      ]);
      const visibleItems = filterVisibleUpdates(response.items, state);
      const nextReadIds = Object.fromEntries(visibleItems.map((item) => [item.id, isUpdateRead(item.id, state)]));
      setItems(visibleItems);
      setReadIds(nextReadIds);
      setPermissionStatus(nextPermissionStatus);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not load updates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadUpdates();
  }, [loadUpdates]);

  const groupedItems = useMemo(() => items, [items]);

  async function handleOpen(item: MobileUpdateItem) {
    setReadIds((current) => ({
      ...current,
      [item.id]: true,
    }));
    await markUpdateRead(item.id);
    router.push(item.targetUrl as Href);
  }

  async function handleHide(item: MobileUpdateItem) {
    await hideUpdate(item.id);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  async function handleEnableNotifications() {
    setNotificationBusy(true);
    try {
      const result = await enableAndSyncPushNotifications();
      setPermissionStatus(result.permissionStatus);
      setNotificationMessage(result.error || result.warning || "");
    } catch {
      setPermissionStatus(await getNotificationPermissionsAsync());
      setNotificationMessage("Notifications could not be fully enabled in this build.");
    } finally {
      setNotificationBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        <AppHeader
          title="Updates"
          showBack
          compact
          rightSlot={
            <Link href={"/about" as Href} asChild>
              <Pressable style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
              </Pressable>
            </Link>
          }
        />
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadUpdates("refresh")} tintColor={colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Stay in the loop</Text>
            <Text style={styles.heroText}>Your recent arrivals, restocks, and storefront updates appear here for 60 days unless you hide them.</Text>
            {permissionStatus !== "granted" ? (
              <View style={styles.notificationCard}>
                <View style={styles.notificationCopy}>
                  <Text style={styles.notificationTitle}>Turn on notifications</Text>
                  <Text style={styles.notificationText}>Allow this device to receive notifications and prepare the app for a secure push rollout.</Text>
                </View>
                <View style={styles.notificationActions}>
                  <Pressable style={styles.enableButton} onPress={() => void handleEnableNotifications()} disabled={notificationBusy}>
                    <Text style={styles.enableButtonText}>{notificationBusy ? "Working..." : "Enable"}</Text>
                  </Pressable>
                  <Pressable style={styles.settingsButton} onPress={() => void openNotificationSettingsAsync()}>
                    <Text style={styles.settingsButtonText}>Settings</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            {notificationMessage ? (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeText}>{notificationMessage}</Text>
              </View>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>Loading updates...</Text>
            </View>
          ) : null}

          {!loading && !!error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Updates did not load</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!loading && !error && groupedItems.length === 0 ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>No recent updates</Text>
              <Text style={styles.infoText}>New storefront messages, collection drops, and restocks will show up here.</Text>
            </View>
          ) : null}

          {!loading && !error && groupedItems.length > 0 ? (
            <View style={styles.list}>
              {groupedItems.map((item) => {
                const read = !!readIds[item.id];
                return (
                  <Pressable key={item.id} style={[styles.updateCard, read ? styles.updateCardRead : null]} onPress={() => void handleOpen(item)}>
                    <View style={styles.updateHeader}>
                      <View style={styles.badgeRow}>
                        {item.category ? <Text style={styles.categoryBadge}>{item.category}</Text> : null}
                        {!read ? <View style={styles.unreadDot} /> : null}
                      </View>
                      <Pressable hitSlop={8} onPress={() => void handleHide(item)}>
                        <Ionicons name="close-outline" size={18} color={colors.muted} />
                      </Pressable>
                    </View>
                    <Text style={styles.updateTitle}>{item.title}</Text>
                    <Text style={styles.updateBody}>{item.body}</Text>
                    <View style={styles.updateFooter}>
                      <Text style={styles.updateDate}>{formatUpdateDate(item.createdAt)}</Text>
                      <View style={styles.openRow}>
                        <Text style={styles.openText}>Open</Text>
                        <Ionicons name="arrow-forward" size={14} color={colors.accent} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
        <MobileTabBar />
      </View>
    </SafeAreaView>
  );
}

function formatUpdateDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  page: {
    flex: 1,
  },
  infoButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  content: {
    gap: spacing.md,
    padding: 16,
    paddingBottom: 120,
    paddingTop: 14,
  },
  heroCard: {
    backgroundColor: "#fbf6f0",
    borderColor: "#efe0cf",
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
  notificationCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderColor: "#eadfce",
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    marginTop: 8,
    padding: 14,
  },
  notificationCopy: {
    gap: 4,
  },
  notificationTitle: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "700",
  },
  notificationText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  notificationActions: {
    flexDirection: "row",
    gap: 10,
  },
  noticeCard: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  noticeText: {
    color: "#9a3412",
    fontSize: 12,
    lineHeight: 18,
  },
  enableButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
  },
  enableButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  settingsButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
  },
  settingsButtonText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  infoTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "700",
  },
  infoText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
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
  list: {
    gap: 12,
  },
  updateCard: {
    backgroundColor: colors.surface,
    borderColor: "#eadfce",
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  updateCardRead: {
    opacity: 0.72,
  },
  updateHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badgeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  categoryBadge: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  unreadDot: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  updateTitle: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: "800",
  },
  updateBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  updateFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  updateDate: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  openRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  openText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
});
