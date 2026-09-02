/** Backend API response shapes (camelCase JSON from ASP.NET). */

export type ApiResult<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestampUtc?: string;
};

export type ApiLocalizedText = {
  ar: string;
  en: string;
  de?: string;
};

export type ApiLectureSchedule = {
  id: number;
  lectureTime: string;
  gatheringTime: string;
};

export type ApiTransportLine = {
  id: number;
  lineNumber: number;
  name: ApiLocalizedText;
  slug: string;
  descriptionOrRouteRange: ApiLocalizedText;
  badge: ApiLocalizedText;
  isVisibleInPublicMenu: boolean;
  gatheringPointsCount: number;
  estimatedDurationMinutes: number;
  updatedAt: string;
  returnDepartureTimes: string[];
  stationCount: number;
};

export type ApiStation = {
  id: number;
  transportLineId: number;
  stationNumber: number;
  name: ApiLocalizedText;
  descriptionOrLandmark: ApiLocalizedText;
  distanceText: string;
  imagePath: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  trafficStatus: string;
  trafficStatusCode: string;
  defaultGatheringTime: string;
  adminNotes: string;
  lectureSchedules: ApiLectureSchedule[];
};

export type ApiSiteSettings = {
  showScheduleTimes: boolean;
  statusBadgeText: string;
  updatedAt: string;
};

export type ApiNetworkSnapshot = {
  version: number;
  updatedAt: string;
  settings: ApiSiteSettings;
  lines: ApiTransportLine[];
  stations: ApiStation[];
};
