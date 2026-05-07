import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import DrawerButton from "@/components/DrawerButton";
import ProfileMenu from "@/components/ProfileMenu";
import { useDrawer } from "@/context/DrawerContext";
import { useAuth } from "@/context/AuthContext";
import { addPunch, formatLongDate, formatTime, getPunches } from "@/lib/attendance";

function PunchRow({ item }) {
  const d = new Date(item.at);
  const time = Number.isNaN(d.getTime()) ? "--:--" : formatTime(d);
  const date = Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });

  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Feather name="clock" size={16} color={Colors.light.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{time}</Text>
        <Text style={styles.rowSub}>{date}</Text>
      </View>
      <Text style={styles.rowTag}>PUNCH IN</Text>
    </View>
  );
}

export default function PunchScreen() {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { user } = useAuth();
  const username = user?.username || "User";

  const [isSaving, setIsSaving] = useState(false);
  const [punches, setPunches] = useState([]);

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

  const now = useMemo(() => new Date(), []);
  const todayLabel = useMemo(() => formatLongDate(new Date()), []);
  const lastPunch = punches?.[0]?.at ? new Date(punches[0].at) : null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayPunch = useMemo(
    () => punches.find((p) => typeof p?.at === "string" && p.at.slice(0, 10) === todayKey),
    [punches, todayKey]
  );
  const hasPunchedToday = !!todayPunch;
  const isDisabled = isSaving || hasPunchedToday;

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const handlePunch = async () => {
    if (isDisabled) return;
    setIsSaving(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const iso = new Date().toISOString();
      const next = await addPunch(username, iso);
      setPunches(next);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <Animated.View entering={FadeInDown.duration(250)} style={styles.header}>
        <DrawerButton onPress={openDrawer} />
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Punch In</Text>
          <Text style={styles.subtitle}>Welcome, {username}</Text>
        </View>
        <ProfileMenu />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(50).duration(300)} style={styles.heroWrap}>
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#334155"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.datePill}>
              <Feather name="calendar" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.dateText}>{todayLabel}</Text>
            </View>
            <View style={styles.badgePill}>
              <Feather name="shield" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.badgeText}>Secure time log</Text>
            </View>
          </View>

          <View style={styles.heroMid}>
            <Text style={styles.bigTime}>
              {formatTime(now)}
            </Text>
            <Text style={styles.bigTimeSub}>
              {hasPunchedToday
                ? "You're all set for today"
                : "Tap below to record your punch"}
            </Text>
          </View>

          <Pressable
            onPress={handlePunch}
            disabled={isDisabled}
            accessibilityState={{ disabled: isDisabled }}
            style={({ pressed }) => [
              styles.punchBtn,
              pressed && !isDisabled && styles.punchBtnPressed,
              isDisabled && styles.punchBtnDisabled,
            ]}
          >
            <LinearGradient
              colors={
                hasPunchedToday
                  ? ["#10B981", "#059669"]
                  : isSaving
                  ? ["#64748B", "#475569"]
                  : ["#3B82F6", "#8B5CF6"]
              }
              style={styles.punchBtnGrad}
            >
              <Feather
                name={hasPunchedToday ? "check-circle" : "check"}
                size={18}
                color="#fff"
              />
              <Text style={styles.punchBtnText}>
                {hasPunchedToday
                  ? `Punched In • ${formatTime(new Date(todayPunch.at))}`
                  : isSaving
                  ? "Saving..."
                  : "Punch In Now"}
              </Text>
            </LinearGradient>
          </Pressable>

          {hasPunchedToday ? (
            <Text style={styles.helperText}>
              Already punched in today. Button is locked until tomorrow.
            </Text>
          ) : null}

          <View style={styles.heroBottom}>
            <Text style={styles.lastLabel}>Last punch</Text>
            <Text style={styles.lastValue}>
              {lastPunch && !Number.isNaN(lastPunch.getTime()) ? `${formatTime(lastPunch)} • Today` : "No punches yet"}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>RECENT PUNCHES</Text>
        <Text style={styles.sectionMeta}>{punches.length} total</Text>
      </View>

      <FlatList
        data={punches}
        keyExtractor={(item, idx) => `${item.at}-${idx}`}
        renderItem={({ item }) => (
          <Animated.View layout={Layout.springify()}>
            <PunchRow item={item} />
          </Animated.View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
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
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  heroWrap: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  hero: {
    borderRadius: 22,
    padding: 18,
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  dateText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    fontWeight: "600",
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  badgeText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    fontWeight: "600",
  },
  heroMid: {
    paddingTop: 18,
    paddingBottom: 14,
    alignItems: "center",
  },
  bigTime: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  bigTimeSub: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600",
  },
  punchBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 6,
  },
  punchBtnGrad: {
    height: 54,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  punchBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  punchBtnPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  punchBtnDisabled: {
    opacity: 0.85,
  },
  helperText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
  heroBottom: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  lastLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  lastValue: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
  },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.light.textSecondary,
    letterSpacing: 0.6,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textTertiary,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.accentLight,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontWeight: "600",
  },
  rowTag: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.light.success,
    backgroundColor: Colors.light.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
});

