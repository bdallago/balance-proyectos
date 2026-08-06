"use client";

import { useEffect } from "react";

import { MovementForm } from "@/components/movimientos/movement-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Carga rápida: ⌘K / Ctrl+K desde cualquier pantalla.
 *
 * Abre con foco en descripción, se navega entero con teclado y Enter
 * guarda. La fecha arranca en hoy y el proyecto en el último usado.
 */
export function QuickAddDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    function alTeclado(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(true);
      }
    }

    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cargar movimiento</DialogTitle>
          <DialogDescription>
            Escribí el monto en pesos o en dólares: el otro se completa solo.
          </DialogDescription>
        </DialogHeader>

        {/* key fuerza un formulario limpio en cada apertura. */}
        {open ? (
          <MovementForm
            key={String(open)}
            autoFocus
            onListo={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
