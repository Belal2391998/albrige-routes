import type { Localized } from "@/lib/i18n";
import type { TrafficStatus } from "@/data/transportData";

export type StationStatus = TrafficStatus;

export type ManagedStation = {
  id: string;
  routeId: string;
  stationIndex: number;
  name: Localized;
  description: Localized;
  defaultTime: string;
  status: StationStatus;
  notes: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
  imageUrl: string;
};

export type ManagedRoute = {
  id: string;
  routeNumber: string;
  slug: string;
  name: Localized;
  subtitle: Localized;
  badge: Localized;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  stations: ManagedStation[];
};

export type AppSettings = {
  /** When false, pickup schedules and return departures are hidden on the public site */
  showOfficeHours: boolean;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  showOfficeHours: true,
};

export type NetworkSnapshot = {
  version: 1;
  routes: ManagedRoute[];
  updatedAt: string;
  settings?: AppSettings;
};

/** DB row shapes (Supabase) */
export type RouteRow = {
  id: string;
  route_number: string;
  name: string;
  name_en: string | null;
  slug: string;
  subtitle: string | null;
  subtitle_en: string | null;
  badge: string | null;
  badge_en: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
};

export type StationRow = {
  id: string;
  route_id: string;
  station_index: number;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  default_time: string;
  status: StationStatus;
  notes: string | null;
  lat: number | null;
  lng: number | null;
  google_maps_url: string | null;
  image_url: string | null;
  created_at?: string;
};

export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function slugifyRoute(routeNumber: string, nameAr: string) {
  const base = nameAr
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .slice(0, 40);
  return `line-${routeNumber}-${base || "route"}`.replace(/-+/g, "-");
}
