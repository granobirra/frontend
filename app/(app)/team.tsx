import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CaretRight, UsersThree } from "phosphor-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductIcon } from "@/src/components/product-icon";
import { StatusPill } from "@/src/components/ui";
import { apiFetch } from "@/src/api";
import { useAuth } from "@/src/context/auth";
import {
  type Commessa,
  formatDate,
  formatHM,
  productLabel,
} from "@/src/format";
import { fonts } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

type Member = { id: string; nome: string; email: string; role: string };
type Station = { id: string; code: string; name: string; members: Member[] };

export default function TeamScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("all");

  const stationQ = useQuery({
    queryKey: ["station"],
    queryFn: () => apiFetch<Station>("/station"),
  });

  const commesseQ = useQuery({
    queryKey: ["team-commesse"],
    queryFn: () => apiFetch<Commessa[]>("/team/commesse"),
  });

  const members = stationQ.data?.members || [];
  const all = commesseQ.data || [];
  const filtered = filter === "all" ? all : all.filter((c) => c.operator_id === filter);
  const loading = stationQ.isLoading || commesseQ.isLoading;

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
        <View style={{ flex: 1 }}>
          <Text style={styles.hello} numberOfLines={1}>
            {stationQ.data?.name || user?.station_name || "Stazione"}
          </Text>
          <Text style={styles.headerTitle}>TEAM</Text>
        </View>
        <View style={styles.memberCount}>
          <UsersThree size={16} color={colors.onSurfaceSecondary} weight="bold" />
          <Text style={styles.memberCountText}>{members.length}</Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContent}
        >
          <Chip
            label="Tutti"
            active={filter === "all"}
            onPress={() => setFilter("all")}
            testID="team-filter-all"
          />
          {members.map((m) => (
            <Chip
              key={m.id}
              label={m.nome}
              active={filter === m.id}
              onPress={() => setFilter(m.id)}
              testID={`team-filter-${m.id}`}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl
              refreshing={commesseQ.isRefetching}
              onRefresh={() => {
                commesseQ.refetch();
                stationQ.refetch();
              }}
              tintColor={colors.brandPrimary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <UsersThree size={44} color={colors.muted} weight="light" />
              <Text style={styles.emptyText}>Nessuna commessa del team</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              testID={`team-commessa-${item.id}`}
              onPress={() => router.push(`/commessa/${item.id}`)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.rowIcon}>
                <ProductIcon type={item.product_type} size={22} color={colors.brandPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  #{item.numero_commessa}
                </Text>
                <View style={styles.operatorBadge}>
                  <Text style={styles.operatorText} numberOfLines={1}>
                    {item.operator_name || item.operator_email}
                  </Text>
                </View>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {productLabel(item.product_type)} · {formatDate(item.created_at)}
                </Text>
                <View style={styles.rowBottom}>
                  <StatusPill status={item.status} />
                  <Text style={styles.rowTime}>{formatHM(item.net_seconds)}</Text>
                </View>
              </View>
              <CaretRight size={18} color={colors.muted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
}) {
  const styles = useStyles();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
  hello: { fontFamily: fonts.text.regular, fontSize: 13, color: colors.onSurfaceTertiary },
  headerTitle: {
    fontFamily: fonts.display.bold,
    fontSize: 28,
    letterSpacing: 1,
    color: colors.onSurface,
    lineHeight: 30,
  },
  memberCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 999,
  },
  memberCountText: { fontFamily: fonts.text.bold, fontSize: 15, color: colors.onSurfaceSecondary },
  chipRow: {
    height: 56,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  chip: {
    flexShrink: 0,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 160,
  },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontFamily: fonts.text.semibold, fontSize: 14, color: colors.onSurfaceTertiary },
  chipTextActive: { color: colors.onBrandPrimary },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyBox: { alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 80 },
  emptyText: { fontFamily: fonts.text.regular, fontSize: 15, color: colors.muted },
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
  rowTitle: { fontFamily: fonts.display.semibold, fontSize: 20, color: colors.onSurface },
  operatorBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  operatorText: { fontFamily: fonts.text.semibold, fontSize: 12, color: colors.onSurfaceTertiary },
  rowSub: {
    fontFamily: fonts.text.regular,
    fontSize: 13,
    color: colors.onSurfaceTertiary,
    marginTop: 4,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  rowTime: { fontFamily: fonts.text.semibold, fontSize: 14, color: colors.onSurfaceSecondary },
}));
