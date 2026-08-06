"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { useChartTheme } from "@/components/charts/chart-theme";
import { EmptyChart } from "@/components/charts/empty-chart";
import { ChartLegend } from "@/components/charts/chart-legend";
import { formatCompact } from "@/lib/format";
import type { PuntoMensual } from "@/lib/balances";
import type { Moneda } from "@/lib/supabase/database.types";

/**
 * Ingresos vs egresos por mes, en barras apiladas.
 *
 * El par de colores es azul↔rojo, el divergente validado. Verde/rojo, que
 * sería lo esperable en finanzas, cae en la banda de riesgo para
 * daltonismo (ΔE 6.9 contra 21.6 de este par).
 *
 * Los segmentos llevan un separador del color de la tarjeta para que el
 * límite entre ingreso y egreso se lea sin depender del contraste entre
 * los dos colores.
 */
export function IngresosEgresosChart({
  datos,
  moneda,
}: {
  datos: PuntoMensual[];
  moneda: Moneda;
}) {
  const tema = useChartTheme();

  if (datos.length === 0) {
    return <EmptyChart mensaje="Todavía no hay movimientos en este rango." />;
  }

  return (
    <div className="space-y-3">
      <ChartLegend
        items={[
          { nombre: "Ingresos", color: tema.ingreso },
          { nombre: "Egresos", color: tema.egreso },
        ]}
      />

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={datos}
          margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
        >
          <CartesianGrid
            stroke={tema.grid}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: tema.label, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: tema.axis }}
            minTickGap={12}
          />
          <YAxis
            tick={{ fill: tema.label, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={68}
            tickFormatter={(valor: number) => formatCompact(valor, moneda)}
          />
          <Tooltip
            cursor={{ fill: tema.grid, fillOpacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const punto = payload[0].payload as PuntoMensual;
              return (
                <ChartTooltip
                  titulo={String(label)}
                  moneda={moneda}
                  items={[
                    {
                      nombre: "Ingresos",
                      valor: punto.ingresos,
                      color: tema.ingreso,
                    },
                    {
                      nombre: "Egresos",
                      valor: punto.egresos,
                      color: tema.egreso,
                    },
                    {
                      nombre: "Balance",
                      valor: punto.balance,
                      color: tema.label,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="ingresos"
            stackId="mes"
            fill={tema.ingreso}
            stroke={tema.surface}
            strokeWidth={2}
            maxBarSize={36}
          />
          <Bar
            dataKey="egresos"
            stackId="mes"
            fill={tema.egreso}
            stroke={tema.surface}
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
