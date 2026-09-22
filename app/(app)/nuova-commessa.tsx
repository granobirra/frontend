import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Minus, Play, Plus } from "phosphor-react-native";
import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductIcon } from "@/src/components/product-icon";
import { Button } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { apiFetch } from "@/src/api";
import { type Commessa, PRODUCT_LABELS } from "@/src/format";
import { fonts } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

const PRODUCTS = Object.keys(PRODUCT_LABELS) as (keyof typeof PRODUCT_LABELS)[];

export default function NuovaCommessaScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [numero, setNumero] = useState("");
  const [product, setProduct] = useState<string>("zattera");
  const [quantita, setQuantita] = useState(1);
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<Commessa>("/commesse", {
        method: "POST",
        body: {
          numero_commessa: numero.trim(),
          product_type: product,
          quantita,
          note: note.trim(),
        },
      }),
    onSuccess: (created) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["commesse"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      showToast("Commessa avviata", "success");
      router.replace(`/commessa/${created.id}`);
    },
    onError: (e) => {
      showToast(e instanceof Error ? e.message : "Errore", "error");
    },
  });

  const onSubmit = () => {
    if (!numero.trim()) {
      showToast("Inserisci il numero commessa", "error");
      return;
    }
    mutation.mutate();
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
        <Text style={styles.headerTitle}>NUOVA COMMESSA</Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        bottomOffset={90}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Numero commessa</Text>
        <TextInput
          testID="numero-commessa-input"
          style={styles.input}
          placeholder="Es. 2024-0198"
          placeholderTextColor={colors.muted}
          value={numero}
          onChangeText={setNumero}
          autoCapitalize="characters"
        />

        <Text style={[styles.label, { marginTop: 20 }]}>Prodotto</Text>
        <View style={{ gap: 10 }}>
          {PRODUCTS.map((key) => {
            const selected = product === key;
            return (
              <Pressable
                key={key}
                testID={`product-option-${key}`}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setProduct(key);
                }}
                style={[styles.productCard, selected && styles.productCardSelected]}
              >
                <View style={[styles.productIconBox, selected && styles.productIconBoxSelected]}>
                  <ProductIcon
                    type={key}
                    size={24}
                    color={selected ? colors.onBrandPrimary : colors.brandPrimary}
                  />
                </View>
                <Text style={[styles.productLabel, selected && styles.productLabelSelected]}>
                  {PRODUCT_LABELS[key]}
                </Text>
                {selected ? (
                  <View style={styles.checkCircle}>
                    <Check size={16} color={colors.onBrandPrimary} weight="bold" />
                  </View>
                ) : (
                  <View style={styles.radioEmpty} />
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Quantità</Text>
        <View style={styles.stepper}>
          <Pressable
            testID="qty-minus"
            onPress={() => setQuantita((q) => Math.max(1, q - 1))}
            style={styles.stepBtn}
          >
            <Minus size={20} color={colors.onSurface} weight="bold" />
          </Pressable>
          <Text style={styles.stepValue}>{quantita}</Text>
          <Pressable
            testID="qty-plus"
            onPress={() => setQuantita((q) => Math.min(100000, q + 1))}
            style={styles.stepBtn}
          >
            <Plus size={20} color={colors.onSurface} weight="bold" />
          </Pressable>
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Note (opzionale)</Text>
        <TextInput
          testID="note-input"
          style={[styles.input, styles.textarea]}
          placeholder="Dettagli, riferimenti..."
          placeholderTextColor={colors.muted}
          value={note}
          onChangeText={setNote}
          multiline
        />
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: Platform.OS === "ios" ? 0 : 8 }}>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Button
            label="Avvia Commessa"
            testID="avvia-commessa-button"
            onPress={onSubmit}
            loading={mutation.isPending}
            icon={<Play size={20} color={colors.onBrandPrimary} weight="fill" />}
          />
        </View>
      </KeyboardStickyView>
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
  label: {
    fontFamily: fonts.text.semibold,
    fontSize: 13,
    color: colors.onSurfaceTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: fonts.text.regular,
    fontSize: 16,
    color: colors.onSurface,
    minHeight: 54,
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 68,
  },
  productCardSelected: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  productIconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  productIconBoxSelected: { backgroundColor: colors.brandPrimary },
  productLabel: {
    flex: 1,
    fontFamily: fonts.text.semibold,
    fontSize: 16,
    color: colors.onSurfaceSecondary,
  },
  productLabelSelected: { color: colors.onSurface },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioEmpty: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    fontFamily: fonts.display.bold,
    fontSize: 28,
    color: colors.onSurface,
    minWidth: 40,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
