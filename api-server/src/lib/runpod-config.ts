/** Accept an endpoint ID or its Runpod API URL without following arbitrary URLs. */
export function normalizeRunpodEndpointId(value: string | undefined): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (/^[a-zA-Z0-9_-]+$/.test(raw)) return raw;

  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "api.runpod.ai" ||
      url.port ||
      url.username ||
      url.password
    ) {
      return undefined;
    }
    return /^\/v2\/([a-zA-Z0-9_-]+)(?:\/|$)/.exec(url.pathname)?.[1];
  } catch {
    return undefined;
  }
}
