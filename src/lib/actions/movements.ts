"use server";

import { revalidatePath } from "next/cache";

import { congelarMontos } from "@/lib/fx";
import { getTasaParaFecha } from "@/lib/fx-server";
import { movementSchema, type MovementInput } from "@/lib/schemas";
import type { Movement } from "@/lib/supabase/database.types";

import {
  fail,
  mensajeDeError,
  ok,
  requireSession,
  type ActionResult,
} from "./shared";

/**
 * Alta y edición de movimientos.
 *
 * El par ARS/USD se congela acá con la tasa que mandó el formulario. El
 * servidor no la sustituye por la del día: el usuario puede haber forzado
 * una cotización distinta (por ejemplo una venta cobrada a otro tipo de
 * cambio) y eso es parte del diseño.
 */

export async function crearMovimiento(
  input: MovementInput,
): Promise<ActionResult<Movement>> {
  const parsed = movementSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  const { supabase, userId } = await requireSession();
  const d = parsed.data;

  const montos = congelarMontos(d.monto_origen, d.moneda_origen, {
    valor: d.tasa_usada,
    fecha: d.tasa_fecha,
    esAproximada: false,
  });

  const { data, error } = await supabase
    .from("movements")
    .insert({
      user_id: userId,
      project_id: d.project_id,
      category_id: d.category_id,
      fecha: d.fecha,
      descripcion: d.descripcion,
      tipo: d.tipo,
      monto_origen: d.monto_origen,
      moneda_origen: d.moneda_origen,
      estado: d.estado,
      comprobante_path: d.comprobante_path ?? null,
      ...montos,
    })
    .select()
    .single();

  if (error) return fail(mensajeDeError(error));

  revalidatePath("/", "layout");
  return ok(data);
}

export async function actualizarMovimiento(
  id: string,
  input: MovementInput,
): Promise<ActionResult<Movement>> {
  const parsed = movementSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  const { supabase } = await requireSession();
  const d = parsed.data;

  const montos = congelarMontos(d.monto_origen, d.moneda_origen, {
    valor: d.tasa_usada,
    fecha: d.tasa_fecha,
    esAproximada: false,
  });

  const { data, error } = await supabase
    .from("movements")
    .update({
      project_id: d.project_id,
      category_id: d.category_id,
      fecha: d.fecha,
      descripcion: d.descripcion,
      tipo: d.tipo,
      monto_origen: d.monto_origen,
      moneda_origen: d.moneda_origen,
      estado: d.estado,
      comprobante_path: d.comprobante_path ?? null,
      ...montos,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return fail(mensajeDeError(error));

  revalidatePath("/", "layout");
  return ok(data);
}

export async function borrarMovimiento(id: string): Promise<ActionResult> {
  const { supabase } = await requireSession();

  // Si tenía comprobante, se borra el archivo para no dejar huérfanos.
  const { data: movimiento } = await supabase
    .from("movements")
    .select("comprobante_path")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("movements").delete().eq("id", id);
  if (error) return fail(mensajeDeError(error));

  if (movimiento?.comprobante_path) {
    await supabase.storage
      .from("comprobantes")
      .remove([movimiento.comprobante_path]);
  }

  revalidatePath("/", "layout");
  return ok();
}

/**
 * Marca un planificado como efectuado.
 *
 * Acá SÍ se recalcula la tasa, contra la fecha real de efectivización: el
 * movimiento planificado tenía una cotización estimada y ahora pasa a ser
 * plata que se movió de verdad. Es la única recotización de la app.
 */
export async function efectuarMovimiento(
  id: string,
  fechaEfectiva: string,
): Promise<ActionResult<Movement>> {
  const { supabase } = await requireSession();

  const { data: actual, error: errorLectura } = await supabase
    .from("movements")
    .select("monto_origen, moneda_origen, tasa_usada, tasa_fecha")
    .eq("id", id)
    .single();

  if (errorLectura || !actual) {
    return fail("No se encontró el movimiento.");
  }

  const tasa = await getTasaParaFecha(fechaEfectiva);

  // Sin cotización para esa fecha se conserva la que ya tenía, antes que
  // impedir marcarlo como efectuado.
  const tasaAplicada = tasa ?? {
    valor: Number(actual.tasa_usada),
    fecha: actual.tasa_fecha,
    esAproximada: true,
  };

  const montos = congelarMontos(
    Number(actual.monto_origen),
    actual.moneda_origen,
    tasaAplicada,
  );

  const { data, error } = await supabase
    .from("movements")
    .update({
      estado: "efectuado",
      fecha: fechaEfectiva,
      ...montos,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return fail(mensajeDeError(error));

  revalidatePath("/", "layout");
  return ok(data);
}
