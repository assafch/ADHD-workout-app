interface DayDefinition {
  dayOfWeek: number;
  isRestDay: boolean;
  isCardioDay: boolean;
}

interface SessionDay {
  startedAt: Date;
  status: string;
  isBadDay: boolean;
}

export function jerusalemDayOfWeek(date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
  });
  const day = formatter.format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[day] ?? 0;
}

export function jerusalemDateString(date: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(date);
}

export function computeStreak(
  sessions: SessionDay[],
  programDays: DayDefinition[],
  today: Date,
): { currentStreakDays: number; longestStreakDays: number } {
  const planMap = new Map<number, DayDefinition>();
  for (const d of programDays) planMap.set(d.dayOfWeek, d);

  const sessionDateSet = new Set<string>();
  for (const s of sessions) {
    if (s.status === "completed" || s.isBadDay) {
      sessionDateSet.add(jerusalemDateString(s.startedAt));
    }
  }

  let current = 0;
  let longest = 0;
  let pointer = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = jerusalemDateString(pointer);
    const dow = jerusalemDayOfWeek(pointer);
    const plan = planMap.get(dow);
    const isPlannedTrainingDay = plan && !plan.isRestDay && !plan.isCardioDay;

    if (!isPlannedTrainingDay) {
      pointer = new Date(pointer.getTime() - 24 * 3600 * 1000);
      continue;
    }

    if (sessionDateSet.has(dateStr)) {
      current += 1;
      longest = Math.max(longest, current);
      pointer = new Date(pointer.getTime() - 24 * 3600 * 1000);
    } else if (i === 0) {
      pointer = new Date(pointer.getTime() - 24 * 3600 * 1000);
      continue;
    } else {
      break;
    }
  }

  return { currentStreakDays: current, longestStreakDays: longest };
}

export function weekProgress(
  sessions: SessionDay[],
  programDays: DayDefinition[],
  today: Date,
): { weekDaysDone: number; weekDaysPlanned: number } {
  const planMap = new Map<number, DayDefinition>();
  for (const d of programDays) planMap.set(d.dayOfWeek, d);

  const todayDow = jerusalemDayOfWeek(today);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - todayDow);

  const sessionDateSet = new Set<string>();
  for (const s of sessions) {
    if (s.status === "completed" || s.isBadDay) {
      sessionDateSet.add(jerusalemDateString(s.startedAt));
    }
  }

  let planned = 0;
  let done = 0;
  for (let dow = 0; dow <= todayDow; dow++) {
    const plan = planMap.get(dow);
    if (!plan || plan.isRestDay || plan.isCardioDay) continue;
    planned += 1;
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dow);
    if (sessionDateSet.has(jerusalemDateString(dayDate))) done += 1;
  }
  for (let dow = todayDow + 1; dow < 7; dow++) {
    const plan = planMap.get(dow);
    if (!plan || plan.isRestDay || plan.isCardioDay) continue;
    planned += 1;
  }

  return { weekDaysDone: done, weekDaysPlanned: planned };
}
