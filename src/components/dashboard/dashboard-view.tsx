"use client";

import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";

import { BalanceAcumuladoChart } from "@/components/charts/balance-acumulado-chart";
import { BalanceProyectoChart } from "@/components/charts/balance-proyecto-chart";
import { EgresosCategoriaChart } from "@/components/charts/egresos-categoria-chart";
import { IngresosEgresosChart } from "@/components/charts/ingresos-egresos-chart";
import {
  FiltrosBalanceBar,
  rangoDePreset,
  type RangoFiltros,
} from "@/components/dashboard/filtros-balance";
import { StatCards } from "@/components/dashboard/stat-cards";
import { useAppData } from "@/components/providers/app-data-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { calcularBalances } from "@/lib/balances";
import { formatMoney } from "@/lib/format";
import type { Movement } from "@/lib/supabase/database.types";

/**
 * Balance general.
 *
 * Los cálculos corren en el cliente sobre los movimientos ya traídos, así
 * cambiar de moneda o de rango es instantáneo y no golpea la base.
 */
export function DashboardView({ movements }: { movements: Movement[] }) {
  const { projects, categories, moneda } = useAppData();

  const [filtros, setFiltros] = useState<RangoFiltros>(() => ({
    ...rangoDePreset("12m"),
    estado: "ambos",
  }));

  const balances = useMemo(
    () => calcularBalances(movements, projects, categories, moneda, filtros),
    [movements, projects, categories, moneda, filtros],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Balance</h1>
          <p className="text-muted-foreground text-sm">
            {balances.cantidadMovimientos} movimientos en el rango elegido.
          </p>
        </div>
        <FiltrosBalanceBar filtros={filtros} onChange={setFiltros} />
      </div>

      <StatCards balances={balances} moneda={moneda} />

      {balances.compartidoSinRepartir !== 0 ? (
        <p className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-2 rounded-md border p-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Hay{" "}
            {formatMoney(Math.abs(balances.compartidoSinRepartir), moneda)} en
            gastos compartidos que no se están repartiendo porque no tenés
            ningún proyecto activo. Cuentan en el balance general pero no en
            los balances por proyecto.
          </span>
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance acumulado</CardTitle>
            <CardDescription>
              Cómo viene la suma mes a mes, en {moneda}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BalanceAcumuladoChart datos={balances.porMes} moneda={moneda} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos y egresos</CardTitle>
            <CardDescription>Por mes, en {moneda}.</CardDescription>
          </CardHeader>
          <CardContent>
            <IngresosEgresosChart datos={balances.porMes} moneda={moneda} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Egresos por categoría</CardTitle>
            <CardDescription>
              En qué se va la plata, en {moneda}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EgresosCategoriaChart
              datos={balances.egresosPorCategoria}
              moneda={moneda}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance por proyecto</CardTitle>
            <CardDescription>
              Con su parte de los gastos compartidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BalanceProyectoChart
              datos={balances.porProyecto}
              moneda={moneda}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
