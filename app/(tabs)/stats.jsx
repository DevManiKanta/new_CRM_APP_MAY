import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useCustomers } from "@/context/CustomerContext";
import { useDrawer } from "@/context/DrawerContext";
import { STATUS_CONFIG } from "@/data/customers";
import ProfileMenu from "@/components/ProfileMenu";
import DrawerButton from "@/components/DrawerButton";

const INCENTIVE_TIERS = [
  { min: 0, max: 1000, incentive: 100, label: "₹0 – ₹1,000" },
  { min: 1001, max: 2500, incentive: 250, label: "₹1,001 – ₹2,500" },
  { min: 2501, max: 5000, incentive: 500, label: "₹2,501 – ₹5,000" },
  { min: 5001, max: 10000, incentive: 1000, label: "₹5,001 – ₹10,000" },
  { min: 10001, max: Infinity, incentive: 2000, label: "₹10,001 +" },
];

function tierForAmount(amount) {
  return INCENTIVE_TIERS.find((t) => amount >= t.min && amount <= t.max) || INCENTIVE_TIERS[0];
}

function formatINR(n) {
  const safe = Number.isFinite(n) ? n : 0;
  return `₹${safe.toLocaleString("en-IN")}`;
}

function StatCard({ icon, iconColor, iconBg, label, value, index }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400).springify()}
      style={styles.statCard}
    >
      <View style={[styles.statIconBox, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function CallLogItem({ customerName, status, timestamp, index }) {
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
          <Feather name={config.icon} size={10} color={config.color} />
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
  const { openDrawer } = useDrawer();

  const stats = getTodayStats();
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = getCallLogsByDate(today);

  const completedOrders = useMemo(
    () => customers.filter((c) => c.tab === "completed"),
    [customers]
  );

  const orderSummary = useMemo(() => {
    const tierCounts = INCENTIVE_TIERS.map((t) => ({ ...t, count: 0, earned: 0 }));
    let totalSales = 0;
    let totalIncentives = 0;

    for (const c of completedOrders) {
      const amount = Number(c.totalPayment) || 0;
      totalSales += amount;
      const tier = tierForAmount(amount);
      const idx = INCENTIVE_TIERS.findIndex((t) => t === tier);
      if (idx >= 0) {
        tierCounts[idx].count += 1;
        tierCounts[idx].earned += tier.incentive;
        totalIncentives += tier.incentive;
      }
    }

    const ordersCompleted = completedOrders.length;
    const avgBill = ordersCompleted > 0 ? Math.round(totalSales / ordersCompleted) : 0;

    return { tierCounts, totalSales, totalIncentives, ordersCompleted, avgBill };
  }, [completedOrders]);

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
        <DrawerButton onPress={openDrawer} />
        <View style={styles.headerCenter}>
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

        <Text style={styles.sectionTitle}>Orders & Incentives</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="shopping-bag"
            iconColor={Colors.light.accent}
            iconBg={Colors.light.accentLight}
            label="Orders Completed"
            value={orderSummary.ordersCompleted}
            index={0}
          />
          <StatCard
            icon="trending-up"
            iconColor={Colors.light.success}
            iconBg={Colors.light.successLight}
            label="Total Sales"
            value={formatINR(orderSummary.totalSales)}
            index={1}
          />
          <StatCard
            icon="award"
            iconColor={Colors.light.purple}
            iconBg={Colors.light.purpleLight}
            label="Incentives"
            value={formatINR(orderSummary.totalIncentives)}
            index={2}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.incentiveCard}>
          <View style={styles.incentiveHeader}>
            <View>
              <Text style={styles.incentiveTitle}>Incentive Breakdown</Text>
              <Text style={styles.incentiveSubtitle}>
                Avg bill {formatINR(orderSummary.avgBill)} • {orderSummary.ordersCompleted} orders
              </Text>
            </View>
            <View style={styles.incentiveBadge}>
              <Feather name="award" size={14} color={Colors.light.purple} />
              <Text style={styles.incentiveBadgeText}>{formatINR(orderSummary.totalIncentives)}</Text>
            </View>
          </View>

          <View style={styles.tierHeaderRow}>
            <Text style={[styles.tierHeaderText, { flex: 2 }]}>BILL RANGE</Text>
            <Text style={[styles.tierHeaderText, styles.tierAlignRight, { flex: 1 }]}>RATE</Text>
            <Text style={[styles.tierHeaderText, styles.tierAlignRight, { flex: 1 }]}>ORDERS</Text>
            <Text style={[styles.tierHeaderText, styles.tierAlignRight, { flex: 1.2 }]}>EARNED</Text>
          </View>

          {orderSummary.tierCounts.map((tier) => (
            <View key={tier.label} style={styles.tierRow}>
              <View style={[styles.tierLabelWrap, { flex: 2 }]}>
                <View style={styles.tierDot} />
                <Text style={styles.tierLabel}>{tier.label}</Text>
              </View>
              <Text style={[styles.tierRate, styles.tierAlignRight, { flex: 1 }]}>
                {formatINR(tier.incentive)}
              </Text>
              <Text style={[styles.tierCount, styles.tierAlignRight, { flex: 1 }]}>
                {tier.count}
              </Text>
              <Text
                style={[
                  styles.tierEarned,
                  styles.tierAlignRight,
                  { flex: 1.2, color: tier.earned > 0 ? Colors.light.success : Colors.light.textTertiary },
                ]}
              >
                {formatINR(tier.earned)}
              </Text>
            </View>
          ))}

          <View style={styles.tierTotalRow}>
            <Text style={styles.tierTotalLabel}>Total Incentive</Text>
            <Text style={styles.tierTotalValue}>{formatINR(orderSummary.totalIncentives)}</Text>
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
    gap: 12,
  },
  headerCenter: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
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
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontWeight: "500",
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.divider,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
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
    fontWeight: "800",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 2,
    textAlign: "center",
    fontWeight: "500",
  },
  incentiveCard: {
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
  incentiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  incentiveTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
  },
  incentiveSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontWeight: "600",
  },
  incentiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.purpleLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  incentiveBadgeText: {
    color: Colors.light.purple,
    fontSize: 12,
    fontWeight: "800",
  },
  tierHeaderRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  tierHeaderText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.light.textTertiary,
    letterSpacing: 0.5,
  },
  tierAlignRight: {
    textAlign: "right",
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  tierLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.accent,
  },
  tierLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
  },
  tierRate: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  tierCount: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
  },
  tierEarned: {
    fontSize: 13,
    fontWeight: "800",
  },
  tierTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
  },
  tierTotalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.light.text,
  },
  tierTotalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.light.success,
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
    fontWeight: "600",
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
    fontWeight: "600",
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
    fontWeight: "600",
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
