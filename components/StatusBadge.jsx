import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { STATUS_CONFIG } from "@/data/customers";

export default function StatusBadge({ status, size = "small" }) {
  const config = STATUS_CONFIG[status];
  const isSmall = size === "small";

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSmall]}>
      <Feather
        name={config.icon}
        size={isSmall ? 10 : 12}
        color={config.color}
      />
      <Text
        style={[
          styles.text,
          { color: config.color },
          isSmall && styles.textSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  textSmall: {
    fontSize: 10,
  },
});
