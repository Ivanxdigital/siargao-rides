export type TrackEventProps = Record<string, unknown>;

/**
 * Lightweight client-side event logger.
 * If/when a real analytics pipeline exists, swap implementation here.
 */
export function trackEvent(name: string, props: TrackEventProps = {}) {
  if (typeof window === "undefined") return;
  try {
    // Keep it simple for now: console + optional dataLayer hook.
    // eslint-disable-next-line no-console
    console.log(`[event] ${name}`, props);

    const dataLayer = (window as any).dataLayer;
    if (Array.isArray(dataLayer)) {
      dataLayer.push({ event: name, ...props });
    }
  } catch {
    // Never block product flow on analytics.
  }
}

