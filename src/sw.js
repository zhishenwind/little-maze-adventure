import { cacheNames, clientsClaim, setCacheNameDetails } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  getCacheKeyForURL,
  matchPrecache,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

setCacheNameDetails({ prefix: "little-maze", suffix: self.registration.scope });
const manifest = __MAZE_PRECACHE_MANIFEST__;
// The build injects only this release's local assets. Workbox rejects incomplete installations.
precacheAndRoute(manifest);
cleanupOutdatedCaches();
clientsClaim();
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/\/api(?:\/|$)/],
  }),
);

async function repairCache() {
  const cache = await caches.open(cacheNames.precache);
  await Promise.all(
    manifest.map(async ({ url }) => {
      const key = getCacheKeyForURL(url);
      if (!key || (await cache.match(key))) return;
      const response = await fetch(new URL(url, self.location.href), {
        cache: "reload",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Incomplete offline package");
      await cache.put(key, response);
    }),
  );
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  } else if (
    ["CHECK_OFFLINE_CACHE", "REPAIR_OFFLINE_CACHE"].includes(
      event.data?.type,
    ) &&
    event.ports[0]
  ) {
    event.waitUntil(
      Promise.resolve(
        event.data.type === "REPAIR_OFFLINE_CACHE" ? repairCache() : undefined,
      )
        .then(() => Promise.all(manifest.map(({ url }) => matchPrecache(url))))
        .then((responses) =>
          event.ports[0].postMessage({ ready: responses.every(Boolean) }),
        )
        .catch(() => event.ports[0].postMessage({ ready: false })),
    );
  }
});
