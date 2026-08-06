import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { getSerieTasas } from "@/lib/fx-server";
import { createClient, getUser } from "@/lib/supabase/server";

/**
 * Shell de las pantallas privadas.
 *
 * Carga una sola vez los datos de referencia (proyectos, categorías y la
 * serie de cotizaciones) y los baja al cliente por contexto. Así el
 * formulario de carga puede convertir ARS↔USD en tiempo real sin ir al
 * servidor por cada tecla.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [projectsResult, categoriesResult, rates] = await Promise.all([
    supabase.from("projects").select("*").order("nombre"),
    supabase.from("categories").select("*").order("tipo").order("nombre"),
    getSerieTasas(),
  ]);

  return (
    <AppDataProvider
      projects={projectsResult.data ?? []}
      categories={categoriesResult.data ?? []}
      rates={rates}
    >
      <AppShell
        email={user.email ?? ""}
        nombre={
          (user.user_metadata?.full_name as string | undefined) ??
          user.email ??
          "Mi cuenta"
        }
        avatarUrl={user.user_metadata?.avatar_url as string | undefined}
      >
        {children}
      </AppShell>
    </AppDataProvider>
  );
}
