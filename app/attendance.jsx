import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Platform, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import Colors from "@/constants/colors";
import DrawerButton from "@/components/DrawerButton";
import ProfileMenu from "@/components/ProfileMenu";
import { useDrawer } from "@/context/DrawerContext";
import { useAuth } from "@/context/AuthContext";
import {
  endOfMonth,
  getPunches,
  startOfMonth,
  summarizeForMonth,
} from "@/lib/attendance";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LATE_AFTER_HOUR = 10;

function MetricCard({ icon, label, value, tint, bg }) {
  return (
    <View style={[styles.metricCard, { borderColor: bg }]}>
      <View style={[styles.metricIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={18} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{String(value)}</Text>
      </View>
    </View>
  );
}

function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildMonthGrid(monthDate) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const startWeekday = start.getDay();
  const daysInMonth = end.getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ key: `pad-start-${i}`, empty: true });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
    cells.push({ key: dayKey(date), empty: false, date });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ key: `pad-end-${cells.length}`, empty: true });
  }
  return cells;
}

function MonthCalendar({ monthDate, presentMap }) {
  const cells = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const today = new Date();
  const todayKey = dayKey(today);
  const monthLabel = monthDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <View>
          <Text style={styles.calendarTitle}>{monthLabel}</Text>
          <Text style={styles.calendarSubtitle}>This month at a glance</Text>
        </View>
        <View style={styles.calendarBadge}>
          <Feather name="calendar" size={14} color={Colors.light.accent} />
          <Text style={styles.calendarBadgeText}>
            {monthDate.toLocaleDateString(undefined, { month: "short" })}
          </Text>
        </View>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <View key={w} style={styles.weekCell}>
            <Text
              style={[
                styles.weekText,
                (w === "Sun" || w === "Sat") && styles.weekTextWeekend,
              ]}
            >
              {w}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.gridRow}>
        {cells.map((cell) => {
          if (cell.empty) {
            return <View key={cell.key} style={styles.dayCell} />;
          }
          const isToday = cell.key === todayKey;
          const isFuture = cell.date > today && !isToday;
          const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
          const punchInfo = presentMap.get(cell.key);
          const isPresent = !!punchInfo;
          const isLate = isPresent && punchInfo.late;

          let bg = "transparent";
          let color = Colors.light.text;
          let borderColor = "transparent";

          if (isPresent && !isLate) {
            bg = Colors.light.successLight;
            color = Colors.light.success;
          } else if (isPresent && isLate) {
            bg = Colors.light.warningLight;
            color = Colors.light.warning;
          } else if (isWeekend && !isPresent) {
            color = Colors.light.textTertiary;
          } else if (isFuture) {
            color = Colors.light.textTertiary;
          }

          if (isToday) {
            borderColor = Colors.light.accent;
          }

          return (
            <View key={cell.key} style={styles.dayCell}>
              <View
                style={[
                  styles.dayPill,
                  { backgroundColor: bg, borderColor, borderWidth: isToday ? 2 : 0 },
                ]}
              >
                <Text style={[styles.dayNum, { color }]}>{cell.date.getDate()}</Text>
                {isPresent ? (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isLate ? Colors.light.warning : Colors.light.success },
                    ]}
                  />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: Colors.light.successLight }]}>
            <View style={[styles.dot, { backgroundColor: Colors.light.success }]} />
          </View>
          <Text style={styles.legendText}>Present</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: Colors.light.warningLight }]}>
            <View style={[styles.dot, { backgroundColor: Colors.light.warning }]} />
          </View>
          <Text style={styles.legendText}>Late</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendSwatch,
              { borderWidth: 2, borderColor: Colors.light.accent, backgroundColor: "transparent" },
            ]}
          />
          <Text style={styles.legendText}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: "transparent" }]}>
            <Text style={[styles.legendDim, { color: Colors.light.textTertiary }]}>•</Text>
          </View>
          <Text style={styles.legendText}>Weekend</Text>
        </View>
      </View>
    </View>
  );
}

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { user } = useAuth();
  const username = user?.username || "User";

  const [punches, setPunches] = useState([]);
  const monthDate = useMemo(() => new Date(), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await getPunches(username);
      if (alive) setPunches(list);
    })();
    return () => {
      alive = false;
    };
  }, [username]);

  const summary = useMemo(
    () => summarizeForMonth({ punches, monthDate, lateAfterHour: LATE_AFTER_HOUR }),
    [punches, monthDate]
  );

  const presentMap = useMemo(() => {
    const map = new Map();
    for (const d of summary.uniqueDays) {
      const dt = new Date(d.firstPunch);
      const late = !Number.isNaN(dt.getTime()) && dt.getHours() >= LATE_AFTER_HOUR;
      map.set(d.day, { firstPunch: d.firstPunch, late });
    }
    return map;
  }, [summary.uniqueDays]);

  const monthLabel = monthDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const ListHeader = (
    <View>
      <Animated.View entering={FadeInUp.delay(50).duration(300)} style={styles.heroWrap}>
        <LinearGradient
          colors={["#3B82F6", "#8B5CF6", "#0EA5E9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>This month summary</Text>
            <Text style={styles.heroSub}>
              Workdays {summary.workdays} • Logged days {summary.present}
            </Text>
          </View>
          <View style={styles.heroChip}>
            <Feather name="check-circle" size={16} color="#fff" />
            <Text style={styles.heroChipText}>{summary.present} Present</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.grid}>
        <MetricCard
          icon="check"
          label="Present"
          value={summary.present}
          tint={Colors.light.success}
          bg={Colors.light.successLight}
        />
        <MetricCard
          icon="x"
          label="Absent"
          value={summary.absent}
          tint={Colors.light.danger}
          bg={Colors.light.dangerLight}
        />
        <MetricCard
          icon="alert-circle"
          label="Late punches"
          value={summary.late}
          tint={Colors.light.warning}
          bg={Colors.light.warningLight}
        />
        <MetricCard
          icon="sun"
          label="Holidays"
          value={summary.holidays}
          tint={Colors.light.purple}
          bg={Colors.light.purpleLight}
        />
        <MetricCard
          icon="briefcase"
          label="Leaves"
          value={summary.leaves}
          tint={Colors.light.accent}
          bg={Colors.light.accentLight}
        />
        <MetricCard
          icon="divide-circle"
          label="Half days"
          value={summary.halfDays}
          tint={Colors.light.text}
          bg={Colors.light.cardBorder}
        />
      </View>

      <View style={styles.calendarWrap}>
        <MonthCalendar monthDate={monthDate} presentMap={presentMap} />
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>LOGGED DAYS</Text>
        <Text style={styles.sectionMeta}>First punch each day</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <Animated.View entering={FadeInDown.duration(250)} style={styles.header}>
        <DrawerButton onPress={openDrawer} />
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Attendance</Text>
          <Text style={styles.subtitle}>
            {username} • {monthLabel}
          </Text>
        </View>
        <ProfileMenu />
      </Animated.View>

      <FlatList
        data={summary.uniqueDays}
        keyExtractor={(item) => item.day}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const d = new Date(item.firstPunch);
          const time = Number.isNaN(d.getTime())
            ? "--:--"
            : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
          const prettyDay = item.day;
          return (
            <View style={styles.dayRow}>
              <View style={styles.dayIcon}>
                <Feather name="calendar" size={16} color={Colors.light.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayTitle}>{prettyDay}</Text>
                <Text style={styles.daySub}>First punch: {time}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>PRESENT</Text>
              </View>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  headerCenter: { flex: 1 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.light.text },
  subtitle: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  heroWrap: { paddingHorizontal: 20, paddingTop: 6 },
  hero: {
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  heroTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  heroSub: { color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: "700", marginTop: 6 },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  heroChipText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  grid: {
    paddingHorizontal: 20,
    paddingTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: { fontSize: 12, fontWeight: "700", color: Colors.light.textSecondary },
  metricValue: { fontSize: 22, fontWeight: "900", color: Colors.light.text, marginTop: 6 },

  calendarWrap: { paddingHorizontal: 20, paddingTop: 18 },
  calendarCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.text,
  },
  calendarSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontWeight: "600",
  },
  calendarBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.light.accentLight,
  },
  calendarBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.light.accent,
    letterSpacing: 0.4,
  },
  weekRow: {
    flexDirection: "row",
    paddingBottom: 6,
  },
  weekCell: {
    flex: 1,
    alignItems: "center",
  },
  weekText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
  },
  weekTextWeekend: {
    color: Colors.light.textTertiary,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },
  dayPill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: {
    fontSize: 13,
    fontWeight: "700",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  legendDim: {
    fontSize: 14,
    fontWeight: "900",
  },
  legendText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },

  sectionHead: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.light.textSecondary,
    letterSpacing: 0.6,
  },
  sectionMeta: { fontSize: 12, fontWeight: "700", color: Colors.light.textTertiary },
  list: { paddingBottom: 24 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  dayIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.purpleLight,
  },
  dayTitle: { fontSize: 15, fontWeight: "800", color: Colors.light.text },
  daySub: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2, fontWeight: "600" },
  statusPill: {
    backgroundColor: Colors.light.successLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    color: Colors.light.success,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
});
