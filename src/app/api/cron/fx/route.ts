import { NextResponse, type NextRequest } from "next/server";

import { todayISO } from "@/lib/dates";
import { congelarMontos, fetchCotizacionOficial, resolverTasa } from "@/lib/fx";
import { venceEn } from "@/lib/recurrences";
import { createAdminClient } from "@/lib/supabase/server";
import type { Recurrence } from "@/lib/supabase/database.types";

/**
 * Cron diario.
 *
 * Corre a las 21:00 de Argentina (00:00 UTC del día siguiente, ver
 * vercel.json) y hace dos cosas:
 *
 *   1. Guarda el cierre del Oficial BNA en fx_rates.
 *   2. Genera los movimientos recurrentes que vencen hoy, en estado
 *      planificado, sin duplicar.
 *
 * Se autentica con CRON_SECRET, no con sesión: el middleware excluye
 * /api/cron de la protección por cookie.
 *
 * Usa la service role key porque corre sin usuario y tiene que escribir
 * fx_rates (que solo permite lectura vía RLS) y movimientos de cualquier
 * usuario.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function autorizado(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const hoy = todayISO();
  const resultado = {
    fecha: hoy,
    cotizacion: null as null | { compra: number; venta: number },
    cotizacionError: null as null | string,
    recurrentesGenerados: 0,
    recurrentesError: null as null | string,
  };

  // ── 1. Cotización ──────────────────────────────────────────
  try {
    const { compra, venta } = await fetchCotizacionOficial(
      AbortSignal.timeout(15_000),
    );

    const admin = createAdminClient();
    const { error } = await admin.from("fx_rates").upsert(
      {
        fecha: hoy,
        compra,
        venta,
        fuente: "BNA",
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "fecha" },
    );

    if (error) throw new Error(error.message);
    resultado.cotizacion = { compra, venta };
  } catch (error) {
    // No corta la ejecución: los recurrentes pueden generarse igual con la
    // última tasa conocida. Vercel reintenta el cron al día siguiente y la
    // UI marca visualmente que la cotización está desactualizada.
    resultado.cotizacionError =
      error instanceof Error ? error.message : "Error desconocido.";
  }

  // ── 2. Recurrentes ─────────────────────────────────────────
  try {
    resultado.recurrentesGenerados = await generarRecurrentesDelDia(hoy);
  } catch (error) {
    resultado.recurrentesError =
      error instanceof Error ? error.message : "Error desconocido.";
  }

  const huboError = Boolean(
    resultado.cotizacionError && resultado.recurrentesError,
  );

  return NextResponse.json(resultado, { status: huboError ? 500 : 200 });
}

/**
 * Genera los movimientos de las recurrencias que vencen hoy.
 *
 * El índice único (recurrence_id, fecha) impide duplicados incluso si el
 * cron corre dos veces; el upsert con ignoreDuplicates lo hace silencioso.
 */
async function generarRecurrentesDelDia(hoy: string): Promise<number> {
  const admin = createAdminClient();

  const { data: recurrencias, error } = await admin
    .from("recurrences")
    .select("*")
    .eq("activa", true)
    .lte("fecha_inicio", hoy);

  if (error) throw new Error(error.message);
  if (!recurrencias || recurrencias.length === 0) return 0;

  const vencenHoy = (recurrencias as Recurrence[]).filter((r) =>
    venceEn(r, hoy),
  );
  if (vencenHoy.length === 0) return 0;

  // Una sola lectura de cotizaciones para todas las recurrencias.
  const { data: rates } = await admin
    .from("fx_rates")
    .select("fecha, venta")
    .lte("fecha", hoy)
    .order("fecha", { ascending: true });

  const tasa = resolverTasa(rates ?? [], hoy);
  if (!tasa) {
    throw new Error(
      "No hay ninguna cotización cargada; no se pueden generar los recurrentes.",
    );
  }

  const filas = vencenHoy.map((r) => ({
    user_id: r.user_id,
    project_id: r.project_id,
    category_id: r.category_id,
    fecha: hoy,
    descripcion: r.descripcion,
    tipo: r.tipo,
    monto_origen: Number(r.monto_origen),
    moneda_origen: r.moneda_origen,
    estado: "planificado" as const,
    recurrence_id: r.id,
    ...congelarMontos(Number(r.monto_origen), r.moneda_origen, tasa),
  }));

  const { data: insertados, error: errorInsert } = await admin
    .from("movements")
    .upsert(filas, {
      onConflict: "recurrence_id,fecha",
      ignoreDuplicates: true,
    })
    .select("id");

  if (errorInsert) throw new Error(errorInsert.message);

  return insertados?.length ?? 0;
}
