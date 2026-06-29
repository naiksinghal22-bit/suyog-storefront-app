import { Linking } from "react-native";

import type { Href, Router } from "expo-router";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as ExpoLinking from "expo-linking";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationSetupResult = {
  error?: string;
  permissionStatus: Notifications.PermissionStatus;
  projectId: string;
  token?: string;
  warning?: string;
};

export function getNotificationProjectId() {
  return Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId ?? "";
}

export async function getNotificationPermissionsAsync() {
  const settings = await Notifications.getPermissionsAsync();
  return settings.status;
}

export async function registerForPushNotificationsAsync(): Promise<NotificationSetupResult> {
  const projectId = getNotificationProjectId();
  if (!projectId) {
    return {
      error: "Missing Expo project ID for notifications.",
      permissionStatus: Notifications.PermissionStatus.UNDETERMINED,
      projectId: "",
    };
  }

  if (!Device.isDevice) {
    return {
      error: "Push notifications need a physical device.",
      permissionStatus: Notifications.PermissionStatus.UNDETERMINED,
      projectId,
    };
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== Notifications.PermissionStatus.GRANTED) {
    const request = await Notifications.requestPermissionsAsync();
    status = request.status;
  }

  if (status !== Notifications.PermissionStatus.GRANTED) {
    return {
      error: "Notification permission was not granted.",
      permissionStatus: status,
      projectId,
    };
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  return {
    permissionStatus: status,
    projectId,
    token,
  };
}

export async function scheduleTestNotificationAsync() {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Suyog Fashions",
      body: "Notifications are ready. Tap to open New Arrivals.",
      data: {
        url: "/browse/new-arrivals?kind=collection&title=New%20Arrivals",
      },
    },
    trigger: null,
  });
}

export async function openNotificationSettingsAsync() {
  await Linking.openSettings();
}

export function getNavigationPathFromNotificationData(data: unknown) {
  if (!data || typeof data !== "object") return null;

  const payload = data as Record<string, unknown>;
  const rawUrl = typeof payload.url === "string" ? payload.url.trim() : "";
  if (!rawUrl) return null;

  if (rawUrl.startsWith("/")) {
    return rawUrl;
  }

  const parsed = ExpoLinking.parse(rawUrl);
  if (parsed.path) {
    return `/${parsed.path}${parsed.queryParams ? buildQueryString(parsed.queryParams) : ""}`;
  }

  return null;
}

export function navigateFromNotificationResponse(router: Router, response: Notifications.NotificationResponse) {
  const path = getNavigationPathFromNotificationData(response.notification.request.content.data);
  if (!path) return false;
  router.push(path as Href);
  return true;
}

function buildQueryString(queryParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  Object.entries(queryParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry != null) params.append(key, entry);
      });
      return;
    }

    if (value != null) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}
