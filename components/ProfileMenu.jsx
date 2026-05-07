import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(true);
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setVisible(false);
    await logout();
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";

  return (
    <>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.9); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={handleOpen}
      >
        <Animated.View style={[styles.avatarBtn, animStyle]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </Animated.View>
      </Pressable>

      <Modal visible={visible} transparent animationType="none" onRequestClose={() => setVisible(false)}>
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.overlay}>
          <Pressable style={styles.overlayPress} onPress={() => setVisible(false)} />
          <Animated.View
            entering={SlideInUp.duration(250).springify()}
            exiting={SlideOutUp.duration(200)}
            style={styles.menu}
          >
            <View style={styles.profileSection}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{initials}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.username || "User"}</Text>
                <Text style={styles.profileRole}>Sales Representative</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setVisible(false);
                router.push("/profile");
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: Colors.light.accentLight }]}>
                <Feather name="user" size={16} color={Colors.light.accent} />
              </View>
              <Text style={styles.menuItemText}>My Profile</Text>
              <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setVisible(false);
                router.push("/settings");
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: Colors.light.purpleLight }]}>
                <Feather name="settings" size={16} color={Colors.light.purple} />
              </View>
              <Text style={styles.menuItemText}>Settings</Text>
              <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={handleLogout}
            >
              <View style={[styles.menuIcon, { backgroundColor: Colors.light.dangerLight }]}>
                <Feather name="log-out" size={16} color={Colors.light.danger} />
              </View>
              <Text style={[styles.menuItemText, { color: Colors.light.danger }]}>Log Out</Text>
              <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
  },
  overlayPress: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    top: 100,
    right: 16,
    width: 280,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
  },
  profileRole: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: Colors.light.background,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
});
