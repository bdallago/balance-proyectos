import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Movement } from "@/lib/supabase/database.types";

/**
 * Lecturas de movimientos.
 *
 * Se traen todos los del usuario y se filtra/agrega en memoria: es una app
 * de un solo usuario con unos pocos miles de filas, y así el conmutador de
 * moneda y los filtros de rango responden sin ir a la base.
 */

const LIMITE = 20000;

export async function getMovimientos(): Promise<Movement[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("movements")
    .select("*")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(LIMITE);

  return data ?? [];
}

export async function getProyectoPorSlug(slug: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

export async function getRecurrencias() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("recurrences")
    .select("*")
    .order("activa", { ascending: false })
    .order("descripcion");

  return data ?? [];
}
