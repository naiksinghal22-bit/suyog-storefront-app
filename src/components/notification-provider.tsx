import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import * as Notifications from "expo-notifications";

import { getNotificationPermissionsAsync, openNotificationSettingsAsync } from "@/src/lib/notifications";
import { enableAndSyncPushNotifications, syncPushRegistrationIfPossible } from "@/src/lib/push-admin";

const STORAGE_KEY = "notifications.softPromptState";
const FIRST_PROMPT_DELAY_MS = 1200;
const RETRY_AFTER_SOFT_DISMISS_SESSIONS = 3;
const RETRY_AFTER_DENIED_SESSIONS = 5;

type PromptState = {
  sessionCount: number;
  lastPromptSession: number;
  lastOutcome: "soft_dismissed" | "system_denied" | "granted" | "never";
};

const EMPTY_STATE: PromptState = {
  sessionCount: 0,
  lastPromptSession: 0,
  lastOutcome: "never",
};

type PromptMode = "enable" | "settings";

export function NotificationProvider({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<PromptMode>("enable");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void maybeShowPrompt();
    }, FIRST_PROMPT_DELAY_MS);

    async function maybeShowPrompt() {
      const nextState = await incrementSessionCount();
      const permissionStatus = await getNotificationPermissionsAsync();

      if (cancelled) return;

      if (permissionStatus === Notifications.PermissionStatus.GRANTED) {
        void syncPushRegistrationIfPossible().catch(() => {});
        await savePromptState({
          ...nextState,
          lastOutcome: "granted",
        });
        return;
      }

      if (!shouldShowPrompt(nextState, permissionStatus)) return;

      setMode(permissionStatus === Notifications.PermissionStatus.DENIED ? "settings" : "enable");
      setMessage("");
      setVisible(true);
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const promptCopy = useMemo(() => {
    if (mode === "settings") {
      return {
        title: "Turn on collection alerts",
        body: "Notifications are currently off. Open Settings to hear about fresh arrivals, festive launches, and restocks the moment they go live.",
        primaryLabel: "Open Settings",
        accent: "Never miss what is new",
      };
    }

    return {
      title: "Stay in the loop",
      body: "Get a quick heads-up when new collections, festive styles, and restocks arrive so you can check them first.",
      primaryLabel: busy ? "Working..." : "Enable notifications",
      accent: "New arrivals. Restocks. Festive drops.",
    };
  }, [busy, mode]);

  async function handlePrimary() {
    if (mode === "settings") {
      await recordPromptOutcome("system_denied");
      setVisible(false);
      await openNotificationSettingsAsync();
      return;
    }

    setBusy(true);
    try {
      const result = await enableAndSyncPushNotifications();
      if (result.permissionStatus === Notifications.PermissionStatus.GRANTED) {
        await recordPromptOutcome("granted");
        setVisible(false);
        setMessage("");
        return;
      }

      await recordPromptOutcome("system_denied");
      setMode("settings");
      setMessage(result.error || "Notifications were not enabled. You can turn them on later in Settings.");
    } catch {
      setMessage("Notifications could not be enabled right now.");
    } finally {
      setBusy(false);
    }
  }

  async function handleNotNow() {
    await recordPromptOutcome(mode === "settings" ? "system_denied" : "soft_dismissed");
    setVisible(false);
    setMessage("");
  }

  return (
    <>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => void handleNotNow()}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.medallionWrap}>
              <View style={styles.medallion}>
                <Ionicons name="notifications-outline" size={34} color="#f7e6b0" />
              </View>
            </View>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerFlourish}>~</Text>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.eyebrow}>Suyog Fashions</Text>
            <Text style={styles.accentLine}>{promptCopy.accent}</Text>
            <Text style={styles.title}>{promptCopy.title}</Text>
            <View style={styles.ornamentRow}>
              <View style={styles.ornamentLine} />
              <Text style={styles.ornamentGlyph}>*</Text>
              <View style={styles.ornamentLine} />
            </View>
            <Text style={styles.body}>{promptCopy.body}</Text>
            {message ? <Text style={styles.notice}>{message}</Text> : null}
            <Pressable style={[styles.primaryButton, busy ? styles.primaryButtonDisabled : null]} onPress={() => void handlePrimary()} disabled={busy}>
              <Text style={styles.primaryButtonText}>{promptCopy.primaryLabel}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => void handleNotNow()} disabled={busy}>
              <Text style={styles.secondaryButtonText}>Not now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

async function incrementSessionCount() {
  const state = await getPromptState();
  const nextState = {
    ...state,
    sessionCount: state.sessionCount + 1,
  };
  await savePromptState(nextState);
  return nextState;
}

async function recordPromptOutcome(outcome: PromptState["lastOutcome"]) {
  const state = await getPromptState();
  const nextState = {
    ...state,
    lastOutcome: outcome,
    lastPromptSession: state.sessionCount,
  };
  await savePromptState(nextState);
}

async function getPromptState(): Promise<PromptState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<PromptState>;
    return {
      sessionCount: parsed.sessionCount ?? 0,
      lastPromptSession: parsed.lastPromptSession ?? 0,
      lastOutcome: parsed.lastOutcome ?? "never",
    };
  } catch {
    return EMPTY_STATE;
  }
}

async function savePromptState(state: PromptState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function shouldShowPrompt(state: PromptState, permissionStatus: Notifications.PermissionStatus) {
  if (permissionStatus === Notifications.PermissionStatus.DENIED) {
    return state.sessionCount - state.lastPromptSession >= RETRY_AFTER_DENIED_SESSIONS;
  }

  if (state.lastOutcome === "never") return true;

  return state.sessionCount - state.lastPromptSession >= RETRY_AFTER_SOFT_DISMISS_SESSIONS;
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(17,17,17,0.46)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fffaf4",
    borderColor: "#e7d0aa",
    borderRadius: 34,
    borderWidth: 1,
    elevation: 18,
    maxWidth: 420,
    paddingBottom: 26,
    paddingHorizontal: 26,
    paddingTop: 54,
    position: "relative",
    shadowColor: "#6e4d2f",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    width: "100%",
  },
  medallionWrap: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: -42,
    zIndex: 4,
  },
  medallion: {
    alignItems: "center",
    backgroundColor: "#2f7c7a",
    borderColor: "#f1cb7e",
    borderRadius: 999,
    borderWidth: 4,
    height: 86,
    justifyContent: "center",
    shadowColor: "#8c6033",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    width: 86,
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 14,
  },
  dividerLine: {
    backgroundColor: "#ead5ac",
    flex: 1,
    height: 1,
    maxWidth: 140,
  },
  dividerFlourish: {
    color: "#ddb772",
    fontSize: 28,
    lineHeight: 28,
    marginHorizontal: 12,
    marginTop: -8,
  },
  eyebrow: {
    color: "#2f7c7a",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 4.4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  accentLine: {
    color: "#9a6a43",
    fontSize: 15,
    fontStyle: "italic",
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  title: {
    color: "#184f5b",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.8,
    lineHeight: 42,
    marginTop: 12,
    textAlign: "center",
  },
  ornamentRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  ornamentLine: {
    backgroundColor: "#ecd7b2",
    flex: 1,
    height: 1,
    maxWidth: 116,
  },
  ornamentGlyph: {
    color: "#d5af69",
    fontSize: 18,
    marginHorizontal: 14,
  },
  body: {
    color: "#4e4c4a",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 22,
    paddingHorizontal: 12,
    textAlign: "center",
  },
  notice: {
    color: "#9a3412",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2f7c7a",
    borderColor: "#f1cb7e",
    borderRadius: 24,
    borderWidth: 2,
    elevation: 10,
    justifyContent: "center",
    marginTop: 28,
    minHeight: 58,
    paddingHorizontal: 16,
    shadowColor: "#2f7c7a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.15,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    minHeight: 44,
  },
  secondaryButtonText: {
    color: "#2f7c7a",
    fontSize: 16,
    fontWeight: "700",
  },
});
