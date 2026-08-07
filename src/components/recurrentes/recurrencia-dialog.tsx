"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  actualizarRecurrencia,
  crearRecurrencia,
} from "@/lib/actions/recurrences";
import { todayISO } from "@/lib/dates";
import { recurrenceSchema, type RecurrenceInput } from "@/lib/schemas";
import type {
  FrecuenciaRecurrencia,
  Moneda,
  Recurrence,
  TipoMovimiento,
} from "@/lib/supabase/database.types";

export function RecurrenciaDialog({
  recurrencia,
  open,
  onOpenChange,
}: {
  recurrencia?: Recurrence;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { proyectosActivos, projects, categoriasVigentes } = useAppData();

  const form = useForm<RecurrenceInput>({
    resolver: zodResolver(recurrenceSchema),
    defaultValues: {
      descripcion: recurrencia?.descripcion ?? "",
      tipo: recurrencia?.tipo ?? "egreso",
      project_id: recurrencia?.project_id ?? null,
      category_id: recurrencia?.category_id ?? "",
      monto_origen: recurrencia ? Number(recurrencia.monto_origen) : 0,
      moneda_origen: recurrencia?.moneda_origen ?? "USD",
      frecuencia: recurrencia?.frecuencia ?? "mensual",
      dia_del_mes: recurrencia?.dia_del_mes ?? 1,
      fecha_inicio: recurrencia?.fecha_inicio ?? todayISO(),
      fecha_fin: recurrencia?.fecha_fin ?? null,
      activa: recurrencia?.activa ?? true,
    },
  });

  const { register, handleSubmit, watch, setValue, formState, reset } = form;

  const tipo = watch("tipo");
  const categoriasDelTipo = useMemo(
    () => categoriasVigentes.filter((c) => c.tipo === tipo),
    [categoriasVigentes, tipo],
  );

  const proyectosDisponibles = recurrencia ? projects : proyectosActivos;

  async function onSubmit(values: RecurrenceInput) {
    const resultado = recurrencia
      ? await actualizarRecurrencia(recurrencia.id, values)
      : await crearRecurrencia(values);

    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }

    toast.success(
      recurrencia ? "Recurrencia actualizada." : "Recurrencia creada.",
    );
    reset();
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {recurrencia ? "Editar recurrencia" : "Nueva recurrencia"}
          </DialogTitle>
          <DialogDescription>
            El cron diario genera el movimiento como planificado el día que
            corresponde.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="r-descripcion">Descripción</Label>
            <Input
              id="r-descripcion"
              {...register("descripcion")}
              placeholder="Ej: Claude Pro"
              autoComplete="off"
            />
            {formState.errors.descripcion ? (
              <p className="text-destructive text-xs">
                {formState.errors.descripcion.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="r-tipo">Tipo</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setValue("tipo", v as TipoMovimiento)}
              >
                <SelectTrigger id="r-tipo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="egreso">Egreso</SelectItem>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-frecuencia">Frecuencia</Label>
              <Select
                value={watch("frecuencia")}
                onValueChange={(v) =>
                  setValue("frecuencia", v as FrecuenciaRecurrencia)
                }
              >
                <SelectTrigger id="r-frecuencia" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="r-monto">Monto</Label>
              <Input
                id="r-monto"
                type="number"
                step="0.01"
                min="0"
                {...register("monto_origen", { valueAsNumber: true })}
                className="cifra"
              />
              {formState.errors.monto_origen ? (
                <p className="text-destructive text-xs">
                  {formState.errors.monto_origen.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-moneda">Moneda</Label>
              <Select
                value={watch("moneda_origen")}
                onValueChange={(v) => setValue("moneda_origen", v as Moneda)}
              >
                <SelectTrigger id="r-moneda" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            El monto queda fijo en esta moneda. La conversión al otro lado se
            congela con la cotización del día en que el cron lo genere.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="r-dia">Día del mes</Label>
              <Input
                id="r-dia"
                type="number"
                min="1"
                max="31"
                {...register("dia_del_mes", { valueAsNumber: true })}
                className="cifra"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-inicio">Desde</Label>
              <Input id="r-inicio" type="date" {...register("fecha_inicio")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-fin">Hasta (opcional)</Label>
              <Input
                id="r-fin"
                type="date"
                value={watch("fecha_fin") ?? ""}
                onChange={(e) =>
                  setValue("fecha_fin", e.target.value || null)
                }
              />
            </div>
          </div>

          {formState.errors.fecha_fin ? (
            <p className="text-destructive text-xs">
              {formState.errors.fecha_fin.message}
            </p>
          ) : null}

          <p className="text-muted-foreground text-xs">
            Si el mes no llega al día elegido (31 en febrero), se usa el
            último día del mes.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="r-proyecto">Proyecto</Label>
              <Select
                value={watch("project_id") ?? "compartido"}
                onValueChange={(v) =>
                  setValue("project_id", v === "compartido" ? null : v)
                }
              >
                <SelectTrigger id="r-proyecto" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compartido">Compartido</SelectItem>
                  {proyectosDisponibles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-categoria">Categoría</Label>
              <Select
                value={watch("category_id")}
                onValueChange={(v) => setValue("category_id", v)}
              >
                <SelectTrigger id="r-categoria" className="w-full">
                  <SelectValue placeholder="Elegí una" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDelTipo.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formState.errors.category_id ? (
                <p className="text-destructive text-xs">
                  {formState.errors.category_id.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={formState.isSubmitting}
              className="flex-1"
            >
              {formState.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {recurrencia ? "Guardar cambios" : "Crear recurrencia"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
