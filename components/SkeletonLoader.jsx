import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

function SkeletonBlock({ width = "100%", height = 16, borderRadius = 8, style }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.light.shimmer,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function CustomerCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBlock width={44} height={44} borderRadius={22} />
        <View style={styles.info}>
          <SkeletonBlock width="60%" height={14} />
          <SkeletonBlock width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
        <SkeletonBlock width={80} height={22} borderRadius={11} />
      </View>
      <View style={styles.statsRow}>
        <SkeletonBlock width="30%" height={12} />
        <SkeletonBlock width="30%" height={12} />
      </View>
    </View>
  );
}

export function CustomerListSkeleton({ count = 5 }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <CustomerCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  list: {
    paddingTop: 12,
  },
});
