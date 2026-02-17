import React from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { CustomerStatus, STATUS_CONFIG } from "@/data/customers";

interface StatusUpdateModalProps {
  visible: boolean;
  customerName: string;
  onSelect: (status: CustomerStatus) => void;
  onClose: () => void;
}

const statuses: CustomerStatus[] = [
  "not_responded",
  "busy",
  "picked_call",
  "asked_time",
  "interested",
  "completed",
];

function StatusOption({
  status,
  onPress,
}: {
  status: CustomerStatus;
  onPress: () => void;
}) {
  const config = STATUS_CONFIG[status];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
    >
      <Animated.View style={[styles.option, animatedStyle]}>
        <View style={[styles.optionIcon, { backgroundColor: config.bg }]}>
          <Feather name={config.icon as any} size={18} color={config.color} />
        </View>
        <View style={styles.optionInfo}>
          <Text style={styles.optionLabel}>{config.label}</Text>
          <Text style={styles.optionHint}>
            {status === "not_responded" || status === "busy" || status === "picked_call"
              ? "Stays in Active"
              : status === "asked_time" || status === "interested"
              ? "Moves to Follow Later"
              : "Moves to Completed"}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
      </Animated.View>
    </Pressable>
  );
}

export default function StatusUpdateModal({
  visible,
  customerName,
  onSelect,
  onClose,
}: StatusUpdateModalProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <Pressable style={styles.overlayPress} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          exiting={SlideOutDown.duration(200)}
          style={styles.sheet}
        >
          <View style={styles.grabber} />
          <Text style={styles.title}>Update Call Status</Text>
          <Text style={styles.subtitle}>
            How did the call with {customerName} go?
          </Text>
          <View style={styles.optionsList}>
            {statuses.map((s) => (
              <StatusOption key={s} status={s} onPress={() => onSelect(s)} />
            ))}
          </View>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: "flex-end",
  },
  overlayPress: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.divider,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  optionsList: {
    gap: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  optionHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  cancelBtn: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.light.background,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
});
