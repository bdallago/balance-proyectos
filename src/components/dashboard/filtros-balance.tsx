"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { addMonths, startOfMonth, todayISO } from "@/lib/dates";
import type { FiltroEstado } from "@/lib/balances";

export interface RangoFiltros {
  desde: string;
  hasta: string;
  estado: FiltroEstado;
}

/** Presets de rango: cubren el 90% de las consultas sin tocar los inputs. */
const PRESETS = [
  { id: "mes", label: "Este mes" },
  { id: "3m", label: "3 meses" },
  { id: "12m", label: "12 meses" },
  { id: "todo", label: "Todo" },
] as const;

export function rangoDePreset(preset: (typeof PRESETS)[number]["id"]): {
  desde: string;
  hasta: string;
} {
  const hoy = todayISO();

  switch (preset) {
    case "mes":
      return { desde: startOfMonth(hoy), hasta: hoy };
    case "3m":
      return { desde: startOfMonth(addMonths(hoy, -2)), hasta: hoy };
    case "12m":
      return { desde: startOfMonth(addMonths(hoy, -11)), hasta: hoy };
    case "todo":
      return { desde: "2000-01-01", hasta: "2100-12-31" };
  }
}

export function FiltrosBalanceBar({
  filtros,
  onChange,
}: {
  filtros: RangoFiltros;
  onChange: (filtros: RangoFiltros) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((preset) => {
          const rango = rangoDePreset(preset.id);
          const activo =
            filtros.desde === rango.desde && filtros.hasta === rango.hasta;

          return (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={activo ? "secondary" : "ghost"}
              onClick={() => onChange({ ...filtros, ...rango })}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      <div className="space-y-1">
        <Label htmlFor="desde" className="text-muted-foreground text-xs">
          Desde
        </Label>
        <Input
          id="desde"
          type="date"
          value={filtros.desde}
          onChange={(e) => onChange({ ...filtros, desde: e.target.value })}
          className="h-8 w-[9.5rem]"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="hasta" className="text-muted-foreground text-xs">
          Hasta
        </Label>
        <Input
          id="hasta"
          type="date"
          value={filtros.hasta}
          onChange={(e) => onChange({ ...filtros, hasta: e.target.value })}
          className="h-8 w-[9.5rem]"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="estado-filtro" className="text-muted-foreground text-xs">
          Estado
        </Label>
        <Select
          value={filtros.estado}
          onValueChange={(v) =>
            onChange({ ...filtros, estado: v as FiltroEstado })
          }
        >
          <SelectTrigger id="estado-filtro" size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectuado">Efectuados</SelectItem>
            <SelectItem value="planificado">Planificados</SelectItem>
            <SelectItem value="ambos">Ambos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
