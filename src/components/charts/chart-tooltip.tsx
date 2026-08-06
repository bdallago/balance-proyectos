"use client";

import { formatMoney } from "@/lib/format";
import type { Moneda } from "@/lib/supabase/database.types";

/**
 * Tooltip común a todos los gráficos.
 *
 * El texto va en tinta normal, nunca en el color de la serie: el cuadrito
 * de color al lado es el que lleva la identidad.
 */
export interface ItemTooltip {
  nombre: string;
  valor: number;
  color: string;
}

export function ChartTooltip({
  titulo,
  items,
  moneda,
  total,
}: {
  titulo: string;
  items: ItemTooltip[];
  moneda: Moneda;
  total?: number;
}) {
  return (
    <div className="bg-popover text-popover-foreground min-w-40 rounded-md border p-2.5 text-xs shadow-md">
      <p className="mb-1.5 font-medium">{titulo}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.nombre} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground flex-1">{item.nombre}</span>
            <span className="font-medium tabular-nums">
              {formatMoney(item.valor, moneda)}
            </span>
          </li>
        ))}
      </ul>
      {total !== undefined ? (
        <p className="mt-1.5 flex justify-between border-t pt-1.5">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium tabular-nums">
            {formatMoney(total, moneda)}
          </span>
        </p>
      ) : null}
    </div>
  );
}
