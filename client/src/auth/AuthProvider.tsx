import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@adhd/shared";
import * as endpoints from "../api/endpoints";
import { ApiError, getToken, setToken } from "../api/client";
import { dexie } from "../db/dexie";
import i18n from "../i18n";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setLocalUser: (u: User) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyUser = useCallback(async (u: User | null) => {
    setUser(u);
    if (u) {
      await dexie.user.put({
        id: u.id,
        email: u.email,
        name: u.name,
        locale: u.locale,
        units: u.units,
        rack: u.rack,
        storedAt: new Date().toISOString(),
      });
      if (u.locale && u.locale !== i18n.language) {
        void i18n.changeLanguage(u.locale);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user } = await endpoints.auth.me();
      await applyUser(user);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setToken(null);
        setUser(null);
      } else {
        const cached = await dexie.user.toArray();
        if (cached.length > 0) {
          const c = cached[0];
          setUser({
            id: c.id,
            email: c.email,
            name: c.name,
            locale: c.locale as User["locale"],
            units: c.units as User["units"],
            heightCm: null,
            dob: null,
            programStartDate: null,
            currentProgramId: null,
            rack: c.rack,
            createdAt: c.storedAt,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [applyUser]);

  useEffect(() => {
    if (!getToken()) {
      setIsLoading(false);
      return;
    }
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await endpoints.auth.login(email, password);
    setToken(token);
    await applyUser(user);
  }, [applyUser]);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await dexie.user.clear();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    login,
    logout,
    refresh,
    setLocalUser: (u) => { void applyUser(u); },
  }), [user, isLoading, login, logout, refresh, applyUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
