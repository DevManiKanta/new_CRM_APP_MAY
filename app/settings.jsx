import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const webTopInset = Platform.OS === "web" ? 67 : 0;

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
                        await logout();
                        router.replace("/");
                    },
                },
            ]
        );
    };

    const handlePress = (action) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
    };

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
                <Text style={styles.title}>Settings</Text>
                <View style={{ width: 40 }} />
            </Animated.View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>

                    <Pressable
                        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                        onPress={() => handlePress(() => router.push("/profile"))}
                    >
                        <View style={styles.itemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.light.accentLight }]}>
                                <Feather name="user" size={20} color={Colors.light.accent} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>Profile</Text>
                                <Text style={styles.itemSubtitle}>{user?.username || "View your profile"}</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={20} color={Colors.light.textTertiary} />
                    </Pressable>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

                    <View style={styles.item}>
                        <View style={styles.itemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.light.successLight }]}>
                                <Feather name="bell" size={20} color={Colors.light.success} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>Push Notifications</Text>
                                <Text style={styles.itemSubtitle}>Get notified about follow-ups</Text>
                            </View>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={(val) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setNotifications(val);
                            }}
                            trackColor={{ false: Colors.light.inputBorder, true: Colors.light.accent }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.item}>
                        <View style={styles.itemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.light.warningLight }]}>
                                <Feather name="mail" size={20} color={Colors.light.warning} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>Email Alerts</Text>
                                <Text style={styles.itemSubtitle}>Receive daily summaries</Text>
                            </View>
                        </View>
                        <Switch
                            value={emailAlerts}
                            onValueChange={(val) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setEmailAlerts(val);
                            }}
                            trackColor={{ false: Colors.light.inputBorder, true: Colors.light.accent }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.item}>
                        <View style={styles.itemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.light.purpleLight }]}>
                                <Feather name="volume-2" size={20} color={Colors.light.purple} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>Sound</Text>
                                <Text style={styles.itemSubtitle}>Enable notification sounds</Text>
                            </View>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={(val) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSoundEnabled(val);
                            }}
                            trackColor={{ false: Colors.light.inputBorder, true: Colors.light.accent }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* App Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>APP</Text>

                    <Pressable
                        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                        onPress={() => handlePress(() => { })}
                    >
                        <View style={styles.itemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.light.accentLight }]}>
                                <Feather name="info" size={20} color={Colors.light.accent} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>About</Text>
                                <Text style={styles.itemSubtitle}>Version 1.0.0</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={20} color={Colors.light.textTertiary} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                        onPress={() => handlePress(() => { })}
                    >
                        <View style={styles.itemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.light.successLight }]}>
                                <Feather name="help-circle" size={20} color={Colors.light.success} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>Help & Support</Text>
                                <Text style={styles.itemSubtitle}>Get help with the app</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={20} color={Colors.light.textTertiary} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                        onPress={() => handlePress(() => { })}
                    >
                        <View style={styles.itemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.light.warningLight }]}>
                                <Feather name="shield" size={20} color={Colors.light.warning} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>Privacy Policy</Text>
                                <Text style={styles.itemSubtitle}>Read our privacy policy</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={20} color={Colors.light.textTertiary} />
                    </Pressable>
                </View>

                {/* Logout Section */}
                <View style={styles.section}>
                    <Pressable
                        style={({ pressed }) => [styles.item, styles.logoutItem, pressed && styles.itemPressed]}
                        onPress={handleLogout}
                    >
                        <View style={styles.itemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.light.dangerLight }]}>
                                <Feather name="log-out" size={20} color={Colors.light.danger} />
                            </View>
                            <Text style={[styles.itemTitle, { color: Colors.light.danger }]}>Log Out</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={Colors.light.textTertiary} />
                    </Pressable>
                </View>
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
        fontWeight: "700",
        color: Colors.light.text,
        flex: 1,
        textAlign: "center",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 8,
        paddingBottom: 120,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.light.textSecondary,
        paddingHorizontal: 20,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.light.card,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.divider,
    },
    itemPressed: {
        backgroundColor: Colors.light.background,
    },
    itemLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: Colors.light.text,
    },
    itemSubtitle: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        marginTop: 2,
    },
    logoutItem: {
        borderBottomWidth: 0,
    },
});
