import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  CaretRight,
  ChartBar,
  Copy,
  Plus,
  Timer,
  UserCircle,
  UsersThree,
} from "phosphor-react-native";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductIcon } from "@/src/components/product-icon";
import { StatusPill } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { useAuth } from "@/src/context/auth";
import { apiFetch } from "@/src/api";
import {
  type Commessa,
  computeNetSeconds,
  formatClock,
  formatDate,
  formatHM,
  productLabel,
} from "@/src/format";
import { useNow } from "@/src/hooks/use-now";
import { makeStyles, useTheme } from "@/src/theme";
import { fonts } from "@/src/fonts";

const fontsDisplay = fonts.display;
const fontsText = fonts.text;

const EMPTY_IMG =
  "https://images.unsplash.com/photo-1759823320809-e01031f93ead?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxsaWZlJTIwcmFmdCUyMHNhZmV0eSUyMG9yYW5nZXxlbnwwfHx8fDE3ODkwNTkxMjl8MA&ixlib=rb-4.1.0&q=85";

export default function DashboardScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isDirector = user?.role === "direttore";

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["commesse"],
    queryFn: () => apiFetch<Commessa[]>("/commesse"),
  });

  const commesse = data || [];
  const active = commesse.find((c) => c.status === "attiva" || c.status === "in_pausa");
  const others = commesse.filter((c) => c.id !== active?.id);

  const onCopyCode = useCallback(async () => {
    if (!user?.station_code) return;
    await Clipboard.setStringAsync(user.station_code);
    showToast("Codice stazione copiato", "success");
  }, [user?.station_code, showToast]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello} numberOfLines={1}>
            {isDirector ? "Direttore · " : ""}
            {user?.nome || "Operatore"}
          </Text>
          <Text style={styles.headerTitle}>COMMESSE</Text>
        </View>
        {isDirector ? (
          <Pressable
            testID="team-button"
            onPress={() => router.push("/team")}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <UsersThree size={22} color={colors.onSurface} weight="bold" />
          </Pressable>
        ) : null}
        <Pressable
          testID="reports-button"
          onPress={() => router.push("/reports")}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <ChartBar size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Pressable
          testID="account-button"
          onPress={() => router.push("/account")}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <UserCircle size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Impossibile caricare le commesse</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn} testID="retry-button">
            <Text style={styles.retryText}>Riprova</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={others}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 96,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.brandPrimary}
            />
          }
          ListHeaderComponent={
            <View>
              {isDirector && user?.station_code ? (
                <Pressable
                  testID="station-code-banner"
                  onPress={onCopyCode}
                  style={styles.codeBanner}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.codeLabel}>
                      {user.station_name || "La tua stazione"} · CODICE
                    </Text>
                    <Text style={styles.codeValue}>{user.station_code}</Text>
                  </View>
                  <View style={styles.copyBtn}>
                    <Copy size={16} color={colors.onBrandPrimary} weight="bold" />
                    <Text style={styles.copyText}>Copia</Text>
                  </View>
                </Pressable>
              ) : null}
              {active ? (
                <ActiveTimerCard commessa={active} onPress={() => router.push(`/commessa/${active.id}`)} />
              ) : null}
              {others.length > 0 ? (
                <Text style={styles.sectionTitle}>
                  {active ? "Altre commesse" : "Le tue commesse"}
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            active ? null : (
              <View style={styles.empty}>
                <Image source={{ uri: EMPTY_IMG }} style={styles.emptyImg} contentFit="cover" />
                <View style={styles.emptyOverlay} />
                <View style={styles.emptyContent}>
                  <Text style={styles.emptyTitle}>Nessuna commessa attiva</Text>
                  <Text style={styles.emptySub}>
                    Avvia una nuova commessa per iniziare a tracciare i tempi.
                  </Text>
                </View>
              </View>
            )
          }
          renderItem={({ item }) => (
            <CommessaRow commessa={item} onPress={() => router.push(`/commessa/${item.id}`)} />
          )}
        />
      )}

      <View style={[styles.fabWrap, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          testID="nuova-commessa-button"
          onPress={() => router.push("/nuova-commessa")}
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
        >
          <Plus size={22} color={colors.onBrandPrimary} weight="bold" />
          <Text style={styles.fabText}>Nuova Commessa</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ActiveTimerCard({ commessa, onPress }: { commessa: Commessa; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const running = commessa.status === "attiva";
  const now = useNow(running);
  const net = computeNetSeconds(commessa.segments, commessa.lunch_break_applied, now);

  return (
    <Pressable testID="active-timer-card" onPress={onPress} style={styles.activeCard}>
      <View style={styles.activeTopRow}>
        <View style={styles.activeBadge}>
          <Timer size={14} color={colors.onBrandPrimary} weight="bold" />
          <Text style={styles.activeBadgeText}>
            {running ? "IN CORSO" : "IN PAUSA"}
          </Text>
        </View>
        <StatusPill status={commessa.status} />
      </View>

      <Text style={styles.activeClock}>{formatClock(net)}</Text>

      <View style={styles.activeMeta}>
        <ProductIcon type={commessa.product_type} size={18} color={colors.onBrandTertiary} />
        <Text style={styles.activeMetaText} numberOfLines={1}>
          {productLabel(commessa.product_type)} · #{commessa.numero_commessa}
        </Text>
      </View>
      {commessa.lunch_break_applied ? (
        <Text style={styles.lunchNote}>Pausa pranzo -1h applicata</Text>
      ) : null}
    </Pressable>
  );
}

function CommessaRow({ commessa, onPress }: { commessa: Commessa; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <Pressable
      testID={`commessa-row-${commessa.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.rowIcon}>
        <ProductIcon type={commessa.product_type} size={22} color={colors.brandPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          #{commessa.numero_commessa}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {productLabel(commessa.product_type)} · {formatDate(commessa.created_at)}
        </Text>
        <View style={styles.rowBottom}>
          <StatusPill status={commessa.status} />
          <Text style={styles.rowTime}>{formatHM(commessa.net_seconds)}</Text>
        </View>
      </View>
      <CaretRight size={18} color={colors.muted} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hello: { fontFamily: fontsText.regular, fontSize: 13, color: colors.onSurfaceTertiary },
  headerTitle: {
    fontFamily: fontsDisplay.bold,
    fontSize: 28,
    letterSpacing: 1,
    color: colors.onSurface,
    lineHeight: 30,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  errorText: { fontFamily: fontsText.regular, color: colors.muted, fontSize: 15 },
  retryBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { fontFamily: fontsText.semibold, color: colors.onBrandPrimary },
  sectionTitle: {
    fontFamily: fontsText.semibold,
    fontSize: 13,
    color: colors.onSurfaceTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 10,
  },
  codeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  codeLabel: {
    fontFamily: fontsText.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.onSurfaceTertiary,
    textTransform: "uppercase",
  },
  codeValue: {
    fontFamily: fontsDisplay.bold,
    fontSize: 30,
    letterSpacing: 4,
    color: colors.brandPrimary,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  copyText: { fontFamily: fontsText.semibold, fontSize: 13, color: colors.onBrandPrimary },
  activeCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    padding: 18,
    marginTop: 16,
  },
  activeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  activeBadgeText: {
    fontFamily: fontsText.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.onBrandPrimary,
  },
  activeClock: {
    fontFamily: fontsDisplay.bold,
    fontSize: 72,
    lineHeight: 78,
    color: colors.onSurface,
    fontVariant: ["tabular-nums"],
    marginTop: 6,
  },
  activeMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  activeMetaText: {
    fontFamily: fontsText.medium,
    fontSize: 15,
    color: colors.onSurfaceSecondary,
    flex: 1,
  },
  lunchNote: {
    fontFamily: fontsText.regular,
    fontSize: 12,
    color: colors.warning,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontFamily: fontsDisplay.semibold, fontSize: 20, color: colors.onSurface },
  rowSub: {
    fontFamily: fontsText.regular,
    fontSize: 13,
    color: colors.onSurfaceTertiary,
    marginTop: 1,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  rowTime: { fontFamily: fontsText.semibold, fontSize: 14, color: colors.onSurfaceSecondary },
  empty: {
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 24,
    justifyContent: "flex-end",
  },
  emptyImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  emptyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(17,19,21,0.65)",
  },
  emptyContent: { padding: 20 },
  emptyTitle: { fontFamily: fontsDisplay.bold, fontSize: 26, color: colors.onSurface },
  emptySub: {
    fontFamily: fontsText.regular,
    fontSize: 14,
    color: colors.onSurfaceSecondary,
    marginTop: 4,
  },
  fabWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    minHeight: 54,
    borderRadius: 12,
  },
  fabText: { fontFamily: fontsText.bold, fontSize: 16, color: colors.onBrandPrimary },
}));

