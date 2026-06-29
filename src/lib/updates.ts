import AsyncStorage from "@react-native-async-storage/async-storage";

import type { MobileUpdateItem } from "@/src/types/storefront";

const STORAGE_KEY = "updates.clientState";

export const UPDATES_CONFIG = {
  retentionDays: 60,
  maxHiddenItems: 160,
  maxReadItems: 240,
  fetchLimit: 50,
} as const;

type UpdateStateMap = Record<string, string>;

type StoredUpdatesState = {
  hiddenById: UpdateStateMap;
  readById: UpdateStateMap;
  lastPrunedAt?: string;
};

const EMPTY_STATE: StoredUpdatesState = {
  hiddenById: {},
  readById: {},
};

export async function getUpdatesState() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredUpdatesState>;
    return pruneState({
      hiddenById: parsed.hiddenById ?? {},
      readById: parsed.readById ?? {},
      lastPrunedAt: parsed.lastPrunedAt,
    });
  } catch {
    return EMPTY_STATE;
  }
}

export async function markUpdateRead(id: string) {
  const state = await getUpdatesState();
  const nextState = pruneState({
    ...state,
    readById: {
      ...state.readById,
      [id]: new Date().toISOString(),
    },
  });
  await saveUpdatesState(nextState);
  return nextState;
}

export async function hideUpdate(id: string) {
  const state = await getUpdatesState();
  const nextState = pruneState({
    ...state,
    hiddenById: {
      ...state.hiddenById,
      [id]: new Date().toISOString(),
    },
  });
  await saveUpdatesState(nextState);
  return nextState;
}

export function filterVisibleUpdates(items: MobileUpdateItem[], state: StoredUpdatesState) {
  return items
    .filter((item) => !state.hiddenById[item.id])
    .filter((item) => isWithinRetention(item.createdAt))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function isUpdateRead(id: string, state: StoredUpdatesState) {
  return Boolean(state.readById[id]);
}

async function saveUpdatesState(state: StoredUpdatesState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pruneState(state: StoredUpdatesState) {
  const cutoff = Date.now() - UPDATES_CONFIG.retentionDays * 24 * 60 * 60 * 1000;
  const hiddenEntries = pruneEntries(state.hiddenById, cutoff, UPDATES_CONFIG.maxHiddenItems);
  const readEntries = pruneEntries(state.readById, cutoff, UPDATES_CONFIG.maxReadItems);

  return {
    hiddenById: Object.fromEntries(hiddenEntries),
    readById: Object.fromEntries(readEntries),
    lastPrunedAt: new Date().toISOString(),
  };
}

function pruneEntries(map: UpdateStateMap, cutoff: number, maxItems: number) {
  return Object.entries(map)
    .filter(([, timestamp]) => new Date(timestamp).getTime() >= cutoff)
    .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())
    .slice(0, maxItems);
}

function isWithinRetention(createdAt: string) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs <= UPDATES_CONFIG.retentionDays * 24 * 60 * 60 * 1000;
}
