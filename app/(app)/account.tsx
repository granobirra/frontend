import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Buildings,
  EnvelopeSimple,
  SignOut,
  Trash,
  UserCircle,
} from "phosphor-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { useAuth } from "@/src/context/auth";
import { fonts } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

export default function AccountScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [deleting, setDeleting] = useState(false);
  const snapPoints = useMemo(() => ["42%"], []);

  const onLogout = useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout, router]);

  const onConfirmDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      sheetRef.current?.dismiss();
      showToast("Account eliminato", "info");
      router.replace("/login");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Errore", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteAccount, router, showToast]);

  const roleLabel = user?.role === "direttore" ? "Direttore" : "Tecnico";

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          testID="back-button"
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>ACCOUNT</Text>
      </View>

      <View style={{ padding: 16, paddingBottom: insets.bottom + 16, flex: 1 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <UserCircle size={40} color={colors.brandPrimary} weight="bold" />
          </View>
          <Text style={styles.name}>{user?.nome}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        </View>

        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <EnvelopeSimple size={20} color={colors.muted} />
            <Text style={styles.infoText}>{user?.email}</Text>
          </View>
          {user?.station_name ? (
            <View style={styles.infoRow}>
              <Buildings size={20} color={colors.muted} />
              <Text style={styles.infoText}>
                {user.station_name}
                {user.station_code ? ` · ${user.station_code}` : ""}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1 }} />

        <Button
          label="Esci"
          variant="secondary"
          testID="logout-button"
          onPress={onLogout}
          icon={<SignOut size={20} color={colors.onSurfaceSecondary} weight="bold" />}
        />
        <Pressable
          testID="delete-account-button"
          onPress={() => sheetRef.current?.present()}
          style={styles.deleteLink}
          hitSlop={8}
        >
          <Trash size={18} color={colors.error} weight="bold" />
          <Text style={styles.deleteLinkText}>Elimina account</Text>
        </Pressable>
      </View>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: colors.surfaceSecondary }}
        handleIndicatorStyle={{ backgroundColor: colors.borderStrong }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
      >
        <BottomSheetView style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.warnIcon}>
            <Trash size={28} color={colors.error} weight="bold" />
          </View>
          <Text style={styles.sheetTitle}>Eliminare l’account?</Text>
          <Text style={styles.sheetBody}>
            L’account e le tue commesse verranno rimossi. Questa azione non può essere annullata.
          </Text>
          <Button
            label="Elimina definitivamente"
            variant="danger"
            testID="confirm-delete-account-button"
            onPress={onConfirmDelete}
            loading={deleting}
          />
          <Pressable
            testID="cancel-delete-button"
            onPress={() => sheetRef.current?.dismiss()}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelText}>Annulla</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fonts.display.bold,
    fontSize: 24,
    letterSpacing: 1,
    color: colors.onSurface,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 10,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontFamily: fonts.display.bold, fontSize: 26, color: colors.onSurface },
  roleBadge: {
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  roleText: { fontFamily: fonts.text.semibold, fontSize: 13, color: colors.onBrandTertiary },
  infoList: { marginTop: 16, gap: 10 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  infoText: { fontFamily: fonts.text.medium, fontSize: 15, color: colors.onSurfaceSecondary, flex: 1 },
  deleteLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 4,
  },
  deleteLinkText: { fontFamily: fonts.text.semibold, fontSize: 15, color: colors.error },
  sheet: { paddingHorizontal: 20, paddingTop: 8, alignItems: "center", gap: 12 },
  warnIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#2A1315",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontFamily: fonts.display.bold, fontSize: 24, color: colors.onSurface },
  sheetBody: {
    fontFamily: fonts.text.regular,
    fontSize: 14,
    color: colors.onSurfaceTertiary,
    textAlign: "center",
    marginBottom: 8,
  },
  cancelBtn: { paddingVertical: 12 },
  cancelText: { fontFamily: fonts.text.semibold, fontSize: 15, color: colors.onSurfaceTertiary },
}));
