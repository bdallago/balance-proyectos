"use client";

import { MovementForm } from "@/components/movimientos/movement-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Movement } from "@/lib/supabase/database.types";

/** Alta o edición de un movimiento en modal. */
export function MovementDialog({
  movimiento,
  projectIdInicial,
  open,
  onOpenChange,
}: {
  movimiento?: Movement;
  projectIdInicial?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {movimiento ? "Editar movimiento" : "Cargar movimiento"}
          </DialogTitle>
          <DialogDescription>
            Escribí el monto en pesos o en dólares: el otro se completa solo.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <MovementForm
            key={movimiento?.id ?? "nuevo"}
            movimiento={movimiento}
            projectIdInicial={projectIdInicial}
            onListo={() => onOpenChange(false)}
            onCancelar={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
