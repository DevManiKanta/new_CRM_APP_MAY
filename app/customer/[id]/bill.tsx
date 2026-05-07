import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import { useCustomers } from "@/context/CustomerContext";
import { BILL_COUPONS } from "@/lib/coupons";
import allCustomers from "@/data/customers";

const MERCHANT_UPI_ID = "followup@ybl";
const MERCHANT_NAME = "FollowUp CRM";

function lineTotal(price: number, quantity: number) {
  return price * quantity;
}

function parsePercent(raw: string): number {
  const n = parseFloat(raw.replace(/,/g, "."));
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(100, n);
}

type AddressFields = {
  deliveryName: string;
  houseNo: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  alternatePhone: string;
};

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

function digitsOnly(s: string) {
  return String(s || "").replace(/[^0-9]/g, "");
}

function buildAddressText(a: AddressFields) {
  const lines: string[] = [];
  const nameLine = a.deliveryName?.trim();
  if (nameLine) lines.push(nameLine);

  const line1 = [a.houseNo, a.street].map((x) => x?.trim()).filter(Boolean).join(", ");
  if (line1) lines.push(line1);
  if (a.landmark?.trim()) lines.push(`Landmark: ${a.landmark.trim()}`);

  const cityStatePin = [a.city, a.state, a.pincode].map((x) => x?.trim()).filter(Boolean).join(", ");
  if (cityStatePin) lines.push(cityStatePin);
  if (a.alternatePhone?.trim()) lines.push(`Alt: ${a.alternatePhone.trim()}`);

  return lines.join("\n");
}

export default function BillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getCustomerById } = useCustomers();
  const customer = getCustomerById(id);

  const [discountPercentInput, setDiscountPercentInput] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [address, setAddress] = useState<AddressFields>({
    deliveryName: customer?.name ?? "",
    houseNo: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    alternatePhone: "",
  });
  const [pincodeLookupLoading, setPincodeLookupLoading] = useState(false);
  const [pincodeLookupError, setPincodeLookupError] = useState("");
  const lastPincodeLookedUpRef = useRef<string>("");
  const [statePickerOpen, setStatePickerOpen] = useState(false);

  const [deliveryChargesInput, setDeliveryChargesInput] = useState("");
  const [additionalChargesInput, setAdditionalChargesInput] = useState("");
  const [remarks, setRemarks] = useState("");
  const [billItems, setBillItems] = useState(() => customer?.items?.map((it) => ({ ...it })) ?? []);
  const [appliedCoupon, setAppliedCoupon] = useState<
    null | { code: string; type: "percent" | "flat"; value: number; label: string }
  >(null);
  const [couponError, setCouponError] = useState("");

  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const [methodSheetOpen, setMethodSheetOpen] = useState(false);
  const [phonePeOpen, setPhonePeOpen] = useState(false);
  const [phonePeImage, setPhonePeImage] = useState<string | null>(null);
  const [phonePeUploading, setPhonePeUploading] = useState(false);
  const [phonePeConfirming, setPhonePeConfirming] = useState(false);
  const [phonePeDone, setPhonePeDone] = useState(false);

  const productCatalog = useMemo(() => {
    // Build a unique product list from all static customers data.
    const map = new Map<string, { name: string; price: number; category: string }>();
    (allCustomers || []).forEach((c: any) => {
      (c?.items || []).forEach((it: any) => {
        if (!it?.name) return;
        const key = String(it.name).trim().toLowerCase();
        if (!key) return;
        if (!map.has(key)) {
          map.set(key, {
            name: String(it.name),
            price: Number(it.price) || 0,
            category: String(it.category || "Other"),
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredCatalog = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return productCatalog;
    return productCatalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [productCatalog, productSearch]);

  const subtotal = useMemo(() => {
    if (!customer) return 0;
    return billItems.reduce((sum: number, it: any) => sum + lineTotal(it.price, it.quantity), 0);
  }, [customer, billItems]);

  const discountPercent = parsePercent(discountPercentInput);
  const manualDiscountAmount = subtotal * (discountPercent / 100);
  const afterManual = Math.max(0, subtotal - manualDiscountAmount);

  const couponAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") {
      return afterManual * (appliedCoupon.value / 100);
    }
    return Math.min(afterManual, appliedCoupon.value);
  }, [afterManual, appliedCoupon]);

  const grandTotal = Math.max(0, afterManual - couponAmount);

  const deliveryCharges = useMemo(() => {
    const n = parseFloat(String(deliveryChargesInput || "").replace(/,/g, "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [deliveryChargesInput]);

  const additionalCharges = useMemo(() => {
    const n = parseFloat(String(additionalChargesInput || "").replace(/,/g, "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [additionalChargesInput]);

  const amountPayable = Math.max(0, grandTotal + deliveryCharges + additionalCharges);

  useEffect(() => {
    if (!customer) return;
    setAddress((prev) => ({
      ...prev,
      deliveryName: prev.deliveryName?.trim() ? prev.deliveryName : (customer?.name ?? ""),
    }));
  }, [customer]);

  useEffect(() => {
    const pin = digitsOnly(address.pincode);
    if (pin !== address.pincode) {
      setAddress((prev) => ({ ...prev, pincode: pin }));
      return;
    }
    setPincodeLookupError("");
    if (pin.length !== 6) return;
    if (lastPincodeLookedUpRef.current === pin) return;

    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setPincodeLookupLoading(true);
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        const first = Array.isArray(json) ? json[0] : null;
        if (!first || first?.Status !== "Success" || !Array.isArray(first?.PostOffice) || !first.PostOffice[0]) {
          setPincodeLookupError("Invalid pincode");
          lastPincodeLookedUpRef.current = pin;
          return;
        }
        const po = first.PostOffice[0];
        const cityCandidate = String(po?.Taluk || po?.Block || po?.District || "").trim();
        const stateCandidate = String(po?.State || "").trim();

        setAddress((prev) => ({
          ...prev,
          city: cityCandidate || prev.city,
          state: stateCandidate || prev.state,
        }));
        lastPincodeLookedUpRef.current = pin;
      } catch (e: any) {
        if (e?.name !== "AbortError") setPincodeLookupError("Pincode lookup failed");
      } finally {
        setPincodeLookupLoading(false);
      }
    }, 450);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [address.pincode]);

  const applyCoupon = () => {
    setCouponError("");
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const def = BILL_COUPONS[code as keyof typeof BILL_COUPONS];
    if (!def) {
      setCouponError("Invalid coupon code");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setAppliedCoupon({
      code,
      type: def.type as "percent" | "flat",
      value: def.value,
      label: def.label,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const incQty = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBillItems((prev: any[]) =>
      prev.map((it) => (it.id === itemId ? { ...it, quantity: (it.quantity || 0) + 1 } : it))
    );
  };

  const decQty = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBillItems((prev: any[]) =>
      prev
        .map((it) => (it.id === itemId ? { ...it, quantity: Math.max(1, (it.quantity || 1) - 1) } : it))
    );
  };

  const removeItem = (itemId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setBillItems((prev: any[]) => prev.filter((it) => it.id !== itemId));
  };

  const addProductToBill = (product: { name: string; price: number; category: string }) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBillItems((prev: any[]) => {
      const existing = prev.find((it) => String(it.name).trim().toLowerCase() === product.name.trim().toLowerCase());
      if (existing) {
        return prev.map((it) => (it.id === existing.id ? { ...it, quantity: (it.quantity || 0) + 1 } : it));
      }
      const newId = `bi_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      return [
        ...prev,
        {
          id: newId,
          name: product.name,
          quantity: 1,
          price: product.price,
          date: new Date().toISOString().split("T")[0],
          category: product.category || "Other",
        },
      ];
    });
  };

  const validatePaymentPreconditions = () => {
    if (amountPayable <= 0) {
      Alert.alert("Amount", "Total must be greater than zero.");
      return false;
    }
    const pin = digitsOnly(address.pincode);
    const must = {
      Name: address.deliveryName?.trim(),
      "House/Door/Flat": address.houseNo?.trim(),
      Street: address.street?.trim(),
      City: address.city?.trim(),
      State: address.state?.trim(),
      Pincode: pin.length === 6 ? pin : "",
    };
    const missing = Object.entries(must)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length > 0) {
      Alert.alert("Address", `Please fill: ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  const openPaymentMethods = () => {
    if (!validatePaymentPreconditions()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMethodSheetOpen(true);
  };

  const choosePayLink = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMethodSheetOpen(false);
    // Allow the sheet to close before opening the next modal.
    setTimeout(() => setRazorpayOpen(true), 240);
  };

  const choosePayPhonePe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMethodSheetOpen(false);
    setPhonePeImage(null);
    setPhonePeDone(false);
    setTimeout(() => setPhonePeOpen(true), 240);
  };

  const pickPhonePeScreenshot = async () => {
    try {
      setPhonePeUploading(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow photo library access to upload your payment screenshot."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (asset?.uri) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhonePeImage(asset.uri);
      }
    } catch (e) {
      Alert.alert("Upload failed", "Could not pick the screenshot. Please try again.");
    } finally {
      setPhonePeUploading(false);
    }
  };

  const confirmPhonePePayment = () => {
    if (!phonePeImage) return;
    setPhonePeConfirming(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setPhonePeConfirming(false);
      setPhonePeDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1400);
  };

  const closePhonePeAndExit = () => {
    setPhonePeOpen(false);
    Alert.alert(
      "Payment received",
      `₹${amountPayable.toLocaleString("en-IN")} marked paid via PhonePe.\n\nDeliver to:\n${buildAddressText(address)}`,
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  const confirmDemoPayment = () => {
    setPayLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setPayLoading(false);
      setRazorpayOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Payment successful",
        `Paid ₹${amountPayable.toLocaleString("en-IN")} via Razorpay (demo).\n\nDeliver to:\n${buildAddressText(address)}`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    }, 1600);
  };

  if (!customer) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.notFound}>Customer not found</Text>
      </View>
    );
  }

  const webTop = Platform.OS === "web" ? 56 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topTitle}>Bill</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.customerBanner}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerMeta}>{customer.company}</Text>
        </View>

        <View style={styles.itemsHeaderRow}>
          <Text style={styles.sectionLabel}>Items</Text>
          <Pressable
            style={({ pressed }) => [styles.addProductBtn, pressed && { opacity: 0.9 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setProductSheetOpen(true);
            }}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addProductBtnText}>Add product</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          {billItems.map((it: any) => (
            <View key={it.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {it.name}
                </Text>
                <Text style={styles.itemQty}>₹{it.price.toLocaleString("en-IN")}</Text>
                <View style={styles.qtyRow}>
                  <Pressable style={styles.qtyBtn} onPress={() => decQty(it.id)} hitSlop={8}>
                    <Feather name="minus" size={14} color={Colors.light.text} />
                  </Pressable>
                  <Text style={styles.qtyText}>{it.quantity}</Text>
                  <Pressable style={styles.qtyBtn} onPress={() => incQty(it.id)} hitSlop={8}>
                    <Feather name="plus" size={14} color={Colors.light.text} />
                  </Pressable>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => removeItem(it.id)}
                    hitSlop={10}
                  >
                    <Feather name="trash-2" size={14} color={Colors.light.danger} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.itemLineTotal}>
                ₹{lineTotal(it.price, it.quantity).toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text style={styles.amount}>₹{subtotal.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Discount</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Discount (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5"
            placeholderTextColor={Colors.light.textTertiary}
            keyboardType="decimal-pad"
            value={discountPercentInput}
            onChangeText={setDiscountPercentInput}
          />
          {discountPercent > 0 && (
            <Text style={styles.hint}>
              − ₹{manualDiscountAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })} (
              {discountPercent}%)
            </Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>Coupon</Text>
        <View style={styles.card}>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.input, styles.couponInput]}
              placeholder="Coupon code"
              placeholderTextColor={Colors.light.textTertiary}
              autoCapitalize="characters"
              value={couponInput}
              onChangeText={setCouponInput}
            />
            <Pressable style={styles.applyBtn} onPress={applyCoupon}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </Pressable>
          </View>
          {!!couponError && <Text style={styles.errorText}>{couponError}</Text>}
          <Text style={styles.couponHint}>
            Try: HERB10, TEA15, HONEY500, FIRST250
          </Text>
          {appliedCoupon && (
            <View style={styles.couponChip}>
              <Text style={styles.couponChipText}>
                {appliedCoupon.code} · {appliedCoupon.label}
              </Text>
              <Pressable onPress={clearCoupon} hitSlop={12}>
                <Feather name="x" size={16} color={Colors.light.danger} />
              </Pressable>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>Address</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Customer name"
            placeholderTextColor={Colors.light.textTertiary}
            value={address.deliveryName}
            onChangeText={(t) => setAddress((p) => ({ ...p, deliveryName: t }))}
          />

          <View style={{ height: 12 }} />
          <Text style={styles.fieldLabel}>H.no / Door no / Flat no</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 12B"
            placeholderTextColor={Colors.light.textTertiary}
            value={address.houseNo}
            onChangeText={(t) => setAddress((p) => ({ ...p, houseNo: t }))}
          />

          <View style={{ height: 12 }} />
          <Text style={styles.fieldLabel}>Street / Apartment name</Text>
          <TextInput
            style={styles.input}
            placeholder="Street, apartment, area"
            placeholderTextColor={Colors.light.textTertiary}
            value={address.street}
            onChangeText={(t) => setAddress((p) => ({ ...p, street: t }))}
          />

          <View style={{ height: 12 }} />
          <Text style={styles.fieldLabel}>Landmark</Text>
          <TextInput
            style={styles.input}
            placeholder="Near..."
            placeholderTextColor={Colors.light.textTertiary}
            value={address.landmark}
            onChangeText={(t) => setAddress((p) => ({ ...p, landmark: t }))}
          />

          <View style={{ height: 12 }} />
          <Text style={styles.fieldLabel}>Village / Town / City</Text>
          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor={Colors.light.textTertiary}
            value={address.city}
            onChangeText={(t) => setAddress((p) => ({ ...p, city: t }))}
          />

          <View style={{ height: 12 }} />
          <Text style={styles.fieldLabel}>State</Text>
          <Pressable
            style={({ pressed }) => [styles.input, styles.dropdownLike, pressed && { opacity: 0.92 }]}
            onPress={() => setStatePickerOpen(true)}
          >
            <Text style={[styles.dropdownText, !address.state?.trim() && { color: Colors.light.textTertiary }]}>
              {address.state?.trim() ? address.state : "Select state"}
            </Text>
            <Feather name="chevron-down" size={18} color={Colors.light.textSecondary} />
          </Pressable>

          <View style={{ height: 12 }} />
          <Text style={styles.fieldLabel}>Pincode</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit pincode"
            placeholderTextColor={Colors.light.textTertiary}
            keyboardType="number-pad"
            value={address.pincode}
            onChangeText={(t) => setAddress((p) => ({ ...p, pincode: t }))}
            maxLength={6}
          />
          {pincodeLookupLoading ? (
            <Text style={styles.lookupHint}>Looking up pincode…</Text>
          ) : pincodeLookupError ? (
            <Text style={styles.errorText}>{pincodeLookupError}</Text>
          ) : (
            <Text style={styles.lookupHint}>City & State auto-fill from pincode (if empty)</Text>
          )}

          <View style={{ height: 12 }} />
          <Text style={styles.fieldLabel}>Alternative number</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor={Colors.light.textTertiary}
            keyboardType="phone-pad"
            value={address.alternatePhone}
            onChangeText={(t) => setAddress((p) => ({ ...p, alternatePhone: t }))}
          />
        </View>

        <Text style={styles.sectionLabel}>Extra charges</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Delivery charges</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 50"
            placeholderTextColor={Colors.light.textTertiary}
            keyboardType="decimal-pad"
            value={deliveryChargesInput}
            onChangeText={setDeliveryChargesInput}
          />

          <View style={{ height: 12 }} />
          <Text style={styles.fieldLabel}>Additional charges</Text>
          <TextInput
            style={styles.input}
            placeholder="Packing / courier / other"
            placeholderTextColor={Colors.light.textTertiary}
            keyboardType="decimal-pad"
            value={additionalChargesInput}
            onChangeText={setAdditionalChargesInput}
          />
        </View>

        <Text style={styles.sectionLabel}>Remarks</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Packing / dispatch instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. particular courier, add sample, dispatch next week…"
            placeholderTextColor={Colors.light.textTertiary}
            value={remarks}
            onChangeText={setRemarks}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.muted}>After discount</Text>
            <Text style={styles.amount}>₹{afterManual.toLocaleString("en-IN")}</Text>
          </View>
          {appliedCoupon ? (
            <View style={styles.rowBetween}>
              <Text style={styles.muted}>Coupon ({appliedCoupon.code})</Text>
              <Text style={[styles.amount, { color: Colors.light.success }]}>
                − ₹{couponAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </Text>
            </View>
          ) : null}
          {deliveryCharges > 0 ? (
            <View style={styles.rowBetween}>
              <Text style={styles.muted}>Delivery charges</Text>
              <Text style={styles.amount}>₹{deliveryCharges.toLocaleString("en-IN")}</Text>
            </View>
          ) : null}
          {additionalCharges > 0 ? (
            <View style={styles.rowBetween}>
              <Text style={styles.muted}>Additional charges</Text>
              <Text style={styles.amount}>₹{additionalCharges.toLocaleString("en-IN")}</Text>
            </View>
          ) : null}
          <View style={styles.summaryDivider} />
          <View style={styles.rowBetween}>
            <Text style={styles.grandLabel}>Amount payable</Text>
            <Text style={styles.grandValue}>
              ₹{amountPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.payBtn,
            pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
          ]}
          onPress={openPaymentMethods}
        >
          <Feather name="credit-card" size={20} color="#fff" />
          <Text style={styles.payBtnText}>Make payment</Text>
        </Pressable>
        <Text style={styles.razorpayNote}>
          Choose payment via secure link or PhonePe with screenshot upload.
        </Text>
      </ScrollView>

      <Modal visible={methodSheetOpen} transparent animationType="slide" onRequestClose={() => setMethodSheetOpen(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setMethodSheetOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Choose payment method</Text>
                <Text style={styles.methodSubtitle}>
                  ₹{amountPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })} payable
                </Text>
              </View>
              <Pressable onPress={() => setMethodSheetOpen(false)} hitSlop={12}>
                <Feather name="x" size={20} color={Colors.light.text} />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.methodCard, pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] }]}
              onPress={choosePayLink}
            >
              <View style={[styles.methodIcon, { backgroundColor: "#E8F0FE" }]}>
                <Feather name="link-2" size={22} color="#1A2B6B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>Pay via Link</Text>
                <Text style={styles.methodDesc}>Open the secure Razorpay checkout (UPI, Card, Netbanking).</Text>
              </View>
              <Feather name="chevron-right" size={20} color={Colors.light.textTertiary} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.methodCard, pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] }]}
              onPress={choosePayPhonePe}
            >
              <View style={[styles.methodIcon, { backgroundColor: "#EDE5FF" }]}>
                <Feather name="smartphone" size={22} color="#5F259F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>Pay via PhonePe</Text>
                <Text style={styles.methodDesc}>Pay to UPI ID and upload payment screenshot for confirmation.</Text>
              </View>
              <Feather name="chevron-right" size={20} color={Colors.light.textTertiary} />
            </Pressable>

            <Text style={styles.methodFootnote}>
              Address will be used for delivery after payment is confirmed.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={phonePeOpen}
        transparent
        animationType="slide"
        onRequestClose={() => !phonePeConfirming && setPhonePeOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.phonePeHeader}>
              <View style={styles.phonePeBrand}>
                <View style={styles.phonePeMark}>
                  <Text style={styles.phonePeMarkText}>P</Text>
                </View>
                <View>
                  <Text style={styles.phonePeTitle}>PhonePe Payment</Text>
                  <Text style={styles.phonePeSub}>Verify by screenshot</Text>
                </View>
              </View>
              <Pressable
                onPress={() => !phonePeConfirming && setPhonePeOpen(false)}
                hitSlop={12}
              >
                <Feather name="x" size={22} color="#fff" />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 560 }}
              contentContainerStyle={styles.phonePeBody}
              showsVerticalScrollIndicator={false}
            >
              {phonePeDone ? (
                <View style={styles.phonePeSuccessWrap}>
                  <View style={styles.phonePeSuccessIcon}>
                    <Feather name="check" size={36} color="#fff" />
                  </View>
                  <Text style={styles.phonePeSuccessTitle}>Payment Received</Text>
                  <Text style={styles.phonePeSuccessSub}>
                    ₹{amountPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })} confirmed via PhonePe.
                  </Text>
                  {phonePeImage ? (
                    <View style={styles.phonePeReceiptThumbWrap}>
                      <Image source={{ uri: phonePeImage }} style={styles.phonePeReceiptThumb} />
                      <Text style={styles.phonePeReceiptCaption}>Screenshot saved with order</Text>
                    </View>
                  ) : null}

                  <Pressable style={styles.phonePeDoneBtn} onPress={closePhonePeAndExit}>
                    <Feather name="check-circle" size={18} color="#fff" />
                    <Text style={styles.phonePeDoneBtnText}>Done</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.phonePeAmountWrap}>
                    <Text style={styles.phonePeAmountLabel}>Amount to pay</Text>
                    <Text style={styles.phonePeAmount}>
                      ₹{amountPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.phonePeMerchant}>{MERCHANT_NAME}</Text>
                  </View>

                  <View style={styles.upiRow}>
                    <View style={styles.upiIcon}>
                      <Feather name="at-sign" size={16} color="#5F259F" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upiLabel}>UPI ID</Text>
                      <Text style={styles.upiValue}>{MERCHANT_UPI_ID}</Text>
                    </View>
                    <View style={styles.upiBadge}>
                      <Feather name="shield" size={12} color={Colors.light.success} />
                      <Text style={styles.upiBadgeText}>Verified</Text>
                    </View>
                  </View>

                  <View style={styles.stepsCard}>
                    <Text style={styles.stepsTitle}>How to pay</Text>
                    <View style={styles.stepRow}>
                      <View style={styles.stepBullet}><Text style={styles.stepNum}>1</Text></View>
                      <Text style={styles.stepText}>Open PhonePe and pay ₹{amountPayable.toLocaleString("en-IN")} to <Text style={styles.stepBold}>{MERCHANT_UPI_ID}</Text>.</Text>
                    </View>
                    <View style={styles.stepRow}>
                      <View style={styles.stepBullet}><Text style={styles.stepNum}>2</Text></View>
                      <Text style={styles.stepText}>Take a screenshot of the success page.</Text>
                    </View>
                    <View style={styles.stepRow}>
                      <View style={styles.stepBullet}><Text style={styles.stepNum}>3</Text></View>
                      <Text style={styles.stepText}>Upload the screenshot below and confirm.</Text>
                    </View>
                  </View>

                  {phonePeImage ? (
                    <View style={styles.uploadPreviewCard}>
                      <Image source={{ uri: phonePeImage }} style={styles.uploadPreviewImg} />
                      <View style={styles.uploadPreviewMeta}>
                        <Feather name="check-circle" size={16} color={Colors.light.success} />
                        <Text style={styles.uploadPreviewText}>Screenshot uploaded</Text>
                      </View>
                      <Pressable
                        onPress={pickPhonePeScreenshot}
                        style={({ pressed }) => [styles.reuploadBtn, pressed && { opacity: 0.9 }]}
                      >
                        <Feather name="refresh-ccw" size={14} color={Colors.light.text} />
                        <Text style={styles.reuploadText}>Replace</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={pickPhonePeScreenshot}
                      disabled={phonePeUploading}
                      style={({ pressed }) => [
                        styles.uploadBox,
                        pressed && !phonePeUploading && { opacity: 0.92 },
                      ]}
                    >
                      {phonePeUploading ? (
                        <ActivityIndicator color="#5F259F" />
                      ) : (
                        <>
                          <View style={styles.uploadIcon}>
                            <Feather name="upload-cloud" size={24} color="#5F259F" />
                          </View>
                          <Text style={styles.uploadTitle}>Upload payment screenshot</Text>
                          <Text style={styles.uploadHint}>PNG / JPG · From your gallery</Text>
                        </>
                      )}
                    </Pressable>
                  )}

                  <Pressable
                    onPress={confirmPhonePePayment}
                    disabled={!phonePeImage || phonePeConfirming}
                    style={({ pressed }) => [
                      styles.confirmBtn,
                      (!phonePeImage || phonePeConfirming) && styles.confirmBtnDisabled,
                      pressed && phonePeImage && !phonePeConfirming && { opacity: 0.92, transform: [{ scale: 0.99 }] },
                    ]}
                  >
                    {phonePeConfirming ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Feather name="check" size={18} color="#fff" />
                        <Text style={styles.confirmBtnText}>Confirm Payment</Text>
                      </>
                    )}
                  </Pressable>

                  <Text style={styles.phonePeFoot}>
                    By confirming, you certify the payment of ₹{amountPayable.toLocaleString("en-IN")} was completed via PhonePe.
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={razorpayOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.rzpHeader}>
              <Text style={styles.rzpTitle}>razorpay</Text>
              <Pressable
                onPress={() => !payLoading && setRazorpayOpen(false)}
                hitSlop={12}
              >
                <Feather name="x" size={22} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.rzpBody}>
              <Text style={styles.rzpMerchant}>{customer.company}</Text>
              <Text style={styles.rzpAmount}>
                ₹{amountPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.rzpSub}>
                Test mode · UPI / Card / Netbanking (simulated)
              </Text>
              {payLoading ? (
                <ActivityIndicator
                  size="large"
                  color="#3395FF"
                  style={{ marginTop: 24 }}
                />
              ) : (
                <Pressable style={styles.rzpPayBtn} onPress={confirmDemoPayment}>
                  <Text style={styles.rzpPayText}>Pay now</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={productSheetOpen} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setProductSheetOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add product</Text>
              <Pressable onPress={() => setProductSheetOpen(false)} hitSlop={12}>
                <Feather name="x" size={20} color={Colors.light.text} />
              </Pressable>
            </View>
            <View style={styles.sheetSearchRow}>
              <Feather name="search" size={16} color={Colors.light.textTertiary} />
              <TextInput
                style={styles.sheetSearchInput}
                placeholder="Search products..."
                placeholderTextColor={Colors.light.textTertiary}
                value={productSearch}
                onChangeText={setProductSearch}
              />
              {productSearch.length > 0 && (
                <Pressable onPress={() => setProductSearch("")} hitSlop={10}>
                  <Feather name="x" size={16} color={Colors.light.textTertiary} />
                </Pressable>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {filteredCatalog.map((p) => (
                <View key={p.name} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                    <Text style={styles.productMeta}>
                      {p.category} · ₹{Number(p.price || 0).toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.productAddBtn, pressed && { opacity: 0.9 }]}
                    onPress={() => addProductToBill(p)}
                  >
                    <Text style={styles.productAddText}>Add</Text>
                  </Pressable>
                </View>
              ))}

              {filteredCatalog.length === 0 && (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: Colors.light.textSecondary }}>
                    No products found
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={statePickerOpen} transparent animationType="fade">
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setStatePickerOpen(false)} />
          <View style={[styles.sheet, { maxHeight: "70%" }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select state</Text>
              <Pressable onPress={() => setStatePickerOpen(false)} hitSlop={12}>
                <Feather name="x" size={20} color={Colors.light.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {INDIAN_STATES.map((s) => {
                const active = s === address.state;
                return (
                  <Pressable
                    key={s}
                    style={({ pressed }) => [
                      styles.stateRow,
                      active && styles.stateRowActive,
                      pressed && { opacity: 0.92 },
                    ]}
                    onPress={() => {
                      setAddress((p) => ({ ...p, state: s }));
                      setStatePickerOpen(false);
                    }}
                  >
                    <Text style={[styles.stateRowText, active && { color: Colors.light.accent }]}>
                      {s}
                    </Text>
                    {active ? <Feather name="check" size={18} color={Colors.light.accent} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  customerBanner: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  customerMeta: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  addProductBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addProductBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: Colors.light.text },
  itemQty: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 4 },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    minWidth: 20,
    textAlign: "center",
    fontWeight: "700",
    color: Colors.light.text,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  itemLineTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginVertical: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  muted: { fontSize: 14, color: Colors.light.textSecondary },
  amount: { fontSize: 15, fontWeight: "600", color: Colors.light.text },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.inputBg,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  textArea: {
    minHeight: 96,
  },
  dropdownLike: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "500",
  },
  lookupHint: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.light.success,
    fontWeight: "600",
  },
  couponRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  couponInput: { flex: 1 },
  applyBtn: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  errorText: { color: Colors.light.danger, marginTop: 8, fontSize: 13 },
  couponHint: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 10,
  },
  couponChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.light.successLight,
    borderRadius: 12,
  },
  couponChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.success,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.6,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginVertical: 12,
  },
  grandLabel: { fontSize: 16, fontWeight: "700", color: Colors.light.text },
  grandValue: { fontSize: 20, fontWeight: "800", color: Colors.light.accent },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  payBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  razorpayNote: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 8,
  },
  notFound: { fontSize: 16, color: Colors.light.textSecondary, marginTop: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: "80%",
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.divider,
    alignSelf: "center",
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.text,
  },
  sheetSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.light.inputBg,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    marginBottom: 12,
  },
  sheetSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  stateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  stateRowActive: {
    backgroundColor: "rgba(51,149,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderBottomColor: "transparent",
  },
  stateRowText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    flex: 1,
    paddingRight: 12,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
  },
  productMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  productAddBtn: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  productAddText: {
    color: "#fff",
    fontWeight: "700",
  },
  rzpHeader: {
    backgroundColor: "#1A2B6B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rzpTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  rzpBody: {
    padding: 24,
    alignItems: "center",
  },
  rzpMerchant: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  rzpAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 8,
  },
  rzpSub: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginBottom: 24,
  },
  rzpPayBtn: {
    backgroundColor: "#3395FF",
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  rzpPayText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  // Method picker
  methodSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontWeight: "600",
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    backgroundColor: Colors.light.card,
    marginBottom: 10,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
  },
  methodDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontWeight: "500",
  },
  methodFootnote: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },

  // PhonePe modal
  phonePeHeader: {
    backgroundColor: "#5F259F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  phonePeBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  phonePeMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  phonePeMarkText: {
    color: "#5F259F",
    fontSize: 18,
    fontWeight: "900",
  },
  phonePeTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  phonePeSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  phonePeBody: {
    padding: 18,
  },
  phonePeAmountWrap: {
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#FAF5FF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EDE5FF",
    marginBottom: 14,
  },
  phonePeAmountLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
  },
  phonePeAmount: {
    fontSize: 30,
    fontWeight: "900",
    color: "#5F259F",
    marginTop: 6,
    letterSpacing: -0.5,
  },
  phonePeMerchant: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontWeight: "600",
  },
  upiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    marginBottom: 14,
  },
  upiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EDE5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  upiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textTertiary,
    letterSpacing: 0.5,
  },
  upiValue: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
    marginTop: 2,
  },
  upiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.successLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  upiBadgeText: {
    color: Colors.light.success,
    fontSize: 10,
    fontWeight: "800",
  },
  stepsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    padding: 14,
    marginBottom: 14,
  },
  stepsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  stepBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EDE5FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNum: {
    color: "#5F259F",
    fontSize: 11,
    fontWeight: "900",
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  stepBold: {
    fontWeight: "800",
    color: "#5F259F",
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: "#5F259F",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF5FF",
    marginBottom: 14,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EDE5FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.light.text,
  },
  uploadHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontWeight: "600",
  },
  uploadPreviewCard: {
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    padding: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  uploadPreviewImg: {
    width: "100%",
    aspectRatio: 0.7,
    maxHeight: 320,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    resizeMode: "cover",
  },
  uploadPreviewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  uploadPreviewText: {
    color: Colors.light.success,
    fontSize: 13,
    fontWeight: "800",
  },
  reuploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    marginTop: 10,
  },
  reuploadText: {
    color: Colors.light.text,
    fontSize: 12,
    fontWeight: "700",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#5F259F",
    paddingVertical: 16,
    borderRadius: 16,
  },
  confirmBtnDisabled: {
    backgroundColor: "#B6A2D8",
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  phonePeFoot: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 12,
  },
  phonePeSuccessWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  phonePeSuccessIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.light.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  phonePeSuccessTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.light.text,
  },
  phonePeSuccessSub: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "600",
  },
  phonePeReceiptThumbWrap: {
    marginTop: 18,
    alignItems: "center",
  },
  phonePeReceiptThumb: {
    width: 140,
    height: 200,
    borderRadius: 14,
    resizeMode: "cover",
    backgroundColor: Colors.light.background,
  },
  phonePeReceiptCaption: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    marginTop: 8,
    fontWeight: "600",
  },
  phonePeDoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.success,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 22,
  },
  phonePeDoneBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
