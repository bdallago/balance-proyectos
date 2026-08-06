import type { Metadata } from "next";

import { ProyectosGrid } from "@/components/proyectos/proyectos-grid";
import { getMovimientos } from "@/lib/queries";

export const metadata: Metadata = { title: "Proyectos" };

export default async function ProyectosPage() {
  const movements = await getMovimientos();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
        <p className="text-muted-foreground text-sm">
          Balance de cada uno, con su parte de los gastos compartidos.
        </p>
      </div>

      <ProyectosGrid movements={movements} />
    </div>
  );
}
