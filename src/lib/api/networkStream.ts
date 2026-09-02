import { API_BASE_URL, isApiConfigured } from "@/lib/api/config";

type StreamHandlers = {
  /** Server says the data changed — refetch. */
  onChange: () => void;
  /** Reports whether the push channel is alive, so callers can fall back to polling. */
  onLiveChange?: (live: boolean) => void;
};

/**
 * Listens for server-pushed change hints so a save on the admin device refreshes
 * student devices immediately. The event body is only a timestamp; the client
 * refetches through its normal (public or admin) endpoint, so nothing leaks.
 *
 * `EventSource` reconnects on its own, so a dropped backend recovers without help.
 */
export function subscribeToServerChanges({ onChange, onLiveChange }: StreamHandlers): () => void {
  if (!isApiConfigured || typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => {};
  }

  let source: EventSource;
  try {
    source = new EventSource(`${API_BASE_URL}/api/network/stream`);
  } catch {
    return () => {};
  }

  const handleChange = () => onChange();
  const handleOpen = () => onLiveChange?.(true);
  const handleError = () => onLiveChange?.(false);

  source.addEventListener("network-changed", handleChange);
  source.addEventListener("open", handleOpen);
  source.addEventListener("error", handleError);

  return () => {
    source.removeEventListener("network-changed", handleChange);
    source.removeEventListener("open", handleOpen);
    source.removeEventListener("error", handleError);
    source.close();
    onLiveChange?.(false);
  };
}
