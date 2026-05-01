import { dexie } from "../db/dexie";
import * as endpoints from "./endpoints";

export async function flushPending(): Promise<{ syncedSets: number; syncedSessions: number }> {
  let syncedSessions = 0;
  let syncedSets = 0;

  const pendingSessions = await dexie.pendingSessions.where("synced").equals(0).toArray();
  for (const ps of pendingSessions) {
    try {
      const { session } = await endpoints.sessions.create({
        programDayId: ps.programDayId ?? undefined,
        isBadDay: ps.isBadDay,
        clientId: ps.clientId,
      });
      await dexie.pendingSessions.update(ps.clientId, { serverId: session.id, synced: 1 });
      if (ps.status === "completed") {
        try {
          await endpoints.sessions.complete(session.id);
        } catch {
          /* ignore */
        }
      }
      syncedSessions += 1;
    } catch (e) {
      // network or auth — leave for next retry
      break;
    }
  }

  const pendingSets = await dexie.pendingSets.where("synced").equals(0).toArray();
  for (const set of pendingSets) {
    let sessionId = set.sessionId;
    if (!sessionId) {
      const ps = await dexie.pendingSessions.get(set.sessionClientId);
      if (ps?.serverId) {
        sessionId = ps.serverId;
        await dexie.pendingSets.update(set.clientId, { sessionId });
      }
    }
    if (!sessionId) continue;

    try {
      await endpoints.sets.create(sessionId, {
        exerciseId: set.exerciseId,
        programExerciseId: set.programExerciseId ?? undefined,
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        rir: set.rir ?? undefined,
        clientId: set.clientId,
        completedAt: set.completedAt,
      });
      await dexie.pendingSets.update(set.clientId, { synced: 1 });
      syncedSets += 1;
    } catch (e) {
      break;
    }
  }

  const pendingMetrics = await dexie.bodyMetrics.where("synced").equals(0).toArray();
  for (const m of pendingMetrics) {
    try {
      await endpoints.body.upsert(m.date, m.weightKg, m.notes ?? undefined);
      await dexie.bodyMetrics.update(m.clientKey, { synced: 1 });
    } catch {
      break;
    }
  }

  return { syncedSets, syncedSessions };
}

export async function pendingCount(): Promise<number> {
  const sets = await dexie.pendingSets.where("synced").equals(0).count();
  const sess = await dexie.pendingSessions.where("synced").equals(0).count();
  const body = await dexie.bodyMetrics.where("synced").equals(0).count();
  return sets + sess + body;
}
