"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Forwards Core Web Vitals into GA4 as `web_vitals` events.
 *
 * GA4 was already installed but reported no field performance data, so LCP /
 * INP / CLS were unmeasurable — which made every performance decision about
 * the 3D hero guesswork. This closes that loop without adding a dependency:
 * `next/web-vitals` wraps the `web-vitals` library Next already bundles.
 *
 * Values are rounded the way GA4 expects (CLS is a unitless ratio, so it is
 * scaled by 1000; everything else is milliseconds) because GA4 metric values
 * must be integers.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void })
      .gtag;
    if (typeof gtag !== "function") return;

    gtag("event", "web_vitals", {
      metric_name: metric.name,
      metric_value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value
      ),
      metric_rating: metric.rating,
      metric_id: metric.id,
      // Non-interaction so these don't distort bounce rate / engagement.
      non_interaction: true,
    });
  });

  return null;
}
