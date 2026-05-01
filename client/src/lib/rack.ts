export function nextInRack(weightKg: number, rack: number[]): number {
  const sorted = [...rack].sort((a, b) => a - b);
  const next = sorted.find((w) => w > weightKg);
  return next ?? sorted[sorted.length - 1];
}

export function prevInRack(weightKg: number, rack: number[]): number {
  const sorted = [...rack].sort((a, b) => a - b);
  const prev = [...sorted].reverse().find((w) => w < weightKg);
  return prev ?? sorted[0];
}

export function roundToRack(
  weightKg: number,
  rack: number[],
  direction: "nearest" | "up" | "down" = "nearest",
): number {
  const sorted = [...rack].sort((a, b) => a - b);
  if (sorted.length === 0) return weightKg;
  if (weightKg <= sorted[0]) return sorted[0];
  if (weightKg >= sorted[sorted.length - 1]) return sorted[sorted.length - 1];
  if (direction === "up") return sorted.find((w) => w >= weightKg) ?? sorted[sorted.length - 1];
  if (direction === "down") return [...sorted].reverse().find((w) => w <= weightKg) ?? sorted[0];
  return sorted.reduce((p, c) => (Math.abs(c - weightKg) < Math.abs(p - weightKg) ? c : p));
}
