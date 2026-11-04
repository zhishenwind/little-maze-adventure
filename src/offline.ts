type OfflineState = {
  stage: "preparing" | "ready" | "error" | "unsupported" | "development";
  online: boolean;
  updateAvailable: boolean;
  updating: boolean;
  updateFailed: boolean;
};

let snapshot: OfflineState = {
  stage:
    !window.isSecureContext || !("serviceWorker" in navigator)
      ? "unsupported"
      : import.meta.env.DEV
        ? "development"
        : "preparing",
  online: navigator.onLine,
  updateAvailable: false,
  updating: false,
  updateFailed: false,
};
const listeners = new Set<() => void>();
let started = false;
let registration: ServiceWorkerRegistration | undefined;
let attempt = 0;
let checking = 0;
let registering = false;
let repairing = false;
const workerUrl = new URL(
  `${import.meta.env.BASE_URL}sw.js`,
  window.location.href,
).href;
const scopeUrl = new URL(import.meta.env.BASE_URL, window.location.href).href;

function patch(state: Partial<OfflineState>) {
  snapshot = { ...snapshot, ...state };
  listeners.forEach((listener) => listener());
}
export const getOfflineState = () => snapshot;
export function subscribeOffline(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function workerRequest(
  worker: ServiceWorker,
  type = "CHECK_OFFLINE_CACHE",
  timeoutMs = 7000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (ready: boolean) => {
      clearTimeout(timeout);
      channel.port1.close();
      resolve(ready);
    };
    const timeout = setTimeout(() => finish(false), timeoutMs);
    channel.port1.onmessage = (event) => finish(event.data?.ready === true);
    try {
      worker.postMessage({ type }, [channel.port2]);
    } catch {
      finish(false);
    }
  });
}

async function verifyCache() {
  if (repairing) return false;
  const controller = navigator.serviceWorker.controller;
  if (!controller || controller.scriptURL !== workerUrl) return false;
  const currentCheck = ++checking;
  const currentAttempt = attempt;
  const ready = await workerRequest(controller);
  if (currentCheck === checking && currentAttempt === attempt)
    patch({ stage: ready ? "ready" : "error" });
  return ready;
}

function watchWorker(
  worker: ServiceWorker,
  current: ServiceWorkerRegistration,
  token: number,
) {
  const change = () => {
    if (token !== attempt) {
      worker.removeEventListener("statechange", change);
      return;
    }
    if (worker.state === "installed" && current.waiting && current.active)
      patch({ updateAvailable: true, updateFailed: false });
    if (worker.state === "activated" || worker.state === "redundant") {
      worker.removeEventListener("statechange", change);
      if (worker.state === "redundant" && !current.active)
        patch({ stage: "error" });
      else void verifyCache();
    }
  };
  worker.addEventListener("statechange", change);
  change();
}

async function register() {
  if (registering) return;
  registering = true;
  const token = ++attempt;
  try {
    const current = await navigator.serviceWorker.register(workerUrl, {
      type: "module",
      scope: scopeUrl,
      updateViaCache: "none",
    });
    if (token !== attempt) return;
    registration = current;
    current.addEventListener("updatefound", () => {
      if (token === attempt && current.installing)
        watchWorker(current.installing, current, token);
    });
    if (current.installing) watchWorker(current.installing, current, token);
    if (current.waiting) patch({ updateAvailable: true });
    await verifyCache();
  } catch {
    // A network failure during a version check must not invalidate a working offline package.
    if (!(await verifyCache())) patch({ stage: "error" });
  } finally {
    registering = false;
  }
}

export async function retryOffline() {
  if (
    registering ||
    !snapshot.online ||
    ["development", "unsupported"].includes(snapshot.stage)
  )
    return;
  patch({
    stage: "preparing",
    updateAvailable: false,
    updating: false,
    updateFailed: false,
  });
  const controller = navigator.serviceWorker.controller;
  if (controller?.scriptURL === workerUrl) {
    registering = true;
    repairing = true;
    ++checking;
    try {
      const ready = await workerRequest(
        controller,
        "REPAIR_OFFLINE_CACHE",
        30000,
      );
      patch({ stage: ready ? "ready" : "error" });
    } finally {
      registering = false;
      repairing = false;
    }
    return;
  }
  try {
    // A failed first installation has no controlling worker; install it again.
    const current =
      registration ?? (await navigator.serviceWorker.getRegistration(scopeUrl));
    if (current) await current.unregister();
    registration = undefined;
    await register();
  } catch {
    patch({ stage: "error" });
  }
}

export function applyOfflineUpdate() {
  const waiting = registration?.waiting;
  if (!waiting || snapshot.updating) return;
  patch({ updating: true, updateFailed: false });
  waiting.postMessage({ type: "SKIP_WAITING" });
  setTimeout(() => {
    if (snapshot.updating) patch({ updating: false, updateFailed: true });
  }, 10000);
}

export function startOffline() {
  if (started || ["development", "unsupported"].includes(snapshot.stage))
    return;
  started = true;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (snapshot.updating) window.location.reload();
    else void verifyCache();
  });
  const connection = () => {
    patch({ online: navigator.onLine });
    if (snapshot.online) {
      if (snapshot.stage === "error") {
        void retryOffline();
        return;
      } else void registration?.update().catch(() => {});
    }
    void verifyCache();
  };
  window.addEventListener("online", connection);
  window.addEventListener("offline", connection);
  window.addEventListener("pageshow", () => {
    void verifyCache();
  });
  void register();
}
