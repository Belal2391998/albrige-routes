import { isApiConfigured } from "@/lib/api/config";
import { fetchAdminNetworkSnapshot, fetchPublicNetworkSnapshot } from "@/lib/api/mapApiSnapshot";
import { getAdminSessionToken } from "@/lib/api/adminSession";
import { seedNetworkFromStaticLines } from "@/lib/networkSeed";
import { isValidUuid, routeStableId, stationStableId } from "@/lib/stableUuid";
import type {
  AppSettings,
  ManagedRoute,
  ManagedStation,
  NetworkSnapshot,
} from "@/lib/networkTypes";
import { DEFAULT_APP_SETTINGS, newId } from "@/lib/networkTypes";
import type { Locale } from "@/lib/i18n";

const LOCAL_KEY = "albridge_network_v6";
const LEGACY_LOCAL_KEY = "albridge_network_v5";
const API_CACHE_KEY = "albridge_network_api_cache_v1";

function normalizeSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_APP_SETTINGS;
  const s = raw as AppSettings;
  return {
    showOfficeHours:
      typeof s.showOfficeHours === "boolean"
        ? s.showOfficeHours
        : DEFAULT_APP_SETTINGS.showOfficeHours,
  };
}

function normalizeSnapshot(raw: unknown): NetworkSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as NetworkSnapshot;
  if (s.version !== 1 || !Array.isArray(s.routes)) return null;
  return migrateSnapshotIds({
    version: 1,
    routes: s.routes,
    settings: normalizeSettings(s.settings),
    updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : new Date().toISOString(),
  });
}

/** Map legacy string ids (route-line-1) → stable UUIDs for server persistence. */
export function migrateSnapshotIds(snapshot: NetworkSnapshot): NetworkSnapshot {
  let changed = false;
  const routes = snapshot.routes.map((route) => {
    const routeId = routeStableId(route.slug);
    if (route.id !== routeId) changed = true;
    const stations = route.stations.map((station) => {
      const stationId = stationStableId(route.slug, station.stationIndex);
      if (station.id !== stationId || station.routeId !== routeId) changed = true;
      return {
        ...station,
        id: stationId,
        routeId,
      };
    });
    return { ...route, id: routeId, stations };
  });
  if (!changed) return snapshot;
  return { ...snapshot, routes, updatedAt: snapshot.updatedAt };
}

function snapshotNeedsMigration(snapshot: NetworkSnapshot): boolean {
  return snapshot.routes.some((r) => !isValidUuid(r.id));
}

function readLegacyLocalNetwork(): NetworkSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_LOCAL_KEY);
    if (!raw) return null;
    const parsed = normalizeSnapshot(JSON.parse(raw));
    if (!parsed?.routes.length) return null;
    writeLocalNetwork(parsed);
    return parsed;
  } catch {
    return null;
  }
}

function readApiCache(): NetworkSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(API_CACHE_KEY);
    if (!raw) return null;
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeApiCache(snapshot: NetworkSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(API_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function readLocalNetwork(): NetworkSnapshot {
  if (typeof window === "undefined") return seedNetworkFromStaticLines();

  const apiCache = readApiCache();
  if (apiCache?.routes.length) return apiCache;

  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      const legacy = readLegacyLocalNetwork();
      if (legacy) return legacy;
      const seeded = seedNetworkFromStaticLines();
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = normalizeSnapshot(JSON.parse(raw));
    if (!parsed || parsed.routes.length === 0) {
      const legacy = readLegacyLocalNetwork();
      if (legacy) return legacy;
      const seeded = seedNetworkFromStaticLines();
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(seeded));
      return seeded;
    }
    if (snapshotNeedsMigration(parsed)) {
      writeLocalNetwork(parsed);
    }
    return parsed;
  } catch {
    return seedNetworkFromStaticLines();
  }
}

export function writeLocalNetwork(snapshot: NetworkSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify({ ...snapshot, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* ignore quota */
  }
}

/** Loads network from ASP.NET API when configured; falls back to local/static seed. */
export async function loadNetwork(locale?: Locale): Promise<NetworkSnapshot> {
  if (isApiConfigured) {
    try {
      const remote = await fetchPublicNetworkSnapshot(locale);
      writeApiCache(remote);
      return remote;
    } catch (err) {
      console.error("[Albridge] API network load failed, using cache/local", err);
      const cached = readApiCache();
      if (cached?.routes.length) return cached;
    }
  }

  return readLocalNetwork();
}

/** Persists admin edits locally when no API is configured. */
export async function persistNetwork(snapshot: NetworkSnapshot): Promise<void> {
  if (isApiConfigured && getAdminSessionToken()) return;
  const next = migrateSnapshotIds({
    ...snapshot,
    settings: normalizeSettings(snapshot.settings),
    updatedAt: new Date().toISOString(),
  });
  writeLocalNetwork(next);
}

/** Loads full network for admin dashboard (includes hidden lines). */
export async function loadAdminNetwork(locale?: Locale): Promise<NetworkSnapshot> {
  if (isApiConfigured && getAdminSessionToken()) {
    // Not cached: the admin snapshot carries lines hidden from students, and the
    // cache is what the public view reads on its next cold start.
    return fetchAdminNetworkSnapshot(locale);
  }
  return loadNetwork(locale);
}

export function createEmptyRoute(partial?: Partial<ManagedRoute>): ManagedRoute {
  const id = newId();
  const routeNumber = partial?.routeNumber ?? String(Date.now() % 1000);
  return {
    id,
    routeNumber,
    slug: partial?.slug ?? `line-${routeNumber}`,
    name: partial?.name ?? { ar: "خط جديد", en: "New route" },
    subtitle: partial?.subtitle ?? { ar: "", en: "" },
    badge: partial?.badge ?? { ar: `الخط ${routeNumber}`, en: `Line ${routeNumber}` },
    isActive: partial?.isActive ?? true,
    displayOrder: partial?.displayOrder ?? 99,
    createdAt: new Date().toISOString(),
    stations: partial?.stations ?? [],
  };
}

export function createEmptyStation(routeId: string, index: number): ManagedStation {
  return {
    id: newId(),
    routeId,
    stationIndex: index,
    name: { ar: "محطة جديدة", en: "New station" },
    description: { ar: "", en: "" },
    defaultTime: "07:00 AM",
    status: "clear",
    notes: "",
    lat: 31.95,
    lng: 35.91,
    googleMapsUrl: "https://www.google.com/maps?q=31.95,35.91",
    imageUrl: "",
  };
}

export { LOCAL_KEY };
