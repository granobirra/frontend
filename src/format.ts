export type Segment = { start: string; end: string | null };
export type Suspension = { reason: string; at: string };

export type Commessa = {
  id: string;
  numero_commessa: string;
  product_type: "zattera" | "tuta" | "giubbotto";
  quantita: number;
  note: string;
  status: "attiva" | "in_pausa" | "sospesa" | "completata";
  segments: Segment[];
  suspensions: Suspension[];
  lunch_break_applied: boolean;
  created_at: string;
  completed_at: string | null;
  worked_seconds: number;
  net_seconds: number;
  operator_email: string;
};

export const LUNCH_BREAK_SECONDS = 3600;

export const SUSPENSION_REASONS = [
  "Attesa ricambi",
  "Guasto macchinario",
  "Pausa",
  "Mancanza materiale",
];

export const PRODUCT_LABELS: Record<string, string> = {
  zattera: "Zattere",
  tuta: "Tute da immersione",
  giubbotto: "Giubbotti di salvataggio",
};

export const STATUS_LABELS: Record<string, string> = {
  attiva: "Attiva",
  in_pausa: "In pausa",
  sospesa: "Sospesa",
  completata: "Completata",
};

export function productLabel(key: string): string {
  return PRODUCT_LABELS[key] || key;
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

// Live elapsed worked seconds computed from segments (open segment runs to now).
export function computeWorkedSeconds(segments: Segment[], nowMs: number): number {
  let total = 0;
  for (const seg of segments) {
    const start = new Date(seg.start).getTime();
    const end = seg.end ? new Date(seg.end).getTime() : nowMs;
    total += Math.max(0, Math.floor((end - start) / 1000));
  }
  return total;
}

export function computeNetSeconds(
  segments: Segment[],
  lunchApplied: boolean,
  nowMs: number,
): number {
  const worked = computeWorkedSeconds(segments, nowMs);
  return lunchApplied ? Math.max(0, worked - LUNCH_BREAK_SECONDS) : worked;
}

// HH:MM:SS
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

// 2h 34m
export function formatHM(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
