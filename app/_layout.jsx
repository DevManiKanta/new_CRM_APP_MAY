import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CustomerProvider } from "@/context/CustomerContext";
import { DrawerProvider, useDrawer } from "@/context/DrawerContext";
import DrawerMenu from "@/components/DrawerMenu";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const { isDrawerOpen, closeDrawer } = useDrawer();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup =
      segments[0] === "(tabs)" ||
      segments[0] === "customer" ||
      segments[0] === "punch" ||
      segments[0] === "attendance" ||
      segments[0] === "add-customer";

    if (!isAuthenticated && inAuthGroup) {
      router.replace("/");
    }
  }, [isAuthenticated, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, headerBackTitle: "Back" }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="punch" />
        <Stack.Screen name="attendance" />
        <Stack.Screen name="add-customer" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="customer/[id]" />
        <Stack.Screen name="customer/[id]/bill" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="profile" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings" options={{ presentation: "modal" }} />
      </Stack>
      {isAuthenticated && <DrawerMenu visible={isDrawerOpen} onClose={closeDrawer} />}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (Platform.OS !== "web") return;

    // Some environments (web) can't acquire Wake Lock, which can throw an unhandled
    // rejection from upstream tooling. We disable keep-awake and swallow only that
    // specific error so it doesn't crash the app.
    import("expo-keep-awake")
      .then((m) => m.deactivateKeepAwake?.())
      .catch(() => {});

    const handler = (event) => {
      const reason = event?.reason;
      const msg = typeof reason === "string" ? reason : reason?.message;
      if (typeof msg === "string" && msg.includes("Unable to activate keep awake")) {
        event.preventDefault?.();
      }
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CustomerProvider>
            <DrawerProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </DrawerProvider>
          </CustomerProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
