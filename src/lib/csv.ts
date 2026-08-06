import { formatDate } from "@/lib/dates";
import type {
  Category,
  Movement,
  Project,
} from "@/lib/supabase/database.types";

/**
 * Export a CSV.
 *
 * Se usa punto y coma como separador y BOM al principio: es lo que Excel
 * en configuración regional argentina abre bien sin pasar por el asistente
 * de importación. Con coma y decimales a la argentina rompe.
 */

const SEPARADOR = ";";

function escapar(valor: string): string {
  if (
    valor.includes(SEPARADOR) ||
    valor.includes('"') ||
    valor.includes("\n") ||
    valor.includes("\r")
  ) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

/** Número en formato es-AR (coma decimal), sin separador de miles. */
function numero(valor: number, decimales: number): string {
  return valor.toFixed(decimales).replace(".", ",");
}

const COLUMNAS = [
  "Fecha",
  "Descripción",
  "Tipo",
  "Proyecto",
  "Categoría",
  "Estado",
  "Monto origen",
  "Moneda origen",
  "Monto ARS",
  "Monto USD",
  "Tasa usada",
  "Fecha de la tasa",
] as const;

export function movimientosACsv(
  movements: Movement[],
  projects: Project[],
  categories: Category[],
): string {
  const nombreProyecto = new Map(projects.map((p) => [p.id, p.nombre]));
  const nombreCategoria = new Map(categories.map((c) => [c.id, c.nombre]));

  const filas = movements.map((m) =>
    [
      formatDate(m.fecha),
      m.descripcion,
      m.tipo,
      m.project_id
        ? (nombreProyecto.get(m.project_id) ?? "—")
        : "Compartido",
      nombreCategoria.get(m.category_id) ?? "—",
      m.estado,
      numero(Number(m.monto_origen), 2),
      m.moneda_origen,
      numero(Number(m.monto_ars), 2),
      numero(Number(m.monto_usd), 2),
      numero(Number(m.tasa_usada), 4),
      formatDate(m.tasa_fecha),
    ]
      .map((celda) => escapar(String(celda)))
      .join(SEPARADOR),
  );

  return [COLUMNAS.join(SEPARADOR), ...filas].join("\r\n");
}

/** Dispara la descarga en el browser. */
export function descargarCsv(contenido: string, nombreArchivo: string): void {
  // El BOM le dice a Excel que el archivo es UTF-8 y salva los acentos.
  // Va escapado a propósito: como carácter literal es invisible y
  // cualquier editor que "limpie" el archivo se lo lleva puesto.
  const BOM = String.fromCharCode(0xfeff);
  const blob = new Blob([BOM, contenido], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
