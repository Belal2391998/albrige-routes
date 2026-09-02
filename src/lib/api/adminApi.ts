import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiUpload } from "@/lib/api/client";
import { API_BASE_URL } from "@/lib/api/config";
import type { ApiNetworkSnapshot, ApiStation } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import type { ManagedRoute, ManagedStation } from "@/lib/networkTypes";

export type VerifyPasscodeResponse = {
  verified: boolean;
  sessionToken?: string;
  expiresAtUtc?: string;
};

export type SessionStatusResponse = {
  isAuthenticated: boolean;
  expiresAtUtc?: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type CreateStationRequest = {
  transportLineId: number;
  stationName: string;
  stationNameEn?: string;
  stationNameDe?: string;
  descriptionOrLandmark: string;
  descriptionOrLandmarkEn?: string;
  descriptionOrLandmarkDe?: string;
  distanceText?: string;
  imagePath?: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  trafficStatusCode: string;
  defaultGatheringTime: string;
  adminNotes: string;
};

export type UpdateStationRequest = {
  stationName: string;
  stationNameEn?: string;
  stationNameDe?: string;
  descriptionOrLandmark: string;
  descriptionOrLandmarkEn?: string;
  descriptionOrLandmarkDe?: string;
  distanceText?: string;
  imagePath?: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  trafficStatusCode: string;
  defaultGatheringTime: string;
  adminNotes: string;
};

export type BatchStationItem = {
  id: number;
  defaultGatheringTime?: string;
  trafficStatusCode?: string;
  adminNotes?: string;
  stationName?: string;
  stationNameEn?: string;
  stationNameDe?: string;
  descriptionOrLandmark?: string;
  descriptionOrLandmarkEn?: string;
  descriptionOrLandmarkDe?: string;
  imagePath?: string;
  googleMapsUrl?: string;
};

export type StationImageUploadResponse = {
  imagePath: string;
  publicUrl: string;
};

export type UpdateSiteSettingsRequest = {
  showScheduleTimes: boolean;
  statusBadgeText?: string;
};

export type CreateTransportLineRequest = {
  lineNumber: number;
  lineName: string;
  lineNameEn?: string;
  lineNameDe?: string;
  slug: string;
  descriptionOrRouteRange: string;
  descriptionOrRouteRangeEn?: string;
  descriptionOrRouteRangeDe?: string;
  isVisibleInPublicMenu: boolean;
  estimatedDurationMinutes: number;
};

export type UpdateTransportLineRequest = {
  lineName: string;
  lineNameEn?: string;
  lineNameDe?: string;
  slug: string;
  descriptionOrRouteRange: string;
  descriptionOrRouteRangeEn?: string;
  descriptionOrRouteRangeDe?: string;
  isVisibleInPublicMenu: boolean;
  estimatedDurationMinutes: number;
};

/**
 * Omits the field entirely for inline data URLs so the stored path is left alone,
 * and strips the API origin so the database keeps an environment-independent path
 * instead of a URL that breaks the moment the backend moves.
 */
function imagePathForApi(imageUrl: string): { imagePath?: string } {
  const trimmed = imageUrl.trim();
  if (!trimmed || trimmed.startsWith("data:")) return {};

  let path = trimmed;
  if (API_BASE_URL && path.startsWith(API_BASE_URL)) {
    path = path.slice(API_BASE_URL.length);
  }
  // Drop the cache-busting query the upload response adds.
  path = path.replace(/\?v=\d+$/, "");

  return { imagePath: path };
}

/**
 * Send every language column the backend stores — the API keeps ar/en/de separately.
 */
function localizedFields(text: { ar: string; en?: string; de?: string }) {
  return {
    ar: text.ar,
    en: text.en ?? text.ar,
    de: text.de?.trim() || undefined,
  };
}

export function mapStationToCreateRequest(
  station: ManagedStation,
  transportLineId: number,
): CreateStationRequest {
  const name = localizedFields(station.name);
  const description = localizedFields(station.description);
  return {
    transportLineId,
    stationName: name.ar,
    stationNameEn: name.en,
    ...(name.de ? { stationNameDe: name.de } : {}),
    descriptionOrLandmark: description.ar,
    descriptionOrLandmarkEn: description.en,
    ...(description.de ? { descriptionOrLandmarkDe: description.de } : {}),
    distanceText: "",
    ...imagePathForApi(station.imageUrl),
    latitude: station.lat,
    longitude: station.lng,
    googleMapsUrl: station.googleMapsUrl,
    trafficStatusCode: station.status,
    defaultGatheringTime: station.defaultTime,
    adminNotes: station.notes,
  };
}

export function mapStationToUpdateRequest(station: ManagedStation): UpdateStationRequest {
  const name = localizedFields(station.name);
  const description = localizedFields(station.description);
  return {
    stationName: name.ar,
    stationNameEn: name.en,
    ...(name.de ? { stationNameDe: name.de } : {}),
    descriptionOrLandmark: description.ar,
    descriptionOrLandmarkEn: description.en,
    ...(description.de ? { descriptionOrLandmarkDe: description.de } : {}),
    distanceText: "",
    ...imagePathForApi(station.imageUrl),
    latitude: station.lat,
    longitude: station.lng,
    googleMapsUrl: station.googleMapsUrl,
    trafficStatusCode: station.status,
    defaultGatheringTime: station.defaultTime,
    adminNotes: station.notes,
  };
}

export function mapStationToBatchItem(station: ManagedStation): BatchStationItem {
  const name = localizedFields(station.name);
  const description = localizedFields(station.description);
  return {
    id: station.backendId!,
    defaultGatheringTime: station.defaultTime,
    trafficStatusCode: station.status,
    adminNotes: station.notes,
    stationName: name.ar,
    stationNameEn: name.en,
    ...(name.de ? { stationNameDe: name.de } : {}),
    descriptionOrLandmark: description.ar,
    descriptionOrLandmarkEn: description.en,
    ...(description.de ? { descriptionOrLandmarkDe: description.de } : {}),
    ...imagePathForApi(station.imageUrl),
    googleMapsUrl: station.googleMapsUrl,
  };
}

export function mapRouteToCreateRequest(route: ManagedRoute): CreateTransportLineRequest {
  const name = localizedFields(route.name);
  const subtitle = localizedFields(route.subtitle);
  return {
    lineNumber: Number(route.routeNumber) || 99,
    lineName: name.ar,
    lineNameEn: name.en,
    ...(name.de ? { lineNameDe: name.de } : {}),
    slug: route.slug,
    descriptionOrRouteRange: subtitle.ar,
    descriptionOrRouteRangeEn: subtitle.en,
    ...(subtitle.de ? { descriptionOrRouteRangeDe: subtitle.de } : {}),
    isVisibleInPublicMenu: route.isActive,
    estimatedDurationMinutes: route.estimatedDurationMinutes ?? 60,
  };
}

export function mapRouteToUpdateRequest(route: ManagedRoute): UpdateTransportLineRequest {
  const name = localizedFields(route.name);
  const subtitle = localizedFields(route.subtitle);
  return {
    lineName: name.ar,
    lineNameEn: name.en,
    ...(name.de ? { lineNameDe: name.de } : {}),
    slug: route.slug,
    descriptionOrRouteRange: subtitle.ar,
    descriptionOrRouteRangeEn: subtitle.en,
    ...(subtitle.de ? { descriptionOrRouteRangeDe: subtitle.de } : {}),
    isVisibleInPublicMenu: route.isActive,
    estimatedDurationMinutes: route.estimatedDurationMinutes ?? 60,
  };
}

export async function verifyPasscode(passcode: string): Promise<VerifyPasscodeResponse> {
  return apiPost<VerifyPasscodeResponse>("/api/auth/passcode/verify", { passcode });
}

export async function getSessionStatus(): Promise<SessionStatusResponse> {
  return apiGet<SessionStatusResponse>("/api/auth/session", { admin: true });
}

export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  await apiPost<object>("/api/auth/password/change", request, { admin: true });
}

export async function logoutAdmin(): Promise<void> {
  await apiPost<object>("/api/auth/logout", {}, { admin: true });
}

export async function fetchAdminNetworkSnapshot(locale?: Locale) {
  return apiGet<ApiNetworkSnapshot>("/api/network/snapshot/admin", { locale, admin: true });
}

export async function createStation(request: CreateStationRequest, locale?: Locale) {
  return apiPost<ApiStation>("/api/stations", request, { locale, admin: true });
}

export async function updateStation(
  stationId: number,
  request: UpdateStationRequest,
  locale?: Locale,
) {
  return apiPut(`/api/stations/${stationId}`, request, { locale, admin: true });
}

export async function batchSaveStations(
  lineId: number,
  stations: BatchStationItem[],
  locale?: Locale,
) {
  return apiPut(`/api/stations/batch/${lineId}`, { stations }, { locale, admin: true });
}

export async function uploadStationImage(
  stationId: number,
  file: File,
  locale?: Locale,
): Promise<StationImageUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiUpload<StationImageUploadResponse>(`/api/stations/${stationId}/image`, form, {
    locale,
    admin: true,
  });
}

export async function restoreDefaults(locale?: Locale) {
  return apiPost<{ linesRestored: number; stationsRestored: number }>(
    "/api/stations/restore-defaults",
    {},
    { locale, admin: true },
  );
}

export async function updateSiteSettings(request: UpdateSiteSettingsRequest, locale?: Locale) {
  return apiPut("/api/settings", request, { locale, admin: true });
}

export async function createTransportLine(request: CreateTransportLineRequest, locale?: Locale) {
  return apiPost("/api/transport-lines", request, { locale, admin: true });
}

export async function updateTransportLine(
  lineId: number,
  request: UpdateTransportLineRequest,
  locale?: Locale,
) {
  return apiPut(`/api/transport-lines/${lineId}`, request, { locale, admin: true });
}

export async function toggleLineVisibility(
  lineId: number,
  isVisibleInPublicMenu: boolean,
  locale?: Locale,
) {
  return apiPatch(
    `/api/transport-lines/${lineId}/visibility`,
    { isVisibleInPublicMenu },
    { locale, admin: true },
  );
}

export async function deleteTransportLine(lineId: number, locale?: Locale) {
  return apiDelete(`/api/transport-lines/${lineId}`, { locale, admin: true });
}
