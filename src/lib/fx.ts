import type { FxRate, Moneda } from "@/lib/supabase/database.types";

/**
 * Tipo de cambio.
 *
 * Regla central de la app: cada movimiento congela monto_ars, monto_usd,
 * tasa_usada y tasa_fecha en el momento de la carga. Los montos históricos
 * NUNCA se recalculan con la cotización actual.
 *
 * Referencia: dólar Oficial BNA, valor VENTA.
 */

/** Cotización aplicable a una fecha, con la fecha real de la que salió. */
export interface TasaAplicable {
  /** Valor venta del Oficial BNA. */
  valor: number;
  /** Fecha de la cotización usada. Puede ser anterior a la pedida. */
  fecha: string;
  /**
   * true cuando no había cotización exacta para la fecha pedida y se cayó
   * a la última anterior (fin de semana, feriado o carga retroactiva).
   * La UI lo indica bajo el input.
   */
  esAproximada: boolean;
}

/**
 * Busca la cotización aplicable a `fecha` dentro de una lista ya cargada.
 * Devuelve la de esa fecha o la última anterior disponible.
 *
 * `rates` debe venir ordenada por fecha ascendente.
 */
export function resolverTasa(
  rates: Pick<FxRate, "fecha" | "venta">[],
  fecha: string,
): TasaAplicable | null {
  let elegida: Pick<FxRate, "fecha" | "venta"> | null = null;

  for (const rate of rates) {
    if (rate.fecha > fecha) break;
    elegida = rate;
  }

  // Sin cotización anterior, se usa la más antigua conocida antes que
  // bloquear la carga del movimiento.
  if (!elegida) elegida = rates[0] ?? null;
  if (!elegida) return null;

  return {
    valor: Number(elegida.venta),
    fecha: elegida.fecha,
    esAproximada: elegida.fecha !== fecha,
  };
}

/** Redondeo a 2 decimales evitando el error de punto flotante binario. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

/** Par de montos congelados de un movimiento. */
export interface MontosCongelados {
  monto_ars: number;
  monto_usd: number;
  tasa_usada: number;
  tasa_fecha: string;
}

/**
 * Calcula el par ARS/USD a partir del importe realmente cargado.
 *
 * `monto_origen` + `moneda_origen` es la verdad; el otro lado es derivado.
 */
export function congelarMontos(
  montoOrigen: number,
  monedaOrigen: Moneda,
  tasa: TasaAplicable,
): MontosCongelados {
  const valor = tasa.valor;

  if (valor <= 0) {
    throw new Error("La cotización tiene que ser mayor a cero.");
  }

  return {
    monto_ars:
      monedaOrigen === "ARS" ? round2(montoOrigen) : round2(montoOrigen * valor),
    monto_usd:
      monedaOrigen === "USD" ? round2(montoOrigen) : round2(montoOrigen / valor),
    tasa_usada: round4(valor),
    tasa_fecha: tasa.fecha,
  };
}

/** Convierte de una moneda a la otra con una tasa dada. */
export function convertir(
  monto: number,
  desde: Moneda,
  hacia: Moneda,
  tasa: number,
): number {
  if (desde === hacia) return round2(monto);
  if (tasa <= 0) return 0;
  return desde === "ARS" ? round2(monto / tasa) : round2(monto * tasa);
}

/** Devuelve el monto congelado de un movimiento en la moneda de vista. */
export function montoEnMoneda(
  movement: { monto_ars: number; monto_usd: number },
  moneda: Moneda,
): number {
  return Number(moneda === "ARS" ? movement.monto_ars : movement.monto_usd);
}

/** Respuesta de https://dolarapi.com/v1/dolares/oficial */
export interface DolarApiResponse {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export const DOLAR_API_URL = "https://dolarapi.com/v1/dolares/oficial";

/**
 * Trae la cotización oficial. Lanza si la respuesta no tiene un par
 * compra/venta válido: es preferible que el cron falle y reintente antes
 * que guardar una tasa basura, porque queda congelada en los movimientos.
 */
export async function fetchCotizacionOficial(
  signal?: AbortSignal,
): Promise<{ compra: number; venta: number; fechaActualizacion: string }> {
  const response = await fetch(DOLAR_API_URL, {
    cache: "no-store",
    signal,
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `dolarapi respondió ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as DolarApiResponse;
  const compra = Number(data.compra);
  const venta = Number(data.venta);

  if (!Number.isFinite(compra) || !Number.isFinite(venta) || venta <= 0) {
    throw new Error(
      `dolarapi devolvió una cotización inválida: compra=${data.compra} venta=${data.venta}`,
    );
  }

  return { compra, venta, fechaActualizacion: data.fechaActualizacion };
}
