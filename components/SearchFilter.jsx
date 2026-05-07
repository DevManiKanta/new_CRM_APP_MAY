import React, { useState } from "react";
import { View, TextInput, StyleSheet, Pressable, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { CustomerStatus, STATUS_CONFIG } from "@/data/customers";

export default function SearchFilter({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  statusOptions,
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={Colors.light.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder="Search customers..."
            placeholderTextColor={Colors.light.textTertiary}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange("")}>
              <Feather name="x" size={16} color={Colors.light.textTertiary} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Feather
            name="sliders"
            size={18}
            color={showFilters ? "#fff" : Colors.light.accent}
          />
        </Pressable>
      </View>

      {showFilters && (
        <Animated.View entering={FadeIn.duration(200)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <Pressable
              style={[styles.chip, activeFilter === "all" && styles.chipActive]}
              onPress={() => onFilterChange("all")}
            >
              <Text style={[styles.chipText, activeFilter === "all" && styles.chipTextActive]}>
                All
              </Text>
            </Pressable>
            {statusOptions.map((s) => {
              const config = STATUS_CONFIG[s];
              const isActive = activeFilter === s;
              return (
                <Pressable
                  key={s}
                  style={[
                    styles.chip,
                    isActive && { backgroundColor: config.color },
                  ]}
                  onPress={() => onFilterChange(s)}
                >
                  <View
                    style={[
                      styles.chipDot,
                      { backgroundColor: isActive ? "#fff" : config.color },
                    ]}
                  />
                  <Text
                    style={[styles.chipText, isActive && { color: "#fff" }]}
                  >
                    {config.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
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
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.accentLight,
  },
  filterBtnActive: {
    backgroundColor: Colors.light.accent,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    gap: 6,
  },
  chipActive: {
    backgroundColor: Colors.light.accent,
    borderColor: Colors.light.accent,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: "#fff",
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
