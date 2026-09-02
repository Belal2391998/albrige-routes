import type {
  AppSettings,
  ManagedRoute,
  ManagedStation,
  RouteRow,
  StationRow,
} from "@/lib/networkTypes";

/** Maps ASP.NET / SQL row shapes ↔ frontend domain models. */

export function rowToRoute(row: RouteRow, stations: ManagedStation[]): ManagedRoute {
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

export function rowToStation(row: StationRow): ManagedStation {
  return {
    id: row.id,
    routeId: row.route_id,
    stationIndex: row.station_index,
    name: { ar: row.name, en: row.name_en || row.name },
    description: { ar: row.description || "", en: row.description_en || row.description || "" },
    defaultTime: row.default_time,
    status: row.status,
    notes: row.notes || "",
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    googleMapsUrl:
      row.google_maps_url || `https://www.google.com/maps?q=${row.lat ?? 0},${row.lng ?? 0}`,
    imageUrl: row.image_url || "",
  };
}

export function routeToRow(route: ManagedRoute): RouteRow {
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

export function stationToRow(station: ManagedStation): StationRow {
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

export type AppSettingsRow = {
  id: string;
  show_office_hours: boolean;
  updated_at: string;
};

export function settingsToRow(settings: AppSettings): AppSettingsRow {
  return {
    id: "default",
    show_office_hours: settings.showOfficeHours,
    updated_at: new Date().toISOString(),
  };
}

export function rowToSettings(row: AppSettingsRow): AppSettings {
  return { showOfficeHours: row.show_office_hours };
}
