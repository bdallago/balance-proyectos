"use client";

import { useMemo } from "react";

import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { etiquetaProrrateo, type MovimientoImputado } from "@/lib/prorrateo";
import type { Moneda } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

/**
 * Movimientos del proyecto.
 *
 * Las filas prorrateadas van visualmente diferenciadas — fondo tenue,
 * borde izquierdo y una etiqueta "Compartido (1/3)" — para que no se
 * confundan con el gasto directo del proyecto.
 */
export function ProyectoMovimientos({
  imputados,
  uniformes,
  moneda,
}: {
  imputados: MovimientoImputado[];
  uniformes: boolean;
  moneda: Moneda;
}) {
  const { categories } = useAppData();

  const nombreCategoria = useMemo(
    () => new Map(categories.map((c) => [c.id, c.nombre])),
    [categories],
  );

  const ordenados = useMemo(
    () =>
      [...imputados].sort((a, b) =>
        b.movement.fecha.localeCompare(a.movement.fecha),
      ),
    [imputados],
  );

  const compartidos = ordenados.filter((i) => i.compartido).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Movimientos</CardTitle>
        <CardDescription>
          {ordenados.length} en total
          {compartidos > 0
            ? `, de los cuales ${compartidos} son la parte prorrateada de gastos compartidos`
            : ""}
          .
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Monto ({moneda})</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {ordenados.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No hay movimientos en este rango.
                  </TableCell>
                </TableRow>
              ) : (
                ordenados.map((item) => (
                  <TableRow
                    key={`${item.movement.id}-${item.compartido ? "c" : "d"}`}
                    className={cn(
                      item.compartido &&
                        "bg-muted/40 border-l-muted-foreground/30 border-l-2",
                    )}
                  >
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatDate(item.movement.fecha)}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{item.movement.descripcion}</span>
                        {item.compartido && item.participacion ? (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1 text-[10px] font-normal"
                          >
                            {etiquetaProrrateo(item.participacion, uniformes)}
                          </Badge>
                        ) : null}
                        {item.movement.estado === "planificado" ? (
                          <Badge
                            variant="outline"
                            className="h-4 px-1 text-[10px]"
                          >
                            planificado
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {nombreCategoria.get(item.movement.category_id) ?? "—"}
                    </TableCell>

                    <TableCell
                      className={cn(
                        "text-right font-medium whitespace-nowrap tabular-nums",
                        item.movement.tipo === "ingreso"
                          ? "text-emerald-600 dark:text-emerald-500"
                          : "text-foreground",
                      )}
                    >
                      {item.movement.tipo === "ingreso" ? "+" : "−"}
                      {formatMoney(item.monto, moneda)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
