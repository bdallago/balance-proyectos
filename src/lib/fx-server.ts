import "server-only";

import { todayISO } from "@/lib/dates";
import { resolverTasa, type TasaAplicable } from "@/lib/fx";
import { createClient } from "@/lib/supabase/server";
import type { FxRate } from "@/lib/supabase/database.types";

/**
 * Lectura de cotizaciones desde el servidor.
 *
 * `fx_rate_for_date` resuelve en la base la regla de "la de esa fecha o la
 * última anterior", así no hace falta traerse la serie completa.
 */

export async function getTasaParaFecha(
  fecha: string,
): Promise<TasaAplicable | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("fx_rate_for_date", { p_fecha: fecha })
    .maybeSingle();

  if (error || !data) return null;

  return {
    valor: Number(data.venta),
    fecha: data.fecha,
    esAproximada: data.fecha !== fecha,
  };
}

/** Última cotización conocida, para el widget de Ajustes. */
export async function getUltimaTasa(): Promise<FxRate | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("fx_rates")
    .select("*")
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

/**
 * Serie de cotizaciones para el formulario del cliente.
 *
 * Se manda al browser para poder convertir ARS↔USD en tiempo real al
 * cambiar la fecha, sin un round-trip por cada tecla. Un año de historia
 * son ~250 filas de dos campos: barato.
 */
export async function getSerieTasas(
  desde?: string,
): Promise<Pick<FxRate, "fecha" | "venta">[]> {
  const supabase = await createClient();
  const limite = desde ?? `${Number(todayISO().slice(0, 4)) - 2}-01-01`;

  const { data } = await supabase
    .from("fx_rates")
    .select("fecha, venta")
    .gte("fecha", limite)
    .order("fecha", { ascending: true });

  return data ?? [];
}

/** Resuelve la tasa contra una serie ya cargada. Reexport por conveniencia. */
export { resolverTasa };
