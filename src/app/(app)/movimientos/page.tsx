import type { Metadata } from "next";

import { MovementsTable } from "@/components/movimientos/movements-table";
import { getMovimientos } from "@/lib/queries";

export const metadata: Metadata = { title: "Movimientos" };

export default async function MovimientosPage() {
  const movements = await getMovimientos();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Movimientos</h1>
        <p className="text-muted-foreground text-sm">
          Todo lo cargado, filtrable y exportable.
        </p>
      </div>

      <MovementsTable movements={movements} />
    </div>
  );
}
