import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import {
  EnvelopeSimple,
  Lock,
  Buildings,
  Hash,
  User as UserIcon,
  UsersThree,
} from "phosphor-react-native";
import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
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

type Role = "direttore" | "tecnico";

export default function RegisterScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<Role>("direttore");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stationName, setStationName] = useState("");
  const [stationCode, setStationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!nome.trim() || !email.trim() || !password) {
      showToast("Compila tutti i campi", "error");
      return;
    }
    if (password.length < 6) {
      showToast("La password deve avere almeno 6 caratteri", "error");
      return;
    }
    if (role === "direttore" && !stationName.trim()) {
      showToast("Inserisci il nome della stazione", "error");
      return;
    }
    if (role === "tecnico" && !stationCode.trim()) {
      showToast("Inserisci il codice stazione", "error");
      return;
    }
    setLoading(true);
    try {
      await register({
        nome: nome.trim(),
        email: email.trim(),
        password,
        role,
        station_name: role === "direttore" ? stationName.trim() : undefined,
        station_code: role === "tecnico" ? stationCode.trim() : undefined,
      });
      router.replace("/dashboard");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Registrazione non riuscita", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Image source={{ uri: AUTH_BG }} style={styles.bg} contentFit="cover" />
      <LinearGradient
        colors={["rgba(17,19,21,0.5)", "rgba(17,19,21,0.9)", "#111315"]}
        locations={[0, 0.45, 1]}
        style={styles.scrim}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 32, paddingBottom: 24 },
        ]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Crea account</Text>
        <Text style={styles.subtitle}>Scegli il tuo ruolo</Text>

        <View style={styles.roleRow}>
          <RoleCard
            active={role === "direttore"}
            onPress={() => setRole("direttore")}
            icon={
              <Buildings
                size={22}
                color={role === "direttore" ? colors.onBrandPrimary : colors.brandPrimary}
                weight="bold"
              />
            }
            title="Direttore"
            desc="Crea la stazione"
            testID="role-direttore"
          />
          <RoleCard
            active={role === "tecnico"}
            onPress={() => setRole("tecnico")}
            icon={
              <UsersThree
                size={22}
                color={role === "tecnico" ? colors.onBrandPrimary : colors.brandPrimary}
                weight="bold"
              />
            }
            title="Tecnico"
            desc="Unisciti con codice"
            testID="role-tecnico"
          />
        </View>

        <View style={styles.form}>
          <Field icon={<UserIcon size={20} color={colors.muted} />}>
            <TextInput
              testID="register-nome-input"
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor={colors.muted}
              value={nome}
              onChangeText={setNome}
            />
          </Field>
          <Field icon={<EnvelopeSimple size={20} color={colors.muted} />}>
            <TextInput
              testID="register-email-input"
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </Field>
          <Field icon={<Lock size={20} color={colors.muted} />}>
            <TextInput
              testID="register-password-input"
              style={styles.input}
              placeholder="Password (min 6 caratteri)"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </Field>

          {role === "direttore" ? (
            <Field icon={<Buildings size={20} color={colors.muted} />}>
              <TextInput
                testID="register-station-name-input"
                style={styles.input}
                placeholder="Nome stazione (es. Stazione Genova)"
                placeholderTextColor={colors.muted}
                value={stationName}
                onChangeText={setStationName}
              />
            </Field>
          ) : (
            <Field icon={<Hash size={20} color={colors.muted} />}>
              <TextInput
                testID="register-station-code-input"
                style={styles.input}
                placeholder="Codice stazione"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                value={stationCode}
                onChangeText={setStationCode}
              />
            </Field>
          )}
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: Platform.OS === "ios" ? 0 : 8 }}>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Button
            label="Registrati"
            testID="register-submit-button"
            onPress={onSubmit}
            loading={loading}
          />
          <View style={styles.linkRow}>
            <Text style={styles.linkMuted}>Hai già un account? </Text>
            <Link href="/login" testID="go-to-login-link">
              <Text style={styles.link}>Accedi</Text>
            </Link>
          </View>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

function RoleCard({
  active,
  onPress,
  icon,
  title,
  desc,
  testID,
}: {
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  testID: string;
}) {
  const styles = useStyles();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[styles.roleCard, active && styles.roleCardActive]}
    >
      <View style={[styles.roleIconBox, active && styles.roleIconBoxActive]}>{icon}</View>
      <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{title}</Text>
      <Text style={styles.roleDesc}>{desc}</Text>
    </Pressable>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.inputRow}>
      {icon}
      {children}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  bg: { position: "absolute", top: 0, left: 0, right: 0, height: "35%" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "flex-end" },
  title: { fontFamily: fonts.display.bold, fontSize: 40, color: colors.onSurface },
  subtitle: {
    fontFamily: fonts.text.regular,
    fontSize: 15,
    color: colors.onSurfaceTertiary,
    marginTop: 2,
    marginBottom: 16,
  },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: "flex-start",
    gap: 8,
  },
  roleCardActive: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconBoxActive: { backgroundColor: colors.brandPrimary },
  roleTitle: { fontFamily: fonts.text.bold, fontSize: 16, color: colors.onSurfaceSecondary },
  roleTitleActive: { color: colors.onSurface },
  roleDesc: { fontFamily: fonts.text.regular, fontSize: 12, color: colors.muted },
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
