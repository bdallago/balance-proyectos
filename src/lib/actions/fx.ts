"use server";

import { revalidatePath } from "next/cache";

import { todayISO } from "@/lib/dates";
import { fetchCotizacionOficial } from "@/lib/fx";
import { createAdminClient } from "@/lib/supabase/server";
import type { FxRate } from "@/lib/supabase/database.types";

import { fail, ok, requireSession, type ActionResult } from "./shared";

/**
 * Fuerza la actualización de la cotización desde Ajustes, sin esperar al
 * cron. Requiere sesión, pero escribe con la service role key porque
 * fx_rates es de solo lectura vía RLS.
 */
export async function actualizarCotizacion(): Promise<ActionResult<FxRate>> {
  await requireSession();

  let compra: number;
  let venta: number;

  try {
    ({ compra, venta } = await fetchCotizacionOficial(
      AbortSignal.timeout(15_000),
    ));
  } catch (error) {
    return fail(
      error instanceof Error
        ? `No se pudo traer la cotización: ${error.message}`
        : "No se pudo traer la cotización.",
    );
  }

  const admin = createAdminClient();
  const hoy = todayISO();

  const { data, error } = await admin
    .from("fx_rates")
    .upsert(
      {
        fecha: hoy,
        compra,
        venta,
        fuente: "BNA",
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "fecha" },
    )
    .select()
    .single();

  if (error) return fail(error.message);

  revalidatePath("/", "layout");
  return ok(data);
}
