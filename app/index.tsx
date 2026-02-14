import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);
  const shakeX = useSharedValue(0);

  const successAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};
    if (username.trim().length < 3) newErrors.username = "Username must be at least 3 characters";
    if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      return;
    }
    const result = await login(username, password);
    if (result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      successOpacity.value = withTiming(1, { duration: 200 });
      successScale.value = withSpring(1, { damping: 10, stiffness: 150 });
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 800);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ password: "Invalid credentials. Try any username (3+ chars) and password (6+ chars)." });
    }
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <LinearGradient colors={["#0F172A", "#1E293B", "#334155"]} style={styles.gradient}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + webTopInset + 60, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {showSuccess ? (
            <Animated.View style={[styles.successContainer, successAnimStyle]}>
              <View style={styles.successCircle}>
                <Feather name="check" size={48} color="#fff" />
              </View>
              <Text style={styles.successText}>Welcome back!</Text>
            </Animated.View>
          ) : (
            <>
              <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                <View style={styles.logoContainer}>
                  <LinearGradient
                    colors={["#3B82F6", "#8B5CF6"]}
                    style={styles.logoGradient}
                  >
                    <Feather name="users" size={28} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.title}>FollowUp CRM</Text>
                <Text style={styles.subtitle}>Manage your customer relationships</Text>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(200).duration(500)}
                style={styles.formCard}
              >
                <Animated.View style={shakeStyle}>
                  <Text style={styles.formTitle}>Sign In</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username</Text>
                    <View style={[styles.inputBox, errors.username ? styles.inputError : null]}>
                      <Feather name="user" size={18} color={Colors.light.textTertiary} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter username"
                        placeholderTextColor={Colors.light.textTertiary}
                        value={username}
                        onChangeText={(t) => {
                          setUsername(t);
                          if (errors.username) setErrors((e) => ({ ...e, username: undefined }));
                        }}
                        autoCapitalize="none"
                      />
                    </View>
                    {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={[styles.inputBox, errors.password ? styles.inputError : null]}>
                      <Feather name="lock" size={18} color={Colors.light.textTertiary} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter password"
                        placeholderTextColor={Colors.light.textTertiary}
                        value={password}
                        onChangeText={(t) => {
                          setPassword(t);
                          if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                        }}
                        secureTextEntry={!showPassword}
                      />
                      <Pressable onPress={() => setShowPassword(!showPassword)}>
                        <Feather
                          name={showPassword ? "eye-off" : "eye"}
                          size={18}
                          color={Colors.light.textTertiary}
                        />
                      </Pressable>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.loginBtn,
                      pressed && styles.loginBtnPressed,
                      isLoading && styles.loginBtnDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginBtnText}>Sign In</Text>
                    )}
                  </Pressable>
                </Animated.View>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={styles.signupLink}
                  onPress={() => router.push("/signup")}
                >
                  <Text style={styles.signupText}>
                    Don't have an account?{" "}
                    <Text style={styles.signupBold}>Sign Up</Text>
                  </Text>
                </Pressable>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
  },
  inputError: {
    borderColor: Colors.light.danger,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.danger,
    marginTop: 4,
  },
  loginBtn: {
    backgroundColor: Colors.light.accent,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.divider,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  signupLink: {
    alignItems: "center",
    padding: 4,
  },
  signupText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  signupBold: {
    color: Colors.light.accent,
    fontWeight: "600" as const,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#fff",
  },
});
