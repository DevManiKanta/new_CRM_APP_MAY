import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.username || "");
  const [email, setEmail] = useState("user@example.com");
  const [phone, setPhone] = useState("+1 234 567 8900");
  const [role, setRole] = useState("Sales Representative");
  const [isEditing, setIsEditing] = useState(false);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditing(false);
    Alert.alert("Success", "Profile updated successfully!");
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(false);
    setName(user?.username || "");
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "U";

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Feather name="arrow-left" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>Profile</Text>
        <Pressable
          style={styles.editButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
        >
          <Text style={styles.editButtonText}>{isEditing ? "Save" : "Edit"}</Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.avatarSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{initials}</Text>
          </View>
          {isEditing && (
            <Pressable
              style={styles.changePhotoButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert("Change Photo", "Photo upload feature coming soon!");
              }}
            >
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Profile Info */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
          
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Feather name="user" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.fieldLabel}>Full Name</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={Colors.light.textTertiary}
              />
            ) : (
              <Text style={styles.fieldValue}>{name}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Feather name="mail" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.fieldLabel}>Email</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={Colors.light.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.fieldValue}>{email}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Feather name="phone" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.fieldLabel}>Phone</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                placeholderTextColor={Colors.light.textTertiary}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{phone}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Feather name="briefcase" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.fieldLabel}>Role</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={role}
                onChangeText={setRole}
                placeholder="Enter your role"
                placeholderTextColor={Colors.light.textTertiary}
              />
            ) : (
              <Text style={styles.fieldValue}>{role}</Text>
            )}
          </View>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>STATISTICS</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.light.successLight }]}>
                <Feather name="check-circle" size={20} color={Colors.light.success} />
              </View>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.light.accentLight }]}>
                <Feather name="phone" size={20} color={Colors.light.accent} />
              </View>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>Total Calls</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.light.warningLight }]}>
                <Feather name="clock" size={20} color={Colors.light.warning} />
              </View>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.light.purpleLight }]}>
                <Feather name="trending-up" size={20} color={Colors.light.purple} />
              </View>
              <Text style={styles.statValue}>85%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>
        </Animated.View>

        {isEditing && (
          <Animated.View entering={FadeIn.delay(400)} style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    flex: 1,
    textAlign: "center",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.accent,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: "#fff",
  },
  changePhotoButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.accent,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  fieldContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  input: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
    padding: 0,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.light.textSecondary,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
});
