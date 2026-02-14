import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useCustomers } from "@/context/CustomerContext";
import CustomerCard from "@/components/CustomerCard";
import { CustomerListSkeleton } from "@/components/SkeletonLoader";
import EmptyState from "@/components/EmptyState";

export default function CompletedScreen() {
  const insets = useSafeAreaInsets();
  const { getCustomersByTab } = useCustomers();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const customers = getCustomersByTab("completed");

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalPayment, 0);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <View>
          <Text style={styles.title}>Completed</Text>
          <Text style={styles.count}>{customers.length} deals closed</Text>
        </View>
        <View style={styles.headerIcon}>
          <Feather name="check-circle" size={20} color={Colors.light.success} />
        </View>
      </Animated.View>

      {customers.length > 0 && (
        <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{customers.length}</Text>
            <Text style={styles.statLabel}>Deals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              ${totalRevenue.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {customers.reduce((sum, c) => sum + c.totalItems, 0)}
            </Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
        </Animated.View>
      )}

      {isLoading ? (
        <CustomerListSkeleton count={3} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon="award"
          title="No completed deals yet"
          subtitle="Customers marked as Completed will appear here with success indicators."
        />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <CustomerCard customer={item} index={index} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        />
      )}
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
  count: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.light.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.success,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.divider,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 100,
  },
});
