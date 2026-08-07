"use client";

import { ArrowDownRight, ArrowUpRight, Scale, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { Balances } from "@/lib/balances";
import type { Moneda } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

function StatCard({
  titulo,
  valor,
  detalle,
  icono: Icono,
  acento,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  icono: React.ComponentType<{ className?: string }>;
  acento?: "positivo" | "negativo";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium">{titulo}</p>
          <Icono className="text-muted-foreground size-4" />
        </div>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tracking-tight cifra",
            acento === "positivo" && "text-positivo",
            acento === "negativo" && "text-destructive",
          )}
        >
          {valor}
        </p>
        {detalle ? (
          <p className="text-muted-foreground mt-1 text-xs">{detalle}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function StatCards({
  balances,
  moneda,
}: {
  balances: Balances;
  moneda: Moneda;
}) {
  const { efectuado, proyectado } = balances;

  const planificados = {
    ingresos: proyectado.ingresos - efectuado.ingresos,
    egresos: proyectado.egresos - efectuado.egresos,
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        titulo="Ingresos"
        valor={formatMoney(efectuado.ingresos, moneda)}
        detalle={
          planificados.ingresos > 0
            ? `+ ${formatMoney(planificados.ingresos, moneda)} planificados`
            : undefined
        }
        icono={ArrowUpRight}
      />
      <StatCard
        titulo="Egresos"
        valor={formatMoney(efectuado.egresos, moneda)}
        detalle={
          planificados.egresos > 0
            ? `+ ${formatMoney(planificados.egresos, moneda)} planificados`
            : undefined
        }
        icono={ArrowDownRight}
      />
      <StatCard
        titulo="Balance neto"
        valor={formatMoney(efectuado.balance, moneda)}
        detalle="Solo movimientos efectuados"
        icono={Scale}
        acento={efectuado.balance >= 0 ? "positivo" : "negativo"}
      />
      <StatCard
        titulo="Balance proyectado"
        valor={formatMoney(proyectado.balance, moneda)}
        detalle="Incluye los planificados"
        icono={TrendingUp}
        acento={proyectado.balance >= 0 ? "positivo" : "negativo"}
      />
    </div>
  );
}
