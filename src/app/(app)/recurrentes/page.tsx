import type { Metadata } from "next";

import { RecurrentesView } from "@/components/recurrentes/recurrentes-view";
import { getRecurrencias } from "@/lib/queries";

export const metadata: Metadata = { title: "Recurrentes" };

export default async function RecurrentesPage() {
  const recurrencias = await getRecurrencias();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Recurrentes</h1>
        <p className="text-muted-foreground text-sm">
          El cron diario genera estos movimientos como planificados. Desde
          Movimientos los marcás como efectuados con un click.
        </p>
      </div>

      <RecurrentesView recurrencias={recurrencias} />
    </div>
  );
}
