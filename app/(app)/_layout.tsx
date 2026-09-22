import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/context/auth";
import { useTheme } from "@/src/theme";

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
        }}
      >
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
