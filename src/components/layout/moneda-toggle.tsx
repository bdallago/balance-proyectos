"use client";

import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/utils";

/**
 * Conmutador global ARS / USD. Afecta a todos los números y gráficos.
 * No convierte nada: elige cuál de los dos montos congelados se muestra.
 */
export function MonedaToggle() {
  const { moneda, setMoneda } = useAppData();

  return (
    <div
      role="radiogroup"
      aria-label="Moneda de visualización"
      className="bg-muted flex items-center rounded-md p-0.5"
    >
      {(["ARS", "USD"] as const).map((opcion) => (
        <button
          key={opcion}
          type="button"
          role="radio"
          aria-checked={moneda === opcion}
          onClick={() => setMoneda(opcion)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            moneda === opcion
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opcion}
        </button>
      ))}
    </div>
  );
}
