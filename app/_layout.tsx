import { useEffect, useRef } from "react";

import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

import { NotificationProvider } from "@/src/components/notification-provider";
import { navigateFromNotificationResponse } from "@/src/lib/notifications";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const router = useRouter();
  const handledResponseIds = useRef(new Set<string>());

  useEffect(() => {
    let mounted = true;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!mounted || !response) return;
      const requestId = response.notification.request.identifier;
      if (handledResponseIds.current.has(requestId)) return;
      handledResponseIds.current.add(requestId);
      navigateFromNotificationResponse(router, response);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const requestId = response.notification.request.identifier;
      if (handledResponseIds.current.has(requestId)) return;
      handledResponseIds.current.add(requestId);
      navigateFromNotificationResponse(router, response);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [router]);

  return (
    <NotificationProvider>
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "700",
          },
          contentStyle: {
            backgroundColor: "#ffffff",
          },
        }}
      />
    </NotificationProvider>
  );
}
