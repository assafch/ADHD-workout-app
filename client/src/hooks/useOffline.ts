import { useEffect, useState } from "react";
import { flushPending, pendingCount } from "../api/sync";

export function useOffline() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refreshCount = async () => setPending(await pendingCount());
    void refreshCount();

    const onOnline = async () => {
      setOnline(true);
      await flushPending();
      await refreshCount();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const interval = window.setInterval(refreshCount, 5000);

    if (navigator.onLine) {
      void flushPending().then(refreshCount);
    }

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(interval);
    };
  }, []);

  return { online, pending, refresh: async () => setPending(await pendingCount()) };
}
