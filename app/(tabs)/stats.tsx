import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useCustomers } from "@/context/CustomerContext";
import { STATUS_CONFIG, CustomerStatus } from "@/data/customers";
import ProfileMenu from "@/components/ProfileMenu";

interface StatCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number;
  index: number;
}

function StatCard({ icon, iconColor, iconBg, label, value, index }: StatCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400).springify()}
      style={styles.statCard}
    >
      <View style={[styles.statIconBox, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

interface CallLogItemProps {
  customerName: string;
  status: CustomerStatus;
  timestamp: string;
  index: number;
}

function CallLogItem({ customerName, status, timestamp, index }: CallLogItemProps) {
  const config = STATUS_CONFIG[status];
  const time = new Date(timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(300)}
      style={styles.logItem}
    >
      <View style={[styles.logDot, { backgroundColor: config.color }]} />
      <View style={styles.logInfo}>
        <Text style={styles.logName}>{customerName}</Text>
        <View style={[styles.logBadge, { backgroundColor: config.bg }]}>
          <Feather name={config.icon as any} size={10} color={config.color} />
          <Text style={[styles.logBadgeText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>
      <Text style={styles.logTime}>{timeStr}</Text>
    </Animated.View>
  );
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { getTodayStats, getCallLogsByDate, customers } = useCustomers();

  const stats = getTodayStats();
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = getCallLogsByDate(today);

  const totalCustomers = customers.length;
  const activeCount = customers.filter((c) => c.tab === "active").length;
  const followCount = customers.filter((c) => c.tab === "follow_later").length;
  const completedCount = customers.filter((c) => c.tab === "completed").length;

  const dateLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, []);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <View>
          <Text style={styles.title}>Statistics</Text>
          <Text style={styles.dateText}>{dateLabel}</Text>
        </View>
        <ProfileMenu />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.light.accent }]}>{stats.totalCalls}</Text>
              <Text style={styles.summaryLabel}>Calls Today</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.light.warning }]}>{stats.pending}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.light.success }]}>{stats.completed}</Text>
              <Text style={styles.summaryLabel}>Closed</Text>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Today's Call Breakdown</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="phone-call"
            iconColor={Colors.light.accent}
            iconBg={Colors.light.accentLight}
            label="Attempted"
            value={stats.attempted}
            index={0}
          />
          <StatCard
            icon="phone-missed"
            iconColor={Colors.light.danger}
            iconBg={Colors.light.dangerLight}
            label="Not Responded"
            value={stats.notResponded}
            index={1}
          />
          <StatCard
            icon="clock"
            iconColor={Colors.light.warning}
            iconBg={Colors.light.warningLight}
            label="Busy"
            value={stats.busy}
            index={2}
          />
          <StatCard
            icon="phone"
            iconColor={Colors.light.accent}
            iconBg={Colors.light.accentLight}
            label="Picked Call"
            value={stats.pickedCall}
            index={3}
          />
          <StatCard
            icon="calendar"
            iconColor={Colors.light.purple}
            iconBg={Colors.light.purpleLight}
            label="Asked Time"
            value={stats.askedTime}
            index={4}
          />
          <StatCard
            icon="star"
            iconColor={Colors.light.success}
            iconBg={Colors.light.successLight}
            label="Interested"
            value={stats.interested}
            index={5}
          />
        </View>

        <Text style={styles.sectionTitle}>Overall Pipeline</Text>
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.pipelineCard}>
          <View style={styles.pipelineRow}>
            <View style={styles.pipelineItem}>
              <View style={[styles.pipelineDot, { backgroundColor: Colors.light.accent }]} />
              <Text style={styles.pipelineLabel}>Active</Text>
            </View>
            <Text style={styles.pipelineValue}>{activeCount}</Text>
          </View>
          <View style={styles.pipelineDivider} />
          <View style={styles.pipelineRow}>
            <View style={styles.pipelineItem}>
              <View style={[styles.pipelineDot, { backgroundColor: Colors.light.purple }]} />
              <Text style={styles.pipelineLabel}>Follow Later</Text>
            </View>
            <Text style={styles.pipelineValue}>{followCount}</Text>
          </View>
          <View style={styles.pipelineDivider} />
          <View style={styles.pipelineRow}>
            <View style={styles.pipelineItem}>
              <View style={[styles.pipelineDot, { backgroundColor: Colors.light.success }]} />
              <Text style={styles.pipelineLabel}>Completed</Text>
            </View>
            <Text style={styles.pipelineValue}>{completedCount}</Text>
          </View>
          <View style={styles.pipelineDivider} />
          <View style={styles.pipelineRow}>
            <View style={styles.pipelineItem}>
              <View style={[styles.pipelineDot, { backgroundColor: Colors.light.text }]} />
              <Text style={[styles.pipelineLabel, { fontWeight: "700" as const }]}>Total</Text>
            </View>
            <Text style={[styles.pipelineValue, { fontWeight: "800" as const }]}>{totalCustomers}</Text>
          </View>
        </Animated.View>

        {todayLogs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.activityCard}>
              {todayLogs.map((log, idx) => (
                <React.Fragment key={log.id}>
                  <CallLogItem
                    customerName={log.customerName}
                    status={log.status}
                    timestamp={log.timestamp}
                    index={idx}
                  />
                  {idx < todayLogs.length - 1 && <View style={styles.activityDivider} />}
                </React.Fragment>
              ))}
            </Animated.View>
          </>
        )}

        {todayLogs.length === 0 && (
          <Animated.View entering={FadeIn.delay(600).duration(400)} style={styles.emptyActivity}>
            <View style={styles.emptyIcon}>
              <Feather name="phone-off" size={28} color={Colors.light.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No calls yet today</Text>
            <Text style={styles.emptySubtitle}>
              Call activity will show up here as you contact customers
            </Text>
          </Animated.View>
        )}
      </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  dateText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "800" as const,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontWeight: "500" as const,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.divider,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 0,
    marginBottom: 20,
  },
  statCard: {
    width: "30%",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    marginHorizontal: "1.5%",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 2,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  pipelineCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  pipelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  pipelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pipelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pipelineLabel: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  pipelineValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  pipelineDivider: {
    height: 1,
    backgroundColor: Colors.light.divider,
  },
  activityCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logInfo: {
    flex: 1,
    gap: 4,
  },
  logName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  logBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  logBadgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
  },
  logTime: {
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  activityDivider: {
    height: 1,
    backgroundColor: Colors.light.divider,
  },
  emptyActivity: {
    alignItems: "center",
    padding: 32,
    marginHorizontal: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});
