import { z } from "zod";

/** Validación compartida entre los formularios y las Server Actions. */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (formato AAAA-MM-DD).");

const uuid = z.string().uuid("Identificador inválido.");

export const tipoMovimientoSchema = z.enum(["ingreso", "egreso"]);
export const monedaSchema = z.enum(["ARS", "USD"]);
export const estadoMovimientoSchema = z.enum(["efectuado", "planificado"]);
export const frecuenciaSchema = z.enum(["mensual", "anual"]);

// ─────────────────────────────────────────────────────────────
// Proyectos
// ─────────────────────────────────────────────────────────────
export const projectSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Poné un nombre.")
    .max(80, "Máximo 80 caracteres."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido."),
  activo: z.boolean(),
  peso_prorrateo: z
    .number()
    .positive("El peso tiene que ser mayor a cero.")
    .max(9999, "Peso demasiado grande."),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// ─────────────────────────────────────────────────────────────
// Categorías
// ─────────────────────────────────────────────────────────────
export const categorySchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Poné un nombre.")
    .max(60, "Máximo 60 caracteres."),
  tipo: tipoMovimientoSchema,
  archivada: z.boolean(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// ─────────────────────────────────────────────────────────────
// Movimientos
//
// El formulario muestra ARS y USD a la vez. `moneda_origen` marca cuál de
// los dos escribió el usuario: ese es el importe real, el otro es derivado.
// ─────────────────────────────────────────────────────────────
export const movementSchema = z.object({
  fecha: isoDate,
  descripcion: z
    .string()
    .trim()
    .min(1, "Poné una descripción.")
    .max(200, "Máximo 200 caracteres."),
  tipo: tipoMovimientoSchema,
  // null = gasto compartido entre todos los proyectos.
  project_id: uuid.nullable(),
  category_id: uuid,
  monto_origen: z
    .number()
    .nonnegative("El monto no puede ser negativo.")
    .max(1e12, "Monto demasiado grande."),
  moneda_origen: monedaSchema,
  tasa_usada: z
    .number()
    .positive("La cotización tiene que ser mayor a cero.")
    .max(1e9, "Cotización demasiado grande."),
  tasa_fecha: isoDate,
  estado: estadoMovimientoSchema,
  comprobante_path: z.string().max(400).nullable().optional(),
});

export type MovementInput = z.infer<typeof movementSchema>;

// ─────────────────────────────────────────────────────────────
// Recurrencias
// ─────────────────────────────────────────────────────────────
export const recurrenceSchema = z
  .object({
    descripcion: z
      .string()
      .trim()
      .min(1, "Poné una descripción.")
      .max(200, "Máximo 200 caracteres."),
    tipo: tipoMovimientoSchema,
    project_id: uuid.nullable(),
    category_id: uuid,
    monto_origen: z
      .number()
      .nonnegative("El monto no puede ser negativo.")
      .max(1e12, "Monto demasiado grande."),
    moneda_origen: monedaSchema,
    frecuencia: frecuenciaSchema,
    dia_del_mes: z
      .number()
      .int()
      .min(1, "Entre 1 y 31.")
      .max(31, "Entre 1 y 31."),
    fecha_inicio: isoDate,
    fecha_fin: isoDate.nullable(),
    activa: z.boolean(),
  })
  .refine(
    (value) => value.fecha_fin === null || value.fecha_fin >= value.fecha_inicio,
    {
      message: "La fecha de fin no puede ser anterior a la de inicio.",
      path: ["fecha_fin"],
    },
  );

export type RecurrenceInput = z.infer<typeof recurrenceSchema>;
