"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "comprobantes";
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS_ACEPTADOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

/**
 * Subida opcional de comprobante a un bucket privado.
 *
 * El archivo se guarda bajo <user_id>/<uuid>.<ext>, que es el layout que
 * esperan las políticas de Storage. La vista previa y la descarga van por
 * URL firmada, nunca por URL pública.
 */
export function ComprobanteInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [urlFirmada, setUrlFirmada] = useState<string | null>(null);

  const esPdf = value?.toLowerCase().endsWith(".pdf") ?? false;

  useEffect(() => {
    let cancelado = false;

    async function firmar() {
      if (!value) {
        setUrlFirmada(null);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(value, 60 * 60);

      if (!cancelado) setUrlFirmada(data?.signedUrl ?? null);
    }

    void firmar();
    return () => {
      cancelado = true;
    };
  }, [value]);

  async function subir(archivo: File) {
    if (archivo.size > MAX_BYTES) {
      toast.error("El archivo supera los 10 MB.");
      return;
    }

    if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
      toast.error("Solo se aceptan imágenes (JPG, PNG, WebP, HEIC) o PDF.");
      return;
    }

    setSubiendo(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Sesión no encontrada.");

      const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, archivo, { contentType: archivo.type, upsert: false });

      if (error) throw error;

      // Si había uno anterior se borra para no dejar archivos huérfanos.
      if (value) await supabase.storage.from(BUCKET).remove([value]);

      onChange(path);
      toast.success("Comprobante subido.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `No se pudo subir: ${error.message}`
          : "No se pudo subir el comprobante.",
      );
    } finally {
      setSubiendo(false);
    }
  }

  async function quitar() {
    if (!value) return;
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([value]);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="comprobante">Comprobante (opcional)</Label>

      {value ? (
        <div className="flex items-center gap-3 rounded-md border p-2">
          {esPdf || !urlFirmada ? (
            <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded">
              <FileText className="text-muted-foreground size-5" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlFirmada}
              alt="Vista previa del comprobante"
              className="size-12 shrink-0 rounded object-cover"
            />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              {value.split("/").pop() ?? "Comprobante"}
            </p>
            {urlFirmada ? (
              <a
                href={urlFirmada}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
              >
                Abrir
              </a>
            ) : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={quitar}
            aria-label="Quitar comprobante"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={subiendo}
            onClick={() => document.getElementById("comprobante")?.click()}
          >
            {subiendo ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Paperclip className="size-4" />
            )}
            Adjuntar
          </Button>
          <span className="text-muted-foreground text-xs">
            Imagen o PDF, hasta 10 MB
          </span>
        </div>
      )}

      <input
        id="comprobante"
        type="file"
        accept={TIPOS_ACEPTADOS.join(",")}
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) void subir(archivo);
          e.target.value = "";
        }}
      />
    </div>
  );
}
