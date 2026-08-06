"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import type { TotalPorProyecto } from "@/lib/balances";
import type { Moneda } from "@/lib/supabase/database.types";

/**
 * Balance por proyecto, incluyendo la porción prorrateada de los gastos
 * compartidos.
 *
 * Barras horizontales: los nombres de proyecto son largos y en vertical
 * se cortan o se inclinan. El color sale del proyecto (el mismo de toda
 * la app), y como cada barra ya está rotulada en el eje, el color es
 * redundante y no carga identidad por sí solo.
 */
export function BalanceProyectoChart({
  datos,
  moneda,
}: {
  datos: TotalPorProyecto[];
  moneda: Moneda;
}) {
  const tema = useChartTheme();

  if (datos.length === 0) {
    return <EmptyChart mensaje="Todavía no hay proyectos cargados." />;
  }

  const alto = Math.max(180, datos.length * 44 + 40);

  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart
        data={datos}
        layout="vertical"
        margin={{ top: 8, right: 16, bottom: 0, left: 4 }}
      >
        <CartesianGrid
          stroke={tema.grid}
          strokeDasharray="3 3"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fill: tema.label, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(valor: number) => formatCompact(valor, moneda)}
        />
        <YAxis
          type="category"
          dataKey="nombre"
          tick={{ fill: tema.label, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: tema.axis }}
          width={120}
        />
        <ReferenceLine x={0} stroke={tema.axis} strokeWidth={1} />
        <Tooltip
          cursor={{ fill: tema.grid, fillOpacity: 0.4 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const proyecto = payload[0].payload as TotalPorProyecto;
            return (
              <ChartTooltip
                titulo={proyecto.nombre}
                moneda={moneda}
                items={[
                  {
                    nombre: "Ingresos",
                    valor: proyecto.ingresos,
                    color: tema.ingreso,
                  },
                  {
                    nombre: "Egresos",
                    valor: proyecto.egresos,
                    color: tema.egreso,
                  },
                  {
                    nombre: "Balance",
                    valor: proyecto.balance,
                    color: proyecto.color,
                  },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="balance" radius={4} maxBarSize={28}>
          {datos.map((proyecto) => (
            <Cell
              key={proyecto.projectId}
              fill={proyecto.balance < 0 ? tema.egreso : proyecto.color}
              fillOpacity={proyecto.activo ? 1 : 0.45}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
