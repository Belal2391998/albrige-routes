const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Valid RFC-4122-style UUID (deterministic from a stable string key). */
export function stableUuid(key: string): string {
  const parts = [key, `${key}:1`, `${key}:2`, `${key}:3`];
  const bytes: number[] = [];
  for (const part of parts) {
    let h = 2166136261;
    for (let i = 0; i < part.length; i++) {
      h = Math.imul(h ^ part.charCodeAt(i), 16777619);
    }
    bytes.push((h >>> 24) & 255, (h >>> 16) & 255, (h >>> 8) & 255, h & 255);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function isValidUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export function routeStableId(slug: string): string {
  return stableUuid(`albridge:route:${slug}`);
}

export function stationStableId(routeSlug: string, stationIndex: number): string {
  return stableUuid(`albridge:station:${routeSlug}:${stationIndex}`);
}
