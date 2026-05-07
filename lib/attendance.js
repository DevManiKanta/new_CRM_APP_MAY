import AsyncStorage from "@react-native-async-storage/async-storage";

function keyForUser(username) {
  const safe = typeof username === "string" && username.trim() ? username.trim() : "unknown";
  return `attendance:punches:${safe}`;
}

export async function getPunches(username) {
  const raw = await AsyncStorage.getItem(keyForUser(username));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addPunch(username, isoString) {
  const punches = await getPunches(username);
  const next = [{ at: isoString }, ...punches].slice(0, 250);
  await AsyncStorage.setItem(keyForUser(username), JSON.stringify(next));
  return next;
}

export function formatLongDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date) {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function monthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function countWorkdaysInMonth(date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (!isWeekend(cursor)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function summarizeForMonth({ punches, monthDate, lateAfterHour = 10 }) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  const dayMap = new Map(); // yyyy-mm-dd => first punch Date
  for (const p of punches) {
    const at = new Date(p?.at);
    if (Number.isNaN(at.getTime())) continue;
    if (at < start || at > end) continue;
    const key = at.toISOString().slice(0, 10);
    const existing = dayMap.get(key);
    if (!existing || at < existing) dayMap.set(key, at);
  }

  const present = dayMap.size;
  let late = 0;
  for (const d of dayMap.values()) {
    if (d.getHours() >= lateAfterHour) late += 1;
  }

  // These are placeholders until you connect a backend policy/calendar:
  const holidays = 2;
  const leaves = 1;
  const halfDays = 1;

  const workdays = countWorkdaysInMonth(monthDate);
  const absent = Math.max(0, workdays - present - holidays - leaves);

  return {
    present,
    absent,
    late,
    holidays,
    leaves,
    halfDays,
    workdays,
    uniqueDays: Array.from(dayMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([day, firstPunch]) => ({ day, firstPunch: firstPunch.toISOString() })),
  };
}

