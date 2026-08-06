"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Archive, ArchiveRestore, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAppData } from "@/components/providers/app-data-provider";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
  actualizarCategoria,
  alternarCategoriaArchivada,
  borrarCategoria,
  crearCategoria,
} from "@/lib/actions/categories";
import { categorySchema, type CategoryInput } from "@/lib/schemas";
import type { Category, TipoMovimiento } from "@/lib/supabase/database.types";

export function CategoriasPanel() {
  const router = useRouter();
  const { categories } = useAppData();

  const [editando, setEditando] = useState<Category | null>(null);
  const [creando, setCreando] = useState(false);
  const [borrando, setBorrando] = useState<Category | null>(null);

  const porTipo = {
    ingreso: categories.filter((c) => c.tipo === "ingreso"),
    egreso: categories.filter((c) => c.tipo === "egreso"),
  };

  async function alternarArchivada(categoria: Category) {
    const resultado = await alternarCategoriaArchivada(
      categoria.id,
      !categoria.archivada,
    );
    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }
    toast.success(categoria.archivada ? "Restaurada." : "Archivada.");
    router.refresh();
  }

  async function confirmarBorrado() {
    if (!borrando) return;
    const resultado = await borrarCategoria(borrando.id);
    setBorrando(null);

    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }
    toast.success("Categoría borrada.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Categorías</CardTitle>
          <CardDescription>
            Las archivadas no aparecen al cargar, pero siguen en el historial.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setCreando(true)}>
          <Plus className="size-4" />
          Nueva
        </Button>
      </CardHeader>

      <CardContent className="grid gap-6 sm:grid-cols-2">
        {(["ingreso", "egreso"] as const).map((tipo) => (
          <section key={tipo} className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {tipo === "ingreso" ? "Ingresos" : "Egresos"}
            </h3>

            {porTipo[tipo].length === 0 ? (
              <p className="text-muted-foreground text-sm">Ninguna todavía.</p>
            ) : (
              <ul className="space-y-1.5">
                {porTipo[tipo].map((categoria) => (
                  <li
                    key={categoria.id}
                    className="flex items-center gap-2 rounded-md border p-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {categoria.nombre}
                    </span>

                    {categoria.archivada ? (
                      <Badge variant="outline" className="h-5 text-[10px]">
                        archivada
                      </Badge>
                    ) : null}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={
                        categoria.archivada ? "Restaurar" : "Archivar"
                      }
                      onClick={() => void alternarArchivada(categoria)}
                    >
                      {categoria.archivada ? (
                        <ArchiveRestore className="size-3.5" />
                      ) : (
                        <Archive className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`Editar ${categoria.nombre}`}
                      onClick={() => setEditando(categoria)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`Borrar ${categoria.nombre}`}
                      onClick={() => setBorrando(categoria)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </CardContent>

      <CategoriaDialog
        key={editando?.id ?? "nueva"}
        open={creando || editando !== null}
        categoria={editando ?? undefined}
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
            <AlertDialogTitle>¿Borrar «{borrando?.nombre}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Si tiene movimientos cargados, la base no va a dejar borrarla.
              En ese caso archivala.
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
    </Card>
  );
}

function CategoriaDialog({
  categoria,
  open,
  onOpenChange,
}: {
  categoria?: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombre: categoria?.nombre ?? "",
      tipo: categoria?.tipo ?? "egreso",
      archivada: categoria?.archivada ?? false,
    },
  });

  const { register, handleSubmit, watch, setValue, formState, reset } = form;

  async function onSubmit(values: CategoryInput) {
    const resultado = categoria
      ? await actualizarCategoria(categoria.id, values)
      : await crearCategoria(values);

    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }

    toast.success(categoria ? "Categoría actualizada." : "Categoría creada.");
    reset();
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {categoria ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="c-nombre">Nombre</Label>
            <Input
              id="c-nombre"
              {...register("nombre")}
              autoComplete="off"
              placeholder="Ej: Infraestructura"
            />
            {formState.errors.nombre ? (
              <p className="text-destructive text-xs">
                {formState.errors.nombre.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-tipo">Tipo</Label>
            <Select
              value={watch("tipo")}
              onValueChange={(v) => setValue("tipo", v as TipoMovimiento)}
            >
              <SelectTrigger id="c-tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="egreso">Egreso</SelectItem>
                <SelectItem value="ingreso">Ingreso</SelectItem>
              </SelectContent>
            </Select>
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
              {categoria ? "Guardar" : "Crear"}
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
