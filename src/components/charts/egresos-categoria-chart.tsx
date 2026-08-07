"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  MAX_CATEGORIAS_GRAFICO,
  useChartTheme,
} from "@/components/charts/chart-theme";
import { EmptyChart } from "@/components/charts/empty-chart";
import { formatMoney } from "@/lib/format";
import type { TotalPorCategoria } from "@/lib/balances";
import type { Moneda } from "@/lib/supabase/database.types";

/**
 * Egresos por categoría.
 *
 * Los ocho tonos se asignan en orden fijo; a partir del octavo todo se
 * agrupa en "Otras" en vez de generar colores nuevos.
 *
 * Tres de los tonos quedan por debajo de 3:1 contra el fondo claro, así
 * que la identidad no se apoya solo en el color: cada porción figura en
 * la lista de al lado con su nombre, monto y porcentaje.
 */
export function EgresosCategoriaChart({
  datos,
  moneda,
}: {
  datos: TotalPorCategoria[];
  moneda: Moneda;
}) {
  const tema = useChartTheme();

  const { porciones, total } = useMemo(() => {
    const total = datos.reduce((sum, d) => sum + d.total, 0);

    if (datos.length <= MAX_CATEGORIAS_GRAFICO + 1) {
      return { porciones: datos, total };
    }

    const principales = datos.slice(0, MAX_CATEGORIAS_GRAFICO);
    const resto = datos.slice(MAX_CATEGORIAS_GRAFICO);

    return {
      porciones: [
        ...principales,
        {
          categoryId: "otras",
          nombre: `Otras (${resto.length})`,
          total: resto.reduce((sum, d) => sum + d.total, 0),
        },
      ],
      total,
    };
  }, [datos]);

  if (porciones.length === 0 || total === 0) {
    return <EmptyChart mensaje="Todavía no hay egresos en este rango." />;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={220} className="max-w-[220px]">
        <PieChart>
          <Pie
            data={porciones}
            dataKey="total"
            nameKey="nombre"
            innerRadius={52}
            outerRadius={88}
            paddingAngle={2}
            stroke={tema.surface}
            strokeWidth={2}
          >
            {porciones.map((porcion, i) => (
              <Cell
                key={porcion.categoryId}
                fill={tema.categoricos[i % tema.categoricos.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const porcion = payload[0].payload as TotalPorCategoria;
              const indice = porciones.findIndex(
                (p) => p.categoryId === porcion.categoryId,
              );
              return (
                <ChartTooltip
                  titulo={porcion.nombre}
                  moneda={moneda}
                  items={[
                    {
                      nombre: `${((porcion.total / total) * 100).toFixed(1)}% del total`,
                      valor: porcion.total,
                      color: tema.categoricos[indice % tema.categoricos.length],
                    },
                  ]}
                />
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Lista con nombre y monto: la identidad nunca queda solo en el color. */}
      <ul className="w-full flex-1 space-y-1.5">
        {porciones.map((porcion, i) => (
          <li
            key={porcion.categoryId}
            className="flex items-center gap-2 text-xs"
          >
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: tema.categoricos[i % tema.categoricos.length],
              }}
            />
            <span className="text-muted-foreground min-w-0 flex-1 truncate">
              {porcion.nombre}
            </span>
            <span className="text-muted-foreground cifra">
              {((porcion.total / total) * 100).toFixed(0)}%
            </span>
            <span className="w-24 text-right font-medium cifra">
              {formatMoney(porcion.total, moneda)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
