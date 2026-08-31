import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { seedNetworkFromStaticLines } from "@/lib/networkSeed";
import type {
  AppSettings,
  ManagedRoute,
  ManagedStation,
  NetworkSnapshot,
  RouteRow,
  StationRow,
  StationStatus,
} from "@/lib/networkTypes";
import { DEFAULT_APP_SETTINGS, newId } from "@/lib/networkTypes";

const LOCAL_KEY = "albridge_network_v6";
const LEGACY_LOCAL_KEY = "albridge_network_v5";
const SUPABASE_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

type AppSettingsRow = {
  id: string;
  show_office_hours: boolean;
  updated_at: string;
};

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

function emptySnapshot(): NetworkSnapshot {
  return {
    version: 1,
    routes: [],
    settings: DEFAULT_APP_SETTINGS,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeSnapshot(raw: unknown): NetworkSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as NetworkSnapshot;
  if (s.version !== 1 || !Array.isArray(s.routes)) return null;
  return {
    version: 1,
    routes: s.routes,
    settings: normalizeSettings(s.settings),
    updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : new Date().toISOString(),
  };
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

export function readLocalNetwork(): NetworkSnapshot {
  if (typeof window === "undefined") return seedNetworkFromStaticLines();
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

function rowToRoute(row: RouteRow, stations: ManagedStation[]): ManagedRoute {
  return {
    id: row.id,
    routeNumber: row.route_number,
    slug: row.slug,
    name: { ar: row.name, en: row.name_en || row.name },
    subtitle: { ar: row.subtitle || "", en: row.subtitle_en || row.subtitle || "" },
    badge: {
      ar: row.badge || `الخط ${row.route_number}`,
      en: row.badge_en || `Line ${row.route_number}`,
    },
    isActive: row.is_active,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    stations,
  };
}

function rowToStation(row: StationRow): ManagedStation {
  const status = (["clear", "moderate", "congested"] as StationStatus[]).includes(row.status)
    ? row.status
    : "clear";
  return {
    id: row.id,
    routeId: row.route_id,
    stationIndex: row.station_index,
    name: { ar: row.name, en: row.name_en || row.name },
    description: { ar: row.description || "", en: row.description_en || row.description || "" },
    defaultTime: row.default_time,
    status,
    notes: row.notes || "",
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    googleMapsUrl:
      row.google_maps_url || `https://www.google.com/maps?q=${row.lat ?? 0},${row.lng ?? 0}`,
    imageUrl: row.image_url || "",
  };
}

function routeToRow(route: ManagedRoute): RouteRow {
  return {
    id: route.id,
    route_number: route.routeNumber,
    name: route.name.ar,
    name_en: route.name.en,
    slug: route.slug,
    subtitle: route.subtitle.ar,
    subtitle_en: route.subtitle.en,
    badge: route.badge.ar,
    badge_en: route.badge.en,
    is_active: route.isActive,
    display_order: route.displayOrder,
    created_at: route.createdAt,
  };
}

function stationToRow(station: ManagedStation): StationRow {
  return {
    id: station.id,
    route_id: station.routeId,
    station_index: station.stationIndex,
    name: station.name.ar,
    name_en: station.name.en,
    description: station.description.ar,
    description_en: station.description.en,
    default_time: station.defaultTime,
    status: station.status,
    notes: station.notes,
    lat: station.lat,
    lng: station.lng,
    google_maps_url: station.googleMapsUrl,
    image_url: station.imageUrl,
  };
}

function settingsToRow(settings: AppSettings): AppSettingsRow {
  return {
    id: "default",
    show_office_hours: settings.showOfficeHours,
    updated_at: new Date().toISOString(),
  };
}

function rowToSettings(row: AppSettingsRow): AppSettings {
  return { showOfficeHours: row.show_office_hours };
}

async function fetchAppSettingsFromSupabase(): Promise<AppSettings> {
  const sb = getSupabase();
  if (!sb) return DEFAULT_APP_SETTINGS;
  const { data, error } = await sb
    .from("app_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return DEFAULT_APP_SETTINGS;
  return rowToSettings(data as AppSettingsRow);
}

async function pushAppSettingsToSupabase(settings: AppSettings): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb
    .from("app_settings")
    .upsert(settingsToRow(settings), { onConflict: "id" });
  if (error) throw error;
}

export async function fetchNetworkFromSupabase(): Promise<NetworkSnapshot | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: routeRows, error: routeErr } = await sb
    .from("routes")
    .select("*")
    .order("display_order", { ascending: true });
  if (routeErr) throw routeErr;
  if (!routeRows?.length) return null;

  const { data: stationRows, error: stationErr } = await sb
    .from("stations")
    .select("*")
    .order("station_index", { ascending: true });
  if (stationErr) throw stationErr;

  const byRoute = new Map<string, ManagedStation[]>();
  for (const row of (stationRows ?? []) as StationRow[]) {
    const list = byRoute.get(row.route_id) ?? [];
    list.push(rowToStation(row));
    byRoute.set(row.route_id, list);
  }

  const routes = (routeRows as RouteRow[]).map((r) =>
    rowToRoute(
      r,
      (byRoute.get(r.id) ?? []).sort((a, b) => a.stationIndex - b.stationIndex),
    ),
  );

  const settings = await fetchAppSettingsFromSupabase();

  return { version: 1, routes, settings, updatedAt: new Date().toISOString() };
}

export async function pushNetworkToSupabase(snapshot: NetworkSnapshot): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const routeRows = snapshot.routes.map(routeToRow);
  const stationRows = snapshot.routes.flatMap((r) => r.stations.map(stationToRow));

  const { error: upsertRoutesErr } = await sb
    .from("routes")
    .upsert(routeRows, { onConflict: "id" });
  if (upsertRoutesErr) throw upsertRoutesErr;

  // Remove stations that no longer exist for synced routes
  const routeIds = snapshot.routes.map((r) => r.id);
  if (routeIds.length) {
    const keepStationIds = stationRows.map((s) => s.id);
    const { data: existing } = await sb
      .from("stations")
      .select("id, route_id")
      .in("route_id", routeIds);
    const toDelete = (existing ?? [])
      .filter((s: { id: string }) => !keepStationIds.includes(s.id))
      .map((s: { id: string }) => s.id);
    if (toDelete.length) {
      const { error } = await sb.from("stations").delete().in("id", toDelete);
      if (error) throw error;
    }
  }

  if (stationRows.length) {
    const { error } = await sb.from("stations").upsert(stationRows, { onConflict: "id" });
    if (error) throw error;
  }

  try {
    await pushAppSettingsToSupabase(normalizeSettings(snapshot.settings));
  } catch (err) {
    console.error("[Albridge] Supabase app_settings sync failed", err);
  }
}

export async function loadNetwork(): Promise<{
  snapshot: NetworkSnapshot;
  source: "supabase" | "local";
}> {
  const local = readLocalNetwork();

  if (!isSupabaseConfigured) {
    return { snapshot: local, source: "local" };
  }

  try {
    const remote = await withTimeout(
      fetchNetworkFromSupabase(),
      SUPABASE_TIMEOUT_MS,
      "Supabase fetch",
    );
    if (remote && remote.routes.length > 0) {
      writeLocalNetwork(remote);
      return { snapshot: remote, source: "supabase" };
    }
    const seeded = seedNetworkFromStaticLines();
    writeLocalNetwork(seeded);
    void pushNetworkToSupabase(seeded).catch((err) => {
      console.error("[Albridge] Supabase background seed failed", err);
    });
    return { snapshot: seeded, source: "supabase" };
  } catch (err) {
    console.error("[Albridge] Supabase load failed, using local", err);
    return { snapshot: local, source: "local" };
  }
}

export async function persistNetwork(snapshot: NetworkSnapshot): Promise<"supabase" | "local"> {
  const next: NetworkSnapshot = {
    ...snapshot,
    settings: normalizeSettings(snapshot.settings),
    updatedAt: new Date().toISOString(),
  };
  writeLocalNetwork(next);
  if (isSupabaseConfigured) {
    try {
      await pushNetworkToSupabase(next);
      return "supabase";
    } catch (err) {
      console.error("[Albridge] Supabase persist failed, kept local", err);
    }
  }
  return "local";
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

export { emptySnapshot, LOCAL_KEY };
