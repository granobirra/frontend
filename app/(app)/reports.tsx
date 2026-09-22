import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChartBar, Export, UserCircle } from "phosphor-react-native";
import { useState } from "react";
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
import { useAuth } from "@/src/context/auth";
import { exportCommesseCsv } from "@/src/export";
import { type Commessa, formatDate, formatHM, productLabel } from "@/src/format";
import { fonts } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

type Member = {
  operator_id: string;
  operator_name: string;
  net_seconds: number;
  commesse_count: number;
};

type ReportData = {
  total_net_seconds: number;
  total_worked_seconds: number;
  total_commesse: number;
  completed_commesse: number;
  by_product: Record<string, number>;
  by_member?: Member[];
  items: Commessa[];
};

type Scope = "team" | "personal";

export default function ReportsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isDirector = user?.role === "direttore";
  const [scope, setScope] = useState<Scope>(isDirector ? "team" : "personal");
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", scope],
    queryFn: () =>
      apiFetch<ReportData>(scope === "team" ? "/team/reports" : "/reports"),
  });

  const onExport = async () => {
    if (!data || data.items.length === 0) {
      showToast("Nessun dato da esportare", "error");
      return;
    }
    setExporting(true);
    try {
      const res = await exportCommesseCsv(data.items);
      if (res === "downloaded") showToast("Report scaricato", "success");
      else if (res === "unavailable") showToast("Condivisione non disponibile", "error");
      else showToast("Report esportato", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Errore esportazione", "error");
    } finally {
      setExporting(false);
    }
  };

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
        <Text style={styles.headerTitle}>REPORT</Text>
      </View>

      {isDirector ? (
        <View style={styles.toggleWrap}>
          <Pressable
            testID="scope-team"
            onPress={() => setScope("team")}
            style={[styles.toggle, scope === "team" && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, scope === "team" && styles.toggleTextActive]}>
              Team
            </Text>
          </Pressable>
          <Pressable
            testID="scope-personal"
            onPress={() => setScope("personal")}
            style={[styles.toggle, scope === "personal" && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, scope === "personal" && styles.toggleTextActive]}>
              Personale
            </Text>
          </Pressable>
        </View>
      ) : null}

      {isLoading || !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : data.items.length === 0 ? (
        <View style={styles.center}>
          <ChartBar size={48} color={colors.muted} weight="light" />
          <Text style={styles.emptyText}>Nessun dato registrato</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCardWide}>
              <Text style={styles.summaryLabel}>
                {scope === "team" ? "TEMPO NETTO TEAM" : "TEMPO NETTO TOTALE"}
              </Text>
              <Text style={styles.summaryBig}>{formatHM(data.total_net_seconds)}</Text>
              <Text style={styles.summaryHint}>
                Lordo {formatHM(data.total_worked_seconds)} (pause pranzo dedotte)
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>COMMESSE</Text>
              <Text style={styles.summaryMid}>{data.total_commesse}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>COMPLETATE</Text>
              <Text style={styles.summaryMid}>{data.completed_commesse}</Text>
            </View>
          </View>

          {scope === "team" && data.by_member && data.by_member.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Per tecnico</Text>
              <View style={styles.productGroup}>
                {data.by_member.map((m) => (
                  <View key={m.operator_id} style={styles.productRow}>
                    <View style={styles.productIconBox}>
                      <UserCircle size={22} color={colors.brandPrimary} weight="bold" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productRowLabel}>{m.operator_name || "—"}</Text>
                      <Text style={styles.memberSub}>{m.commesse_count} commesse</Text>
                    </View>
                    <Text style={styles.productRowTime}>{formatHM(m.net_seconds)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Per prodotto</Text>
          <View style={styles.productGroup}>
            {Object.entries(data.by_product).map(([key, seconds]) => (
              <View key={key} style={styles.productRow}>
                <View style={styles.productIconBox}>
                  <ProductIcon type={key} size={20} color={colors.brandPrimary} />
                </View>
                <Text style={styles.productRowLabel}>{productLabel(key)}</Text>
                <Text style={styles.productRowTime}>{formatHM(seconds)}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Dettaglio commesse</Text>
          {data.items.map((c) => (
            <Pressable
              key={c.id}
              testID={`report-item-${c.id}`}
              onPress={() => router.push(`/commessa/${c.id}`)}
              style={styles.itemRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemNumero}>#{c.numero_commessa}</Text>
                <Text style={styles.itemSub}>
                  {scope === "team" ? `${c.operator_name} · ` : ""}
                  {productLabel(c.product_type)} · {formatDate(c.created_at)}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <StatusPill status={c.status} />
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.itemTime}>{formatHM(c.net_seconds)}</Text>
                {c.lunch_break_applied ? <Text style={styles.itemLunch}>-1h pranzo</Text> : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          label="Esporta Dati (CSV)"
          testID="export-button"
          onPress={onExport}
          loading={exporting}
          icon={<Export size={20} color={colors.onBrandPrimary} weight="bold" />}
        />
      </View>
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
  toggleWrap: {
    flexDirection: "row",
    gap: 6,
    margin: 16,
    marginBottom: 0,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 4,
  },
  toggle: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActive: { backgroundColor: colors.brandPrimary },
  toggleText: { fontFamily: fonts.text.semibold, fontSize: 14, color: colors.onSurfaceTertiary },
  toggleTextActive: { color: colors.onBrandPrimary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontFamily: fonts.text.regular, fontSize: 15, color: colors.muted },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  summaryCardWide: {
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    padding: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  summaryLabel: {
    fontFamily: fonts.text.semibold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.onSurfaceTertiary,
  },
  summaryBig: {
    fontFamily: fonts.display.bold,
    fontSize: 52,
    lineHeight: 56,
    color: colors.brandPrimary,
    marginTop: 4,
  },
  summaryMid: {
    fontFamily: fonts.display.bold,
    fontSize: 40,
    lineHeight: 44,
    color: colors.onSurface,
    marginTop: 4,
  },
  summaryHint: { fontFamily: fonts.text.regular, fontSize: 12, color: colors.muted, marginTop: 4 },
  sectionTitle: {
    fontFamily: fonts.text.semibold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.onSurfaceTertiary,
    marginTop: 24,
    marginBottom: 10,
  },
  productGroup: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  productIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  productRowLabel: { flex: 1, fontFamily: fonts.text.medium, fontSize: 15, color: colors.onSurface },
  memberSub: { fontFamily: fonts.text.regular, fontSize: 12, color: colors.muted, marginTop: 1 },
  productRowTime: { fontFamily: fonts.text.bold, fontSize: 16, color: colors.onSurface },
  itemRow: {
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
  itemNumero: { fontFamily: fonts.display.semibold, fontSize: 20, color: colors.onSurface },
  itemSub: {
    fontFamily: fonts.text.regular,
    fontSize: 13,
    color: colors.onSurfaceTertiary,
    marginTop: 1,
  },
  itemTime: { fontFamily: fonts.text.bold, fontSize: 18, color: colors.brandPrimary },
  itemLunch: { fontFamily: fonts.text.regular, fontSize: 11, color: colors.warning, marginTop: 2 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
