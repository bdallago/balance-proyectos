"use server";

import { revalidatePath } from "next/cache";

import { todayISO } from "@/lib/dates";
import { congelarMontos } from "@/lib/fx";
import { getTasaParaFecha } from "@/lib/fx-server";
import { recurrenceSchema, type RecurrenceInput } from "@/lib/schemas";
import { vencimientosEnRango } from "@/lib/recurrences";
import type { Recurrence } from "@/lib/supabase/database.types";

import {
  fail,
  mensajeDeError,
  ok,
  requireSession,
  type ActionResult,
} from "./shared";

export async function crearRecurrencia(
  input: RecurrenceInput,
): Promise<ActionResult<Recurrence>> {
  const parsed = recurrenceSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  const { supabase, userId } = await requireSession();

  const { data, error } = await supabase
    .from("recurrences")
    .insert({ user_id: userId, ...parsed.data })
    .select()
    .single();

  if (error) return fail(mensajeDeError(error));

  revalidatePath("/", "layout");
  return ok(data);
}

export async function actualizarRecurrencia(
  id: string,
  input: RecurrenceInput,
): Promise<ActionResult<Recurrence>> {
  const parsed = recurrenceSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  const { supabase } = await requireSession();

  const { data, error } = await supabase
    .from("recurrences")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return fail(mensajeDeError(error));

  revalidatePath("/", "layout");
  return ok(data);
}

/**
 * Borra la recurrencia. Los movimientos ya generados quedan: la FK es ON
 * DELETE SET NULL, así que pierden el vínculo pero conservan la plata.
 */
export async function borrarRecurrencia(id: string): Promise<ActionResult> {
  const { supabase } = await requireSession();

  const { error } = await supabase.from("recurrences").delete().eq("id", id);
  if (error) return fail(mensajeDeError(error));

  revalidatePath("/", "layout");
  return ok();
}

export async function alternarRecurrenciaActiva(
  id: string,
  activa: boolean,
): Promise<ActionResult> {
  const { supabase } = await requireSession();

  const { error } = await supabase
    .from("recurrences")
    .update({ activa })
    .eq("id", id);

  if (error) return fail(mensajeDeError(error));

  revalidatePath("/", "layout");
  return ok();
}

/**
 * Genera a mano los movimientos pendientes de una recurrencia desde su
 * inicio hasta hoy. Sirve para poner al día una recurrencia recién creada
 * con fecha de inicio retroactiva, sin esperar al cron.
 */
export async function generarPendientes(
  id: string,
): Promise<ActionResult<{ generados: number }>> {
  const { supabase, userId } = await requireSession();

  const { data: recurrence, error: errorLectura } = await supabase
    .from("recurrences")
    .select("*")
    .eq("id", id)
    .single();

  if (errorLectura || !recurrence) return fail("No se encontró la recurrencia.");

  const hoy = todayISO();
  const hasta = recurrence.fecha_fin && recurrence.fecha_fin < hoy ? recurrence.fecha_fin : hoy;
  const fechas = vencimientosEnRango(recurrence, recurrence.fecha_inicio, hasta);

  if (fechas.length === 0) return ok({ generados: 0 });

  // Se saltean las que ya existen; el índice único es la red de seguridad.
  const { data: existentes } = await supabase
    .from("movements")
    .select("fecha")
    .eq("recurrence_id", id);

  const yaGeneradas = new Set((existentes ?? []).map((m) => m.fecha));
  const faltantes = fechas.filter((f) => !yaGeneradas.has(f));

  if (faltantes.length === 0) return ok({ generados: 0 });

  const filas = [];
  for (const fecha of faltantes) {
    const tasa = await getTasaParaFecha(fecha);
    if (!tasa) continue;

    filas.push({
      user_id: userId,
      project_id: recurrence.project_id,
      category_id: recurrence.category_id,
      fecha,
      descripcion: recurrence.descripcion,
      tipo: recurrence.tipo,
      monto_origen: Number(recurrence.monto_origen),
      moneda_origen: recurrence.moneda_origen,
      estado: "planificado" as const,
      recurrence_id: recurrence.id,
      ...congelarMontos(
        Number(recurrence.monto_origen),
        recurrence.moneda_origen,
        tasa,
      ),
    });
  }

  if (filas.length === 0) {
    return fail("No hay cotizaciones cargadas para generar los movimientos.");
  }

  const { error } = await supabase
    .from("movements")
    .upsert(filas, { onConflict: "recurrence_id,fecha", ignoreDuplicates: true });

  if (error) return fail(mensajeDeError(error));

  revalidatePath("/", "layout");
  return ok({ generados: filas.length });
}
