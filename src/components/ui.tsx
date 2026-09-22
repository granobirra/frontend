import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from "react-native";

import { fonts } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

type Variant = "primary" | "secondary" | "danger" | "success";

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  testID?: string;
  style?: ViewStyle;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  const bg = {
    primary: colors.brandPrimary,
    secondary: colors.surfaceTertiary,
    danger: colors.error,
    success: colors.success,
  }[variant];
  const fg = {
    primary: colors.onBrandPrimary,
    secondary: colors.onSurfaceSecondary,
    danger: colors.onError,
    success: colors.onSuccess,
  }[variant];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.inner}>
          {icon}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles = useStyles();
  const { colors } = useTheme();

  const map: Record<string, { bg: string; fg: string; label: string }> = {
    attiva: { bg: colors.brandTertiary, fg: colors.onBrandTertiary, label: "Attiva" },
    in_pausa: { bg: colors.surfaceTertiary, fg: colors.onSurfaceTertiary, label: "In pausa" },
    sospesa: { bg: "#3A2E1A", fg: colors.warning, label: "Sospesa" },
    completata: { bg: "#12241A", fg: colors.success, label: "Completata" },
  };
  const s = map[status] || map.in_pausa;

  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.fg }]} />
      <Text style={[styles.pillText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  button: {
    minHeight: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
  label: {
    fontFamily: fonts.text.semibold,
    fontSize: 16,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  dot: { width: 7, height: 7, borderRadius: 999 },
  pillText: {
    fontFamily: fonts.text.semibold,
    fontSize: 12,
  },
}));
