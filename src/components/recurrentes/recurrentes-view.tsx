"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAppData } from "@/components/providers/app-data-provider";
import { RecurrenciaDialog } from "@/components/recurrentes/recurrencia-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  alternarRecurrenciaActiva,
  borrarRecurrencia,
  generarPendientes,
} from "@/lib/actions/recurrences";
import { formatDate, todayISO } from "@/lib/dates";
import { formatAmount } from "@/lib/format";
import { proximoVencimiento } from "@/lib/recurrences";
import type { Recurrence } from "@/lib/supabase/database.types";

export function RecurrentesView({
  recurrencias,
}: {
  recurrencias: Recurrence[];
}) {
  const router = useRouter();
  const { projects, categories } = useAppData();

  const [editando, setEditando] = useState<Recurrence | null>(null);
  const [creando, setCreando] = useState(false);
  const [borrando, setBorrando] = useState<Recurrence | null>(null);
  const [generando, setGenerando] = useState<string | null>(null);

  const nombreProyecto = new Map(projects.map((p) => [p.id, p]));
  const nombreCategoria = new Map(categories.map((c) => [c.id, c.nombre]));

  async function alternarActiva(recurrencia: Recurrence) {
    const resultado = await alternarRecurrenciaActiva(
      recurrencia.id,
      !recurrencia.activa,
    );
    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }
    router.refresh();
  }

  async function generar(recurrencia: Recurrence) {
    setGenerando(recurrencia.id);
    const resultado = await generarPendientes(recurrencia.id);
    setGenerando(null);

    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }

    toast.success(
      resultado.data.generados === 0
        ? "No había movimientos pendientes de generar."
        : `${resultado.data.generados} movimientos generados como planificados.`,
    );
    router.refresh();
  }

  async function confirmarBorrado() {
    if (!borrando) return;
    const resultado = await borrarRecurrencia(borrando.id);
    setBorrando(null);

    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }
    toast.success("Recurrencia borrada.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreando(true)}>
          <Plus className="size-4" />
          Nueva recurrencia
        </Button>
      </div>

      {recurrencias.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
          Todavía no hay recurrencias. Sirven para lo que se repite todos los
          meses: suscripciones, hosting, dominios.
        </p>
      ) : (
        <ul className="space-y-2">
          {recurrencias.map((recurrencia) => {
            const proyecto = recurrencia.project_id
              ? nombreProyecto.get(recurrencia.project_id)
              : null;
            const proximo = proximoVencimiento(recurrencia, todayISO());

            return (
              <li
                key={recurrencia.id}
                className="flex flex-wrap items-center gap-3 rounded-md border p-3"
              >
                <Switch
                  checked={recurrencia.activa}
                  onCheckedChange={() => void alternarActiva(recurrencia)}
                  aria-label={`Activar ${recurrencia.descripcion}`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-medium">
                      {recurrencia.descripcion}
                    </p>
                    <Badge
                      variant={
                        recurrencia.tipo === "ingreso" ? "default" : "secondary"
                      }
                      className="h-5 text-[10px] font-normal"
                    >
                      {recurrencia.tipo}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground text-xs">
                    {recurrencia.moneda_origen}{" "}
                    <span className="cifra">
                      {formatAmount(
                        Number(recurrencia.monto_origen),
                        recurrencia.moneda_origen,
                      )}
                    </span>{" "}
                    · {recurrencia.frecuencia} el día {recurrencia.dia_del_mes} ·{" "}
                    {proyecto ? proyecto.nombre : "Compartido"} ·{" "}
                    {nombreCategoria.get(recurrencia.category_id) ?? "—"}
                  </p>

                  <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                    <CalendarClock className="size-3" />
                    {proximo
                      ? `Próximo: ${formatDate(proximo)}`
                      : recurrencia.activa
                        ? "Sin próximos vencimientos"
                        : "Pausada"}
                    {recurrencia.fecha_fin
                      ? ` · termina el ${formatDate(recurrencia.fecha_fin)}`
                      : ""}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  title="Generar los pendientes hasta hoy"
                  disabled={generando === recurrencia.id}
                  onClick={() => void generar(recurrencia)}
                >
                  <RefreshCw
                    className={
                      generando === recurrencia.id
                        ? "size-3.5 animate-spin"
                        : "size-3.5"
                    }
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Editar ${recurrencia.descripcion}`}
                  onClick={() => setEditando(recurrencia)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Borrar ${recurrencia.descripcion}`}
                  onClick={() => setBorrando(recurrencia)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <RecurrenciaDialog
        key={editando?.id ?? "nueva"}
        open={creando || editando !== null}
        recurrencia={editando ?? undefined}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setCreando(false);
            setEditando(null);
          }
        }}
      />

      <AlertDialog
        open={borrando !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setBorrando(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Borrar «{borrando?.descripcion}»?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Los movimientos que ya generó no se borran: quedan como
              movimientos sueltos. Si solo querés frenarla, usá el interruptor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarBorrado}>
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
