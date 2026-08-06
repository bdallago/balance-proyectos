"use server";

import { revalidatePath } from "next/cache";

import { categorySchema, type CategoryInput } from "@/lib/schemas";
import type { Category } from "@/lib/supabase/database.types";

import {
  fail,
  mensajeDeError,
  ok,
  requireSession,
  type ActionResult,
} from "./shared";

export async function crearCategoria(
  input: CategoryInput,
): Promise<ActionResult<Category>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  const { supabase, userId } = await requireSession();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      nombre: parsed.data.nombre,
      tipo: parsed.data.tipo,
      archivada: parsed.data.archivada,
    })
    .select()
    .single();

  if (error) return fail(mensajeDeError(error));

  revalidatePath("/", "layout");
  return ok(data);
}

export async function actualizarCategoria(
  id: string,
  input: CategoryInput,
): Promise<ActionResult<Category>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  const { supabase } = await requireSession();

  const { data, error } = await supabase
    .from("categories")
    .update({
      nombre: parsed.data.nombre,
      tipo: parsed.data.tipo,
      archivada: parsed.data.archivada,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return fail(mensajeDeError(error));

  revalidatePath("/", "layout");
  return ok(data);
}

/**
 * Borra la categoría. La FK de movements es ON DELETE RESTRICT, así que
 * si tiene movimientos la base rechaza el borrado y se sugiere archivar.
 */
export async function borrarCategoria(id: string): Promise<ActionResult> {
  const { supabase } = await requireSession();

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return fail(
        "Esta categoría tiene movimientos. Archivala en vez de borrarla.",
      );
    }
    return fail(mensajeDeError(error));
  }

  revalidatePath("/", "layout");
  return ok();
}

export async function alternarCategoriaArchivada(
  id: string,
  archivada: boolean,
): Promise<ActionResult> {
  const { supabase } = await requireSession();

  const { error } = await supabase
    .from("categories")
    .update({ archivada })
    .eq("id", id);

  if (error) return fail(mensajeDeError(error));

  revalidatePath("/", "layout");
  return ok();
}
