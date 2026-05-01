import { useEffect, useState } from "react";
import type { TodayResponse } from "@adhd/shared";
import * as endpoints from "../api/endpoints";
import { dexie } from "../db/dexie";

const CACHE_KEY = "today";

export function useTodayWorkout() {
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const cached = await dexie.cache_today.get(CACHE_KEY);
      if (cached && !cancelled) {
        setToday(cached.data);
        setIsLoading(false);
      }

      try {
        const fresh = await endpoints.today.get();
        if (cancelled) return;
        setToday(fresh);
        setError(null);
        await dexie.cache_today.put({ key: CACHE_KEY, data: fresh, storedAt: new Date().toISOString() });
      } catch (e) {
        if (cancelled) return;
        if (!cached) setError(e as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    try {
      const fresh = await endpoints.today.get();
      setToday(fresh);
      await dexie.cache_today.put({ key: CACHE_KEY, data: fresh, storedAt: new Date().toISOString() });
    } catch (e) {
      setError(e as Error);
    }
  };

  return { today, isLoading, error, refresh };
}
