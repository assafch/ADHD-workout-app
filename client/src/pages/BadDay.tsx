import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { dexie } from "../db/dexie";
import * as endpoints from "../api/endpoints";

export function BadDay() {
  const navigate = useNavigate();

  useEffect(() => {
    const start = async () => {
      const clientId = crypto.randomUUID();
      await dexie.pendingSessions.put({
        clientId,
        serverId: null,
        programDayId: null,
        isBadDay: true,
        startedAt: new Date().toISOString(),
        completedAt: null,
        status: "in_progress",
        synced: 0,
      });
      try {
        const res = await endpoints.sessions.create({ isBadDay: true, clientId });
        await dexie.pendingSessions.update(clientId, { serverId: res.session.id, synced: 1 });
        navigate(`/workout/${res.session.id}?cid=${clientId}&bad=1`, { replace: true });
      } catch {
        navigate(`/workout/offline?cid=${clientId}&bad=1`, { replace: true });
      }
    };
    void start();
  }, [navigate]);

  return null;
}
