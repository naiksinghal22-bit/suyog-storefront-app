import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { getNotificationPermissionsAsync, registerForPushNotificationsAsync } from "@/src/lib/notifications";

const STORAGE_KEYS = {
  audienceContext: "push.audienceContext",
  devicePushToken: "push.devicePushToken",
} as const;

const MAX_COLLECTIONS = 8;
const MAX_PRODUCTS = 12;
const MAX_SIZES = 8;

export type PushAudienceContext = {
  sizePreferences: string[];
  collectionSlugs: string[];
  productSlugs: string[];
};

type StoredDevicePushToken = {
  expoPushToken: string;
};

const EMPTY_AUDIENCE_CONTEXT: PushAudienceContext = {
  sizePreferences: [],
  collectionSlugs: [],
  productSlugs: [],
};

export async function getStoredAudienceContext() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.audienceContext);
  if (!raw) return EMPTY_AUDIENCE_CONTEXT;

  try {
    const parsed = JSON.parse(raw) as Partial<PushAudienceContext>;
    return normalizeAudienceContext(parsed);
  } catch {
    return EMPTY_AUDIENCE_CONTEXT;
  }
}

export async function updateAudienceContext(update: Partial<PushAudienceContext>) {
  const current = await getStoredAudienceContext();
  const next = normalizeAudienceContext({
    sizePreferences: update.sizePreferences ?? current.sizePreferences,
    collectionSlugs: mergeLists(current.collectionSlugs, update.collectionSlugs ?? []),
    productSlugs: mergeLists(current.productSlugs, update.productSlugs ?? []),
  });

  await AsyncStorage.setItem(STORAGE_KEYS.audienceContext, JSON.stringify(next));
  await syncPushRegistrationIfPossible();
  return next;
}

export async function addCollectionInterest(slug: string) {
  if (!slug.trim()) return getStoredAudienceContext();
  const current = await getStoredAudienceContext();
  const next = normalizeAudienceContext({
    ...current,
    collectionSlugs: [slug.trim(), ...current.collectionSlugs],
  });
  await AsyncStorage.setItem(STORAGE_KEYS.audienceContext, JSON.stringify(next));
  await syncPushRegistrationIfPossible();
  return next;
}

export async function addProductInterest(slug: string) {
  if (!slug.trim()) return getStoredAudienceContext();
  const current = await getStoredAudienceContext();
  const next = normalizeAudienceContext({
    ...current,
    productSlugs: [slug.trim(), ...current.productSlugs],
  });
  await AsyncStorage.setItem(STORAGE_KEYS.audienceContext, JSON.stringify(next));
  await syncPushRegistrationIfPossible();
  return next;
}

export async function addSizePreference(size: string) {
  const normalized = size.trim().toUpperCase();
  if (!normalized) return getStoredAudienceContext();
  const current = await getStoredAudienceContext();
  const next = normalizeAudienceContext({
    ...current,
    sizePreferences: [normalized, ...current.sizePreferences],
  });
  await AsyncStorage.setItem(STORAGE_KEYS.audienceContext, JSON.stringify(next));
  await syncPushRegistrationIfPossible();
  return next;
}

export async function syncPushRegistrationIfPossible() {
  const permissionStatus = await getNotificationPermissionsAsync();
  if (permissionStatus !== Notifications.PermissionStatus.GRANTED) return null;
  return enableAndSyncPushNotifications();
}

export async function enableAndSyncPushNotifications() {
  const setupResult = await registerForPushNotificationsAsync();
  if (!setupResult.token) return setupResult;

  const storedToken: StoredDevicePushToken = {
    expoPushToken: setupResult.token,
  };
  await AsyncStorage.setItem(STORAGE_KEYS.devicePushToken, JSON.stringify(storedToken));

  return {
    ...setupResult,
    warning: "Device notifications are enabled. Secure server-side push syncing still needs to be completed before remote campaigns go live.",
  };
}

export async function deactivateRegisteredPushToken() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.devicePushToken);
  if (!raw) return false;

  try {
    const stored = JSON.parse(raw) as Partial<StoredDevicePushToken>;
    if (!stored.expoPushToken) return false;
    await AsyncStorage.removeItem(STORAGE_KEYS.devicePushToken);
    return true;
  } catch {
    return false;
  }
}

export function getPushProjectIdForDisplay() {
  return "";
}

function normalizeAudienceContext(input: Partial<PushAudienceContext>): PushAudienceContext {
  return {
    sizePreferences: uniqueTrimmedList(input.sizePreferences ?? []).slice(0, MAX_SIZES).map((entry) => entry.toUpperCase()),
    collectionSlugs: uniqueTrimmedList(input.collectionSlugs ?? []).slice(0, MAX_COLLECTIONS),
    productSlugs: uniqueTrimmedList(input.productSlugs ?? []).slice(0, MAX_PRODUCTS),
  };
}

function uniqueTrimmedList(values: string[]) {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function mergeLists(existing: string[], next: string[]) {
  return [...next, ...existing];
}
