// Minimal service worker - currently only exists so the app is installable
// as a PWA. No offline caching strategy is applied on purpose: this is an
// online multiplayer game, so serving stale app code/data while "offline"
// would be actively misleading rather than helpful.
//
// This is also the file push notification handling (a 'push' event
// listener + notificationclick handling) will be added to later - keeping
// registration wired up now avoids having to re-plumb it at that point.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
