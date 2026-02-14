import React, { useState } from "react";
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
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { signup, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; confirm?: string }>({});
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
    const newErrors: { username?: string; password?: string; confirm?: string } = {};
    if (username.trim().length < 3) newErrors.username = "Username must be at least 3 characters";
    if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) newErrors.confirm = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
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
    const result = await signup(username, password);
    if (result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      successOpacity.value = withTiming(1, { duration: 200 });
      successScale.value = withSpring(1, { damping: 10, stiffness: 150 });
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 800);
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
            { paddingTop: insets.top + webTopInset + 40, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {showSuccess ? (
            <Animated.View style={[styles.successContainer, successAnimStyle]}>
              <View style={styles.successCircle}>
                <Feather name="check" size={48} color="#fff" />
              </View>
              <Text style={styles.successText}>Account created!</Text>
            </Animated.View>
          ) : (
            <>
              <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                  <Feather name="arrow-left" size={22} color="#fff" />
                </Pressable>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Start managing your customers today</Text>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(200).duration(500)}
                style={styles.formCard}
              >
                <Animated.View style={shakeStyle}>
                  <Text style={styles.formTitle}>Sign Up</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username</Text>
                    <View style={[styles.inputBox, errors.username ? styles.inputError : null]}>
                      <Feather name="user" size={18} color={Colors.light.textTertiary} />
                      <TextInput
                        style={styles.input}
                        placeholder="Choose a username"
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
                        placeholder="Create a password"
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

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={[styles.inputBox, errors.confirm ? styles.inputError : null]}>
                      <Feather name="shield" size={18} color={Colors.light.textTertiary} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor={Colors.light.textTertiary}
                        value={confirmPassword}
                        onChangeText={(t) => {
                          setConfirmPassword(t);
                          if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
                        }}
                        secureTextEntry={!showPassword}
                      />
                    </View>
                    {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.signupBtn,
                      pressed && styles.signupBtnPressed,
                      isLoading && styles.signupBtnDisabled,
                    ]}
                    onPress={handleSignup}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.signupBtnText}>Create Account</Text>
                    )}
                  </Pressable>
                </Animated.View>

                <Pressable style={styles.loginLink} onPress={() => router.back()}>
                  <Text style={styles.loginText}>
                    Already have an account?{" "}
                    <Text style={styles.loginBold}>Sign In</Text>
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
    marginBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
  signupBtn: {
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
  signupBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  signupBtnDisabled: {
    opacity: 0.7,
  },
  signupBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  loginLink: {
    alignItems: "center",
    padding: 4,
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  loginBold: {
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
