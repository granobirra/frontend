import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  ForkKnife,
  Pause,
  Play,
  StopCircle,
  Trash,
  WarningCircle,
} from "phosphor-react-native";
import { useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductIcon } from "@/src/components/product-icon";
import { Button, StatusPill } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { apiFetch } from "@/src/api";
import {
  type Commessa,
  SUSPENSION_REASONS,
  computeNetSeconds,
  computeWorkedSeconds,
  formatClock,
  formatDateTime,
  formatHM,
  productLabel,
} from "@/src/format";
import { fonts } from "@/src/fonts";
import { useNow } from "@/src/hooks/use-now";
import { makeStyles, useTheme } from "@/src/theme";

export default function CommessaScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sheetRef = useRef<BottomSheetModal>(null);

  const { data: commessa, isLoading } = useQuery({
    queryKey: ["commessa", id],
    queryFn: () => apiFetch<Commessa>(`/commesse/${id}`),
    enabled: !!id,
  });

  const onMutated = useCallback(
    (updated: Commessa) => {
      queryClient.setQueryData(["commessa", id], updated);
      queryClient.invalidateQueries({ queryKey: ["commesse"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    [id, queryClient],
  );

  const action = (path: string, body?: unknown) =>
    apiFetch<Commessa>(`/commesse/${id}/${path}`, { method: "POST", body });

  const pauseM = useMutation({
    mutationFn: () => action("pause"),
    onSuccess: (u) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      onMutated(u);
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Errore", "error"),
  });

  const resumeM = useMutation({
    mutationFn: () => action("resume"),
    onSuccess: (u) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      onMutated(u);
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Errore", "error"),
  });

  const lunchM = useMutation({
    mutationFn: () => action("lunch"),
    onSuccess: (u) => {
      Haptics.selectionAsync().catch(() => {});
      onMutated(u);
      showToast(
        u.lunch_break_applied ? "Pausa pranzo applicata (-1h)" : "Pausa pranzo rimossa",
        "info",
      );
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Errore", "error"),
  });

  const suspendM = useMutation({
    mutationFn: (reason: string) => action("suspend", { reason }),
    onSuccess: (u) => {
      onMutated(u);
      showToast("Lavorazione sospesa", "info");
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Errore", "error"),
  });

  const completeM = useMutation({
    mutationFn: () => action("complete"),
    onSuccess: (u) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onMutated(u);
      showToast("Lavorazione completata", "success");
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Errore", "error"),
  });

  const deleteM = useMutation({
    mutationFn: () => apiFetch(`/commesse/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commesse"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      showToast("Commessa eliminata", "info");
      router.back();
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Errore", "error"),
  });

  const running = commessa?.status === "attiva";
  const now = useNow(running);
  const net = commessa
    ? computeNetSeconds(commessa.segments, commessa.lunch_break_applied, now)
    : 0;
  const worked = commessa ? computeWorkedSeconds(commessa.segments, now) : 0;

  const openSuspend = useCallback(() => sheetRef.current?.present(), []);
  const selectReason = useCallback(
    (reason: string) => {
      Haptics.selectionAsync().catch(() => {});
      sheetRef.current?.dismiss();
      suspendM.mutate(reason);
    },
    [suspendM],
  );

  const snapPoints = useMemo(() => ["55%"], []);

  if (isLoading || !commessa) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  const completed = commessa.status === "completata";
  const suspended = commessa.status === "sospesa";
  const lastReason = commessa.suspensions[commessa.suspensions.length - 1]?.reason;

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          #{commessa.numero_commessa}
        </Text>
        <Pressable
          testID="delete-button"
          onPress={() => deleteM.mutate()}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <Trash size={20} color={colors.error} weight="bold" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <View style={styles.productIconBox}>
            <ProductIcon type={commessa.product_type} size={22} color={colors.brandPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{productLabel(commessa.product_type)}</Text>
            <Text style={styles.productSub}>
              Quantità: {commessa.quantita} · {formatDateTime(commessa.created_at)}
            </Text>
          </View>
          <StatusPill status={commessa.status} />
        </View>

        <View style={styles.clockBox}>
          <Text style={styles.clockLabel}>
            {completed ? "TEMPO TOTALE" : running ? "TEMPO IN CORSO" : "TEMPO REGISTRATO"}
          </Text>
          <Text testID="live-clock" style={styles.clock}>
            {formatClock(net)}
          </Text>
          <View style={styles.clockMetaRow}>
            <Text style={styles.clockMeta}>Lordo {formatHM(worked)}</Text>
            {commessa.lunch_break_applied ? (
              <View style={styles.lunchTag}>
                <ForkKnife size={13} color={colors.warning} weight="bold" />
                <Text style={styles.lunchTagText}>Pausa pranzo -1h</Text>
              </View>
            ) : null}
          </View>
        </View>

        {suspended && lastReason ? (
          <View style={styles.suspendBanner} testID="suspension-banner">
            <WarningCircle size={20} color={colors.warning} weight="bold" />
            <Text style={styles.suspendBannerText}>Sospesa: {lastReason}</Text>
          </View>
        ) : null}

        {!completed ? (
          <View style={{ marginTop: 20, gap: 12 }}>
            <View style={styles.actionRow}>
              {running ? (
                <Button
                  label="Pausa"
                  variant="secondary"
                  testID="pause-button"
                  style={styles.flexBtn}
                  onPress={() => pauseM.mutate()}
                  loading={pauseM.isPending}
                  icon={<Pause size={20} color={colors.onSurfaceSecondary} weight="fill" />}
                />
              ) : (
                <Button
                  label="Riprendi"
                  variant="success"
                  testID="resume-button"
                  style={styles.flexBtn}
                  onPress={() => resumeM.mutate()}
                  loading={resumeM.isPending}
                  icon={<Play size={20} color={colors.onSuccess} weight="fill" />}
                />
              )}
              {!suspended ? (
                <Button
                  label="Sospendi"
                  variant="secondary"
                  testID="suspend-button"
                  style={styles.flexBtn}
                  onPress={openSuspend}
                  icon={<WarningCircle size={20} color={colors.onSurfaceSecondary} weight="bold" />}
                />
              ) : null}
            </View>

            <Pressable
              testID="lunch-toggle"
              onPress={() => lunchM.mutate()}
              style={[
                styles.lunchToggle,
                commessa.lunch_break_applied && styles.lunchToggleOn,
              ]}
            >
              <ForkKnife
                size={20}
                color={commessa.lunch_break_applied ? colors.onWarning : colors.onSurfaceSecondary}
                weight="bold"
              />
              <Text
                style={[
                  styles.lunchToggleText,
                  commessa.lunch_break_applied && { color: colors.onWarning },
                ]}
              >
                Pausa pranzo (-1h)
              </Text>
              <View
                style={[
                  styles.switchTrack,
                  commessa.lunch_break_applied && styles.switchTrackOn,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    commessa.lunch_break_applied && styles.switchThumbOn,
                  ]}
                />
              </View>
            </Pressable>

            <Button
              label="Fine Lavorazione"
              testID="complete-button"
              onPress={() => completeM.mutate()}
              loading={completeM.isPending}
              icon={<StopCircle size={22} color={colors.onBrandPrimary} weight="fill" />}
            />
          </View>
        ) : (
          <View style={styles.completedBox}>
            <CheckCircle size={22} color={colors.success} weight="fill" />
            <Text style={styles.completedText}>
              Completata il {commessa.completed_at ? formatDateTime(commessa.completed_at) : "-"}
            </Text>
          </View>
        )}

        {commessa.suspensions.length > 0 ? (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.historyTitle}>Storico sospensioni</Text>
            {commessa.suspensions.map((s, i) => (
              <View key={i} style={styles.historyRow}>
                <WarningCircle size={16} color={colors.warning} weight="bold" />
                <Text style={styles.historyReason}>{s.reason}</Text>
                <Text style={styles.historyTime}>{formatDateTime(s.at)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: colors.surfaceSecondary }}
        handleIndicatorStyle={{ backgroundColor: colors.borderStrong }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
          <Text style={styles.sheetTitle}>Motivo sospensione</Text>
          <View style={styles.sheetList}>
            {SUSPENSION_REASONS.map((reason) => (
              <Pressable
                key={reason}
                testID={`suspend-reason-${reason}`}
                onPress={() => selectReason(reason)}
                style={({ pressed }) => [styles.reasonRow, pressed && { opacity: 0.7 }]}
              >
                <WarningCircle size={20} color={colors.warning} weight="bold" />
                <Text style={styles.reasonText}>{reason}</Text>
              </Pressable>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center" },
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
    flex: 1,
    fontFamily: fonts.display.bold,
    fontSize: 24,
    letterSpacing: 0.5,
    color: colors.onSurface,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  productIconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: { fontFamily: fonts.text.semibold, fontSize: 16, color: colors.onSurface },
  productSub: {
    fontFamily: fonts.text.regular,
    fontSize: 12,
    color: colors.onSurfaceTertiary,
    marginTop: 2,
  },
  clockBox: {
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 20,
  },
  clockLabel: {
    fontFamily: fonts.text.semibold,
    fontSize: 13,
    letterSpacing: 1.2,
    color: colors.onSurfaceTertiary,
  },
  clock: {
    fontFamily: fonts.display.bold,
    fontSize: 88,
    lineHeight: 96,
    color: colors.onSurface,
    fontVariant: ["tabular-nums"],
  },
  clockMetaRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  clockMeta: { fontFamily: fonts.text.regular, fontSize: 14, color: colors.muted },
  lunchTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#3A2E1A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  lunchTagText: { fontFamily: fonts.text.semibold, fontSize: 12, color: colors.warning },
  suspendBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#3A2E1A",
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  suspendBannerText: { fontFamily: fonts.text.semibold, fontSize: 14, color: colors.warning, flex: 1 },
  actionRow: { flexDirection: "row", gap: 12 },
  flexBtn: { flex: 1 },
  lunchToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  lunchToggleOn: { backgroundColor: colors.warning, borderColor: colors.warning },
  lunchToggleText: {
    flex: 1,
    fontFamily: fonts.text.semibold,
    fontSize: 15,
    color: colors.onSurfaceSecondary,
  },
  switchTrack: {
    width: 46,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.surfaceTertiary,
    padding: 3,
    justifyContent: "center",
  },
  switchTrackOn: { backgroundColor: colors.onWarning },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.muted,
  },
  switchThumbOn: { backgroundColor: colors.warning, alignSelf: "flex-end" },
  completedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  completedText: { fontFamily: fonts.text.medium, fontSize: 14, color: colors.onSurfaceSecondary },
  historyTitle: {
    fontFamily: fonts.text.semibold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.onSurfaceTertiary,
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  historyReason: { flex: 1, fontFamily: fonts.text.medium, fontSize: 14, color: colors.onSurfaceSecondary },
  historyTime: { fontFamily: fonts.text.regular, fontSize: 12, color: colors.muted },
  sheetTitle: {
    fontFamily: fonts.display.bold,
    fontSize: 22,
    color: colors.onSurface,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sheetList: { paddingHorizontal: 16 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 56,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceTertiary,
    marginBottom: 10,
  },
  reasonText: { fontFamily: fonts.text.semibold, fontSize: 16, color: colors.onSurface },
}));
