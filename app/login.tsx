import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { EnvelopeSimple, Lock, Timer } from "phosphor-react-native";
import { useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { useAuth } from "@/src/context/auth";
import { fonts } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

const AUTH_BG =
  "https://images.unsplash.com/photo-1778582384724-d6ce1dfe6df1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxpbmR1c3RyaWFsJTIwbWFudWZhY3R1cmluZyUyMHdvcmtlciUyMGRhcmt8ZW58MHx8fHwxNzg5MDU5MTIzfDA&ixlib=rb-4.1.0&q=85";

export default function LoginScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      showToast("Inserisci email e password", "error");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Accesso non riuscito", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Image source={{ uri: AUTH_BG }} style={styles.bg} contentFit="cover" />
      <LinearGradient
        colors={["rgba(17,19,21,0.4)", "rgba(17,19,21,0.85)", "#111315"]}
        locations={[0, 0.55, 1]}
        style={styles.scrim}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: 24 },
        ]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Timer size={24} color={colors.onBrandPrimary} weight="bold" />
          </View>
          <Text style={styles.appName}>TEMPI LAVORAZIONE</Text>
        </View>

        <View style={styles.spacer} />

        <Text style={styles.title}>Bentornato</Text>
        <Text style={styles.subtitle}>Accedi per gestire le tue commesse</Text>

        <View style={styles.form}>
          <View style={styles.inputRow}>
            <EnvelopeSimple size={20} color={colors.muted} />
            <TextInput
              testID="login-email-input"
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.inputRow}>
            <Lock size={20} color={colors.muted} />
            <TextInput
              testID="login-password-input"
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: Platform.OS === "ios" ? 0 : 8 }}>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Button
            label="Accedi"
            testID="login-submit-button"
            onPress={onSubmit}
            loading={loading}
          />
          <View style={styles.linkRow}>
            <Text style={styles.linkMuted}>Non hai un account? </Text>
            <Link href="/register" testID="go-to-register-link">
              <Text style={styles.link}>Registrati</Text>
            </Link>
          </View>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  bg: { position: "absolute", top: 0, left: 0, right: 0, height: "55%" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontFamily: fonts.display.bold,
    fontSize: 20,
    letterSpacing: 1,
    color: colors.onSurface,
  },
  spacer: { flex: 1, minHeight: 40 },
  title: {
    fontFamily: fonts.display.bold,
    fontSize: 40,
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: fonts.text.regular,
    fontSize: 15,
    color: colors.onSurfaceTertiary,
    marginTop: 2,
    marginBottom: 20,
  },
  form: { gap: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  input: {
    flex: 1,
    fontFamily: fonts.text.regular,
    fontSize: 16,
    color: colors.onSurface,
    paddingVertical: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.surface,
    gap: 14,
  },
  linkRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  linkMuted: { fontFamily: fonts.text.regular, color: colors.muted, fontSize: 14 },
  link: { fontFamily: fonts.text.semibold, color: colors.brandPrimary, fontSize: 14 },
}));
