import type { Metadata } from "next";

import { AjustesView } from "@/components/ajustes/ajustes-view";
import { getUltimaTasa } from "@/lib/fx-server";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const ultimaTasa = await getUltimaTasa();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground text-sm">
          Proyectos, categorías y cotización.
        </p>
      </div>

      <AjustesView ultimaTasa={ultimaTasa} />
    </div>
  );
}
