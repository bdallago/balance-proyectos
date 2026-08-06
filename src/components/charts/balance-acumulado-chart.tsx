"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { useChartTheme } from "@/components/charts/chart-theme";
import { EmptyChart } from "@/components/charts/empty-chart";
import { formatCompact } from "@/lib/format";
import type { PuntoMensual } from "@/lib/balances";
import type { Moneda } from "@/lib/supabase/database.types";

/**
 * Evolución del balance acumulado por mes.
 *
 * Una sola serie: no lleva leyenda, el título del gráfico la nombra. La
 * línea de cero marca el cruce entre acumulado positivo y negativo.
 */
export function BalanceAcumuladoChart({
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
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
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
          minTickGap={16}
        />
        <YAxis
          tick={{ fill: tema.label, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={68}
          tickFormatter={(valor: number) => formatCompact(valor, moneda)}
        />
        <ReferenceLine y={0} stroke={tema.axis} strokeWidth={1} />
        <Tooltip
          cursor={{ stroke: tema.axis, strokeWidth: 1 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const punto = payload[0].payload as PuntoMensual;
            return (
              <ChartTooltip
                titulo={String(label)}
                moneda={moneda}
                items={[
                  {
                    nombre: "Balance acumulado",
                    valor: punto.acumulado,
                    color: tema.categoricos[0],
                  },
                  {
                    nombre: "Del mes",
                    valor: punto.balance,
                    color: tema.label,
                  },
                ]}
              />
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="acumulado"
          stroke={tema.categoricos[0]}
          strokeWidth={2}
          dot={false}
          activeDot={{
            r: 4,
            strokeWidth: 2,
            stroke: tema.surface,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
