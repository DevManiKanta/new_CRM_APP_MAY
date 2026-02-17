import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useCustomers } from "@/context/CustomerContext";
import { useDrawer } from "@/context/DrawerContext";
import CustomerCard from "@/components/CustomerCard";
import { CustomerListSkeleton } from "@/components/SkeletonLoader";
import EmptyState from "@/components/EmptyState";
import ProfileMenu from "@/components/ProfileMenu";
import DrawerButton from "@/components/DrawerButton";

export default function CompletedScreen() {
  const insets = useSafeAreaInsets();
  const { getCustomersByTab, searchCustomers } = useCustomers();
  const { openDrawer } = useDrawer();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const customers = searchQuery
    ? searchCustomers(searchQuery, "completed")
    : getCustomersByTab("completed");

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalPayment, 0);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <DrawerButton onPress={openDrawer} />
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Completed</Text>
          <Text style={styles.count}>{customers.length} deals closed</Text>
        </View>
        <ProfileMenu />
      </Animated.View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={Colors.light.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search completed deals..."
            placeholderTextColor={Colors.light.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={16} color={Colors.light.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

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
          subtitle={searchQuery ? "Try a different search term" : "Customers marked as Completed will appear here with success indicators."}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
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
