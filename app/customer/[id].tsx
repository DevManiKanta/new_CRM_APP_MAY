import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useCustomers } from "@/context/CustomerContext";
import StatusBadge from "@/components/StatusBadge";
import StatusUpdateModal from "@/components/StatusUpdateModal";
import { CustomerStatus, PurchasedItem } from "@/data/customers";

type SortBy = "date" | "price_asc" | "price_desc";

function ItemCard({ item, index }: { item: PurchasedItem; index: number }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={animStyle}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <View style={styles.itemCard}>
          <View style={styles.itemLeft}>
            <View style={[styles.itemIcon, { backgroundColor: getCategoryColor(item.category).bg }]}>
              <Feather
                name={getCategoryIcon(item.category) as any}
                size={16}
                color={getCategoryColor(item.category).color}
              />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                {item.category} {item.quantity > 1 ? `x${item.quantity}` : ""}
              </Text>
            </View>
          </View>
          <View style={styles.itemRight}>
            <Text style={styles.itemPrice}>${item.price.toLocaleString()}</Text>
            <Text style={styles.itemDate}>{item.date}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case "Software": return "code";
    case "Hardware": return "cpu";
    case "Service": return "tool";
    default: return "package";
  }
}

function getCategoryColor(cat: string) {
  switch (cat) {
    case "Software": return { color: "#3B82F6", bg: "#DBEAFE" };
    case "Hardware": return { color: "#8B5CF6", bg: "#EDE9FE" };
    case "Service": return { color: "#10B981", bg: "#D1FAE5" };
    default: return { color: "#64748B", bg: "#F1F5F9" };
  }
}

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getCustomerById, updateCustomerStatus } = useCustomers();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const customer = getCustomerById(id);

  const sortedItems = useMemo(() => {
    if (!customer) return [];
    let items = [...customer.items];
    if (filterCategory !== "all") {
      items = items.filter((i) => i.category === filterCategory);
    }
    switch (sortBy) {
      case "date":
        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case "price_asc":
        return items.sort((a, b) => a.price - b.price);
      case "price_desc":
        return items.sort((a, b) => b.price - a.price);
      default:
        return items;
    }
  }, [customer, sortBy, filterCategory]);

  const categories = useMemo(() => {
    if (!customer) return [];
    const cats = new Set(customer.items.map((i) => i.category));
    return ["all", ...Array.from(cats)];
  }, [customer]);

  if (!customer) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>Customer not found</Text>
      </View>
    );
  }

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const phoneUrl = Platform.OS === "android"
      ? `tel:${customer.phone}`
      : `telprompt:${customer.phone}`;
    Linking.openURL(phoneUrl).catch(() => {});
    setTimeout(() => setShowStatusModal(true), 1000);
  };

  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const msg = encodeURIComponent(`Hi ${customer.name}, following up on your recent inquiry.`);
    const phone = customer.phone.replace(/[^0-9]/g, "");
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`).catch(() => {});
    setTimeout(() => setShowStatusModal(true), 1000);
  };

  const handleStatusSelect = (status: CustomerStatus) => {
    updateCustomerStatus(customer.id, status);
    setShowStatusModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => router.back(), 300);
  };

  const avatarColors = [
    "#3B82F6", "#8B5CF6", "#EC4899", "#10B981",
    "#F59E0B", "#EF4444", "#06B6D4", "#6366F1",
  ];
  const colorIndex = customer.name.charCodeAt(0) % avatarColors.length;

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + webBottomInset }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>Customer Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Animated.View entering={FadeIn.duration(400)} style={styles.profileSection}>
              <View style={[styles.largeAvatar, { backgroundColor: avatarColors[colorIndex] }]}>
                <Text style={styles.largeAvatarText}>{customer.avatar}</Text>
              </View>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerCompany}>{customer.company}</Text>
              <StatusBadge status={customer.status} size="medium" />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Feather name="mail" size={16} color={Colors.light.textSecondary} />
                <Text style={styles.infoText}>{customer.email}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Feather name="phone" size={16} color={Colors.light.textSecondary} />
                <Text style={styles.infoText}>{customer.phone}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={16} color={Colors.light.textSecondary} />
                <Text style={styles.infoText}>{customer.address}</Text>
              </View>
              {customer.notes ? (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Feather name="file-text" size={16} color={Colors.light.textSecondary} />
                    <Text style={styles.infoText}>{customer.notes}</Text>
                  </View>
                </>
              ) : null}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsRow}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>{customer.totalItems}</Text>
                <Text style={styles.miniStatLabel}>Items</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatValue, { color: Colors.light.success }]}>
                  ${customer.totalPayment.toLocaleString()}
                </Text>
                <Text style={styles.miniStatLabel}>Total</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>{customer.lastContact}</Text>
                <Text style={styles.miniStatLabel}>Last Contact</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Purchased Items</Text>
                <Text style={styles.sectionCount}>{sortedItems.length} items</Text>
              </View>

              <View style={styles.sortFilterRow}>
                {(["date", "price_asc", "price_desc"] as SortBy[]).map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
                    onPress={() => setSortBy(s)}
                  >
                    <Text style={[styles.sortChipText, sortBy === s && styles.sortChipTextActive]}>
                      {s === "date" ? "Date" : s === "price_asc" ? "Price Low" : "Price High"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.categoryRow}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.catChip, filterCategory === cat && styles.catChipActive]}
                    onPress={() => setFilterCategory(cat)}
                  >
                    <Text style={[styles.catChipText, filterCategory === cat && styles.catChipTextActive]}>
                      {cat === "all" ? "All" : cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          </>
        }
        renderItem={({ item, index }) => <ItemCard item={item} index={index} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyItems}>
            <Text style={styles.emptyItemsText}>No items in this category</Text>
          </View>
        }
      />

      <Animated.View
        entering={FadeInDown.delay(400).duration(400).springify()}
        style={[styles.stickyActions]}
      >
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.callBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
          onPress={handleCall}
        >
          <Feather name="phone" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Call</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.messageBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
          onPress={handleMessage}
        >
          <Feather name="message-circle" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>WhatsApp</Text>
        </Pressable>
      </Animated.View>

      <StatusUpdateModal
        visible={showStatusModal}
        customerName={customer.name}
        onSelect={handleStatusSelect}
        onClose={() => setShowStatusModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.light.text,
    textAlign: "center",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  largeAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  largeAvatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700" as const,
  },
  customerName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  customerCompany: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginVertical: 10,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  miniStat: {
    flex: 1,
    alignItems: "center",
  },
  miniStatValue: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  miniStatLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  sectionCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  sortFilterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  sortChipActive: {
    backgroundColor: Colors.light.accent,
    borderColor: Colors.light.accent,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.light.textSecondary,
  },
  sortChipTextActive: {
    color: "#fff",
  },
  categoryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  catChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: Colors.light.textSecondary,
  },
  catChipTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingBottom: 120,
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  itemRight: {
    alignItems: "flex-end",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  itemDate: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  emptyItems: {
    padding: 40,
    alignItems: "center",
  },
  emptyItemsText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  stickyActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  callBtn: {
    backgroundColor: Colors.light.accent,
    shadowColor: Colors.light.accent,
  },
  messageBtn: {
    backgroundColor: "#25D366",
    shadowColor: "#25D366",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700" as const,
  },
});
