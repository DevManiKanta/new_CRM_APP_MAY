import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useCustomers } from "@/context/CustomerContext";
import { useDrawer } from "@/context/DrawerContext";
import { CustomerStatus } from "@/data/customers";
import CustomerCard from "@/components/CustomerCard";
import SearchFilter from "@/components/SearchFilter";
import { CustomerListSkeleton } from "@/components/SkeletonLoader";
import EmptyState from "@/components/EmptyState";
import ProfileMenu from "@/components/ProfileMenu";
import DrawerButton from "@/components/DrawerButton";

const activeStatuses: CustomerStatus[] = ["not_responded", "busy", "picked_call"];

export default function ActiveCustomersScreen() {
  const insets = useSafeAreaInsets();
  const { getCustomersByTab, searchCustomers, filterByStatus } = useCustomers();
  const { openDrawer } = useDrawer();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const customers = (() => {
    let result = getCustomersByTab("active");
    if (searchQuery) {
      result = searchCustomers(searchQuery, "active");
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    return result;
  })();

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <DrawerButton onPress={openDrawer} />
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Active Customers</Text>
          <Text style={styles.count}>{customers.length} contacts</Text>
        </View>
        <ProfileMenu />
      </Animated.View>

      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        statusOptions={activeStatuses}
      />

      {isLoading ? (
        <CustomerListSkeleton count={5} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No active customers"
          subtitle={searchQuery ? "Try a different search term" : "All caught up! No customers need follow-up."}
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
    gap: 12,
  },
  headerCenter: {
    flex: 1,
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
  list: {
    paddingTop: 8,
    paddingBottom: 100,
  },
});
