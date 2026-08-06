/**
 * Lectura de variables de entorno con mensajes de error claros.
 *
 * Las NEXT_PUBLIC_* se referencian literalmente (no por índice dinámico)
 * porque Next las inlinea en el bundle del cliente en tiempo de build.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copiá .env.example a .env.local y completala.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  );
}

export function supabaseAnonKey(): string {
  return required(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

/** Solo server-side. Saltea RLS: nunca importar desde un componente cliente. */
export function supabaseServiceRoleKey(): string {
  return required(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY",
  );
}

export function cronSecret(): string {
  return required(process.env.CRON_SECRET, "CRON_SECRET");
}
