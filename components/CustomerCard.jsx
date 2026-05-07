import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import StatusBadge from "@/components/StatusBadge";
import { Customer } from "@/data/customers";

export default function CustomerCard({ customer, index }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/customer/[id]", params: { id: customer.id } });
  };

  const avatarColors = [
    "#3B82F6", "#8B5CF6", "#EC4899", "#10B981",
    "#F59E0B", "#EF4444", "#06B6D4", "#6366F1",
  ];
  const colorIndex = customer.name.charCodeAt(0) % avatarColors.length;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <View style={styles.topRow}>
            <View style={[styles.avatar, { backgroundColor: avatarColors[colorIndex] }]}>
              <Text style={styles.avatarText}>{customer.avatar}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {customer.name}
              </Text>
              <Text style={styles.company} numberOfLines={1}>
                {customer.company}
              </Text>
            </View>
            <StatusBadge status={customer.status} />
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Feather name="package" size={13} color={Colors.light.textSecondary} />
              <Text style={styles.statLabel}>{customer.totalItems} items</Text>
            </View>
            <View style={styles.stat}>
              <Feather name="dollar-sign" size={13} color={Colors.light.textSecondary} />
              <Text style={styles.statValue}>
                ${customer.totalPayment.toLocaleString()}
              </Text>
            </View>
            <View style={styles.stat}>
              <Feather name="calendar" size={13} color={Colors.light.textSecondary} />
              <Text style={styles.statLabel}>{customer.lastContact}</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  company: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.text,
  },
});
