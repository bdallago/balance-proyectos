import type { Moneda } from "@/lib/supabase/database.types";

/**
 * Formato es-AR: miles con punto, decimales con coma.
 * ARS sin decimales, USD con dos.
 */

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const arsPlainFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const usdPlainFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const rateFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$ 1.234" para ARS, "US$ 1.234,56" para USD. */
export function formatMoney(value: number, moneda: Moneda): string {
  const safe = Number.isFinite(value) ? value : 0;
  return moneda === "ARS"
    ? arsFormatter.format(safe)
    : usdFormatter.format(safe);
}

/** Igual que formatMoney pero sin el símbolo, para inputs y tablas densas. */
export function formatAmount(value: number, moneda: Moneda): string {
  const safe = Number.isFinite(value) ? value : 0;
  return moneda === "ARS"
    ? arsPlainFormatter.format(safe)
    : usdPlainFormatter.format(safe);
}

/** Cotización: siempre dos decimales, con símbolo de peso. */
export function formatRate(value: number): string {
  return `$${rateFormatter.format(Number.isFinite(value) ? value : 0)}`;
}

/** Versión compacta para ejes de gráficos: $ 1,2 M / US$ 12,5 k */
export function formatCompact(value: number, moneda: Moneda): string {
  const symbol = moneda === "ARS" ? "$" : "US$";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  const compact = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 1,
  });

  if (abs >= 1_000_000_000)
    return `${sign}${symbol} ${compact.format(abs / 1_000_000_000)} MM`;
  if (abs >= 1_000_000)
    return `${sign}${symbol} ${compact.format(abs / 1_000_000)} M`;
  if (abs >= 1_000) return `${sign}${symbol} ${compact.format(abs / 1_000)} k`;
  return `${sign}${symbol} ${compact.format(abs)}`;
}

/**
 * Parsea un número escrito a la argentina: "1.234,56" → 1234.56
 * Tolerante: acepta también "1234.56" y "1234,56".
 */
export function parseAmount(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const cleaned = trimmed.replace(/[^\d.,-]/g, "");
  if (cleaned === "") return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let normalized: string;
  if (lastComma > lastDot) {
    // Coma decimal: los puntos son separadores de miles.
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // Punto decimal: las comas son separadores de miles.
    normalized = cleaned.replace(/,/g, "");
  } else {
    normalized = cleaned;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
