import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import {
  type Commessa,
  formatDateTime,
  formatHM,
  productLabel,
  statusLabel,
} from "@/src/format";

export type ExportResult = "shared" | "downloaded" | "unavailable";

export async function exportCommesseCsv(items: Commessa[]): Promise<ExportResult> {
  const header = [
    "Numero Commessa",
    "Operatore",
    "Prodotto",
    "Quantita",
    "Stato",
    "Creata",
    "Completata",
    "Tempo lordo",
    "Pausa pranzo",
    "Tempo netto",
    "Sospensioni",
  ];
  const rows = [
    header,
    ...items.map((c) => [
      c.numero_commessa,
      c.operator_name || c.operator_email,
      productLabel(c.product_type),
      String(c.quantita),
      statusLabel(c.status),
      formatDateTime(c.created_at),
      c.completed_at ? formatDateTime(c.completed_at) : "",
      formatHM(c.worked_seconds),
      c.lunch_break_applied ? "Si (-1h)" : "No",
      formatHM(c.net_seconds),
      c.suspensions.map((s) => s.reason).join("; "),
    ]),
  ];

  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const filename = `tempi-lavorazione-${Date.now()}.csv`;

  if (Platform.OS === "web") {
    const doc: any = (globalThis as any).document;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = doc.createElement("a");
    a.href = url;
    a.download = filename;
    doc.body.appendChild(a);
    a.click();
    doc.body.removeChild(a);
    URL.revokeObjectURL(url);
    return "downloaded";
  }

  const file = new File(Paths.cache, filename);
  try {
    file.create({ overwrite: true });
  } catch {
    // already exists
  }
  file.write("\uFEFF" + csv);

  const available = await Sharing.isAvailableAsync();
  if (!available) return "unavailable";
  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: "Esporta report",
    UTI: "public.comma-separated-values-text",
  });
  return "shared";
}
