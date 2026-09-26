"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Forwards Core Web Vitals into GA4 as `web_vitals` events.
 *
 * GA4 was already installed but reported no field performance data, so LCP /
 * INP / CLS were unmeasurable — which made every performance decision about
 * the 3D hero guesswork.
 *
 * Note the deliberate avoidance of `window.gtag`. The gtag snippet loads with
 * `afterInteractive`, but FCP and TTFB can report before that, so reading
 * `window.gtag` and bailing when it's missing silently drops the earliest
 * metrics. Instead we push onto `dataLayer` exactly the way the official gtag
 * shim does — an `arguments` object — which queues safely whether gtag.js has
 * loaded yet or not, and is picked up when it does.
 */

type DataLayerWindow = Window & { dataLayer?: unknown[] };

/**
 * Mirrors `function gtag(){dataLayer.push(arguments);}` from the GA snippet.
 *
 * It must push a real `arguments` object: gtag.js reads those specifically and
 * ignores plain arrays, so a rest-parameter version would queue events that
 * never register. Hence the untyped function body plus a typed cast.
 */
const queueGtagEvent = function () {
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  w.dataLayer.push(arguments);
} as (...args: unknown[]) => void;

export function WebVitals() {
  useReportWebVitals((metric) => {
    queueGtagEvent("event", "web_vitals", {
      metric_name: metric.name,
      // GA4 metric values must be integers. CLS is a unitless ratio, so it is
      // scaled by 1000 (0.05 -> 50); everything else is already milliseconds.
      metric_value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value
      ),
      metric_rating: metric.rating,
      metric_id: metric.id,
      // Keeps these out of engagement/bounce calculations.
      non_interaction: true,
    });
  });

  return null;
}
