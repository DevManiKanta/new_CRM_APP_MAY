import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useCustomers } from "@/context/CustomerContext";

const FIELDS = [
  { key: "name", label: "Full Name", placeholder: "e.g., Aisha Verma", icon: "user", required: true, autoCapitalize: "words" },
  { key: "phone", label: "Phone Number", placeholder: "+91 98765 43210", icon: "phone", required: true, keyboardType: "phone-pad" },
  { key: "email", label: "Email", placeholder: "name@company.in", icon: "mail", required: false, keyboardType: "email-address", autoCapitalize: "none" },
  { key: "company", label: "Company / Business", placeholder: "e.g., Herbal Corner", icon: "briefcase", required: false, autoCapitalize: "words" },
  { key: "address", label: "Address", placeholder: "Street, City, State", icon: "map-pin", required: false, multiline: true },
  { key: "notes", label: "Notes", placeholder: "Anything important to remember…", icon: "edit-3", required: false, multiline: true },
];

const initialForm = {
  name: "",
  phone: "",
  email: "",
  company: "",
  address: "",
  notes: "",
};

function validate(form) {
  const errors = {};
  if (!form.name.trim() || form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }
  const phoneDigits = form.phone.replace(/\D/g, "");
  if (!phoneDigits) {
    errors.phone = "Phone number is required";
  } else if (phoneDigits.length < 7) {
    errors.phone = "Enter a valid phone number";
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email";
  }
  return errors;
}

export default function AddCustomerScreen() {
  const insets = useSafeAreaInsets();
  const { addCustomer } = useCustomers();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSave = async () => {
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      return;
    }
    try {
      setIsSaving(true);
      const created = addCustomer(form);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Customer added", `${created.name} has been added to Active.`, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const initials = (form.name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "+";

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <Animated.View entering={FadeInDown.duration(250)} style={styles.header}>
        <Pressable onPress={handleCancel} hitSlop={10} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Add Customer</Text>
          <Text style={styles.subtitle}>Create a new contact in Active</Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(50).duration(300)} style={styles.heroWrap}>
            <LinearGradient
              colors={["#3B82F6", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>
                  {form.name.trim() ? form.name.trim() : "New Customer"}
                </Text>
                <Text style={styles.heroSub}>
                  {form.company.trim() ? form.company.trim() : "Will appear in Active list"}
                </Text>
              </View>
              <View style={styles.heroBadge}>
                <Feather name="user-plus" size={14} color="#fff" />
                <Text style={styles.heroBadgeText}>NEW</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.card, shakeStyle]}>
            {FIELDS.map((f, i) => {
              const isMultiline = !!f.multiline;
              const hasError = !!errors[f.key];
              return (
                <Animated.View
                  key={f.key}
                  entering={FadeInUp.delay(120 + i * 40).duration(300)}
                  style={styles.fieldGroup}
                >
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>{f.label}</Text>
                    {f.required ? <Text style={styles.required}>*</Text> : null}
                  </View>
                  <View
                    style={[
                      styles.inputBox,
                      isMultiline && styles.inputBoxMultiline,
                      hasError && styles.inputBoxError,
                    ]}
                  >
                    <Feather
                      name={f.icon}
                      size={16}
                      color={hasError ? Colors.light.danger : Colors.light.textTertiary}
                      style={isMultiline ? styles.iconMultiline : null}
                    />
                    <TextInput
                      style={[styles.input, isMultiline && styles.inputMultiline]}
                      value={form[f.key]}
                      onChangeText={(t) => setField(f.key, t)}
                      placeholder={f.placeholder}
                      placeholderTextColor={Colors.light.textTertiary}
                      keyboardType={f.keyboardType || "default"}
                      autoCapitalize={f.autoCapitalize || "sentences"}
                      multiline={isMultiline}
                      numberOfLines={isMultiline ? 4 : 1}
                      textAlignVertical={isMultiline ? "top" : "center"}
                    />
                  </View>
                  {hasError ? (
                    <View style={styles.errorRow}>
                      <Feather name="alert-circle" size={12} color={Colors.light.danger} />
                      <Text style={styles.errorText}>{errors[f.key]}</Text>
                    </View>
                  ) : null}
                </Animated.View>
              );
            })}
          </Animated.View>

          <View style={styles.footer}>
            <Pressable
              onPress={handleCancel}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.btn,
                styles.btnGhost,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.btn,
                styles.btnPrimary,
                pressed && !isSaving && styles.btnPressed,
                isSaving && styles.btnDisabled,
              ]}
            >
              <LinearGradient
                colors={isSaving ? ["#64748B", "#475569"] : ["#3B82F6", "#8B5CF6"]}
                style={styles.btnGrad}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={styles.btnPrimaryText}>Save Customer</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  headerCenter: { flex: 1 },
  title: { fontSize: 22, fontWeight: "800", color: Colors.light.text },
  subtitle: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2, fontWeight: "600" },

  scroll: {
    paddingBottom: 40,
  },
  heroWrap: { paddingHorizontal: 16, paddingTop: 4 },
  hero: {
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  heroSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  fieldGroup: { marginBottom: 14 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.3,
  },
  required: {
    color: Colors.light.danger,
    fontSize: 14,
    fontWeight: "800",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
  },
  inputBoxMultiline: {
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 96,
  },
  inputBoxError: {
    borderColor: Colors.light.danger,
    backgroundColor: Colors.light.dangerLight,
  },
  iconMultiline: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 80,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.danger,
    fontWeight: "600",
  },

  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 16,
  },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  btnGhost: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.cardBorder,
  },
  btnGhostText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "700",
  },
  btnPrimary: {
    flex: 2,
  },
  btnGrad: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  btnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
