import React from "react";
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useCustomers } from "@/context/CustomerContext";

export default function DrawerMenu({ visible, onClose }) {
  const { user, logout } = useAuth();
  const { getCustomersByTab, getTodayStats } = useCustomers();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const stats = getTodayStats();
  const activeCount = getCustomersByTab("active").length;
  const followLaterCount = getCustomersByTab("follow_later").length;
  const completedCount = getCustomersByTab("completed").length;

  const handleNavigation = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => {
      router.push(route);
    }, 300);
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onClose();
            await logout();
            router.replace("/");
          },
        },
      ]
    );
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "U";

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.overlay}>
        <Pressable style={styles.overlayPress} onPress={onClose} />
        
        <Animated.View
          entering={SlideInLeft.duration(300).springify()}
          exiting={SlideOutLeft.duration(250)}
          style={styles.drawer}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top }}>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{initials}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.username || "User"}</Text>
                <Text style={styles.profileRole}>Sales Representative</Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>TODAY’S OVERVIEW</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalCalls}</Text>
                  <Text style={styles.statLabel}>Calls Made</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.completed}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.pending}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Navigation Section */}
            <View style={styles.navSection}>
              <Text style={styles.sectionTitle}>CUSTOMERS</Text>

              <Pressable
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={() => handleNavigation("/add-customer")}
              >
                <View style={[styles.navIcon, { backgroundColor: Colors.light.accentLight }]}>
                  <Feather name="user-plus" size={20} color={Colors.light.accent} />
                </View>
                <View style={styles.navContent}>
                  <Text style={styles.navText}>Add New Customer</Text>
                  <Text style={styles.navSubtext}>Create a new contact</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={() => handleNavigation("/(tabs)")}
              >
                <View style={[styles.navIcon, { backgroundColor: Colors.light.accentLight }]}>
                  <Feather name="users" size={20} color={Colors.light.accent} />
                </View>
                <View style={styles.navContent}>
                  <Text style={styles.navText}>Active Customers</Text>
                  <Text style={styles.navSubtext}>{activeCount} contacts</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={() => handleNavigation("/(tabs)/follow-later")}
              >
                <View style={[styles.navIcon, { backgroundColor: Colors.light.warningLight }]}>
                  <Feather name="clock" size={20} color={Colors.light.warning} />
                </View>
                <View style={styles.navContent}>
                  <Text style={styles.navText}>Follow Later</Text>
                  <Text style={styles.navSubtext}>{followLaterCount} contacts</Text>
                </View>
                {followLaterCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{followLaterCount}</Text>
                  </View>
                )}
                <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={() => handleNavigation("/(tabs)/completed")}
              >
                <View style={[styles.navIcon, { backgroundColor: Colors.light.successLight }]}>
                  <Feather name="check-circle" size={20} color={Colors.light.success} />
                </View>
                <View style={styles.navContent}>
                  <Text style={styles.navText}>Completed</Text>
                  <Text style={styles.navSubtext}>{completedCount} contacts</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={() => handleNavigation("/(tabs)/stats")}
              >
                <View style={[styles.navIcon, { backgroundColor: Colors.light.purpleLight }]}>
                  <Feather name="bar-chart-2" size={20} color={Colors.light.purple} />
                </View>
                <View style={styles.navContent}>
                  <Text style={styles.navText}>Statistics</Text>
                  <Text style={styles.navSubtext}>View analytics</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Employee Section */}
            <View style={styles.navSection}>
              <Text style={styles.sectionTitle}>EMPLOYEE</Text>

              <Pressable
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={() => handleNavigation("/punch")}
              >
                <View style={[styles.navIcon, { backgroundColor: Colors.light.successLight }]}>
                  <Feather name="clock" size={20} color={Colors.light.success} />
                </View>
                <View style={styles.navContent}>
                  <Text style={styles.navText}>Punch In</Text>
                  <Text style={styles.navSubtext}>Record your time</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={() => handleNavigation("/attendance")}
              >
                <View style={[styles.navIcon, { backgroundColor: Colors.light.purpleLight }]}>
                  <Feather name="calendar" size={20} color={Colors.light.purple} />
                </View>
                <View style={styles.navContent}>
                  <Text style={styles.navText}>Attendance</Text>
                  <Text style={styles.navSubtext}>Present, absent & leaves</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Account Section */}
            <View style={styles.navSection}>
              <Text style={styles.sectionTitle}>ACCOUNT</Text>
              
              <Pressable
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={() => handleNavigation("/profile")}
              >
                <View style={[styles.navIcon, { backgroundColor: Colors.light.accentLight }]}>
                  <Feather name="user" size={20} color={Colors.light.accent} />
                </View>
                <View style={styles.navContent}>
                  <Text style={styles.navText}>My Profile</Text>
                  <Text style={styles.navSubtext}>View and edit profile</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Help Section */}
            <View style={styles.navSection}>
              <Pressable
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert("Help & Support", "Contact us at support@followupcrm.com");
                }}
              >
                <View style={[styles.navIcon, { backgroundColor: Colors.light.successLight }]}>
                  <Feather name="help-circle" size={20} color={Colors.light.success} />
                </View>
                <View style={styles.navContent}>
                  <Text style={styles.navText}>Help & Support</Text>
                  <Text style={styles.navSubtext}>Get assistance</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert("About", "FollowUp CRM v1.0.0\n\nManage your customer relationships efficiently.");
                }}
              >
                <View style={[styles.navIcon, { backgroundColor: Colors.light.accentLight }]}>
                  <Feather name="info" size={20} color={Colors.light.accent} />
                </View>
                <View style={styles.navContent}>
                  <Text style={styles.navText}>About</Text>
                  <Text style={styles.navSubtext}>Version 1.0.0</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Logout */}
            <View style={styles.navSection}>
              <Pressable
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={handleLogout}
              >
                <View style={[styles.navIcon, { backgroundColor: Colors.light.dangerLight }]}>
                  <Feather name="log-out" size={20} color={Colors.light.danger} />
                </View>
                <View style={styles.navContent}>
                  <Text style={[styles.navText, { color: Colors.light.danger }]}>Log Out</Text>
                  <Text style={styles.navSubtext}>Sign out of your account</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
              </Pressable>
            </View>

            <View style={{ height: insets.bottom + 20 }} />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
  },
  overlayPress: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "85%",
    maxWidth: 340,
    backgroundColor: Colors.light.card,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 24,
    gap: 16,
    backgroundColor: Colors.light.background,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  profileRole: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statsSection: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: Colors.light.background,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.light.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginVertical: 8,
  },
  navSection: {
    paddingVertical: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  navItemPressed: {
    backgroundColor: Colors.light.background,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navContent: {
    flex: 1,
  },
  navText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  navSubtext: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  badge: {
    backgroundColor: Colors.light.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
