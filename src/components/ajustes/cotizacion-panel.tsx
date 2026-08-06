"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { actualizarCotizacion } from "@/lib/actions/fx";
import { formatDate, todayISO } from "@/lib/dates";
import { formatRate } from "@/lib/format";
import type { FxRate } from "@/lib/supabase/database.types";

/**
 * Cotización actual y actualización forzada.
 *
 * La app usa el valor VENTA del Oficial BNA. Se muestra también la compra
 * porque es lo que trae la fuente, pero no se usa para convertir.
 */
export function CotizacionPanel({ ultimaTasa }: { ultimaTasa: FxRate | null }) {
  const router = useRouter();
  const [actualizando, setActualizando] = useState(false);

  const hoy = todayISO();
  const desactualizada = ultimaTasa ? ultimaTasa.fecha < hoy : true;

  async function actualizar() {
    setActualizando(true);
    const resultado = await actualizarCotizacion();
    setActualizando(false);

    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }

    toast.success(
      `Cotización actualizada: ${formatRate(Number(resultado.data.venta))}`,
    );
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cotización</CardTitle>
        <CardDescription>
          Dólar Oficial BNA, valor venta. El cron la guarda todos los días a
          las 21:00 de Argentina.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {ultimaTasa ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <div>
                <p className="text-muted-foreground text-xs">Venta (la que se usa)</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatRate(Number(ultimaTasa.venta))}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Compra</p>
                <p className="text-lg tabular-nums">
                  {formatRate(Number(ultimaTasa.compra))}
                </p>
              </div>
            </div>

            <dl className="text-muted-foreground grid gap-1 text-xs">
              <div>
                <dt className="inline">Fecha de la cotización: </dt>
                <dd className="inline">{formatDate(ultimaTasa.fecha)}</dd>
              </div>
              <div>
                <dt className="inline">Último fetch: </dt>
                <dd className="inline">
                  {new Date(ultimaTasa.fetched_at).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
              <div>
                <dt className="inline">Fuente: </dt>
                <dd className="inline">{ultimaTasa.fuente}</dd>
              </div>
            </dl>

            {desactualizada ? (
              <p className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-500">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  No hay cotización de hoy. Los movimientos que cargues van a
                  usar la del {formatDate(ultimaTasa.fecha)} y quedarán
                  marcados como tasa aproximada.
                </span>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-2 rounded-md border p-3 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Todavía no hay ninguna cotización cargada. Actualizá acá antes de
              cargar movimientos.
            </span>
          </p>
        )}

        <Button onClick={actualizar} disabled={actualizando} variant="outline">
          {actualizando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Actualizar ahora
        </Button>
      </CardContent>
    </Card>
  );
}
