const CHANNEL_NAME = "albridge_network_sync";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  channel ??= new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

/**
 * Tells every other tab on this origin that admin edits reached the server, so a
 * student page left open elsewhere refreshes instantly instead of waiting for the
 * 30s poll.
 */
export function broadcastNetworkChange() {
  getChannel()?.postMessage(Date.now());
}

export function subscribeToNetworkChanges(listener: () => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = () => listener();
  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}
