import { useEffect } from "react";

type WakeLockSentinelLike = { release: () => Promise<void> };

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> } };
    if (!nav.wakeLock) return;

    let lock: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        lock = await nav.wakeLock!.request("screen");
      } catch {
        /* user agent denied */
      }
    };

    void acquire();

    const onVis = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        void acquire();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
