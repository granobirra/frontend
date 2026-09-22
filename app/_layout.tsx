import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { QueryClientProvider } from "@tanstack/react-query";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { ToastProvider } from "@/src/components/toast";
import { AuthProvider } from "@/src/context/auth";
import { fontAssets } from "@/src/fonts";
import { queryClient } from "@/src/query-client";
import { themes } from "@/src/theme";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: themes.light.surface }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: themes.light.surface }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <KeyboardProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <BottomSheetModalProvider>
                  <ToastProvider>
                    <StatusBar style="light" />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: themes.light.surface },
                        animation: "slide_from_right",
                      }}
                    />
                  </ToastProvider>
                </BottomSheetModalProvider>
              </AuthProvider>
            </QueryClientProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
