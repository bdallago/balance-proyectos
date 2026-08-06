import { daysInMonth } from "@/lib/dates";
import type { Recurrence } from "@/lib/supabase/database.types";

/**
 * Cálculo de vencimientos de una recurrencia.
 *
 * Se separa de la Server Action para que el cron y la UI compartan la
 * misma lógica y no diverjan.
 */

/**
 * ¿La recurrencia vence en `fecha`?
 *
 * - mensual: todos los meses el `dia_del_mes`.
 * - anual: solo en el mes de `fecha_inicio`, el `dia_del_mes`.
 *
 * Si el mes no llega al día pedido (31 en febrero) se usa el último día
 * del mes: así un cargo del 31 no se saltea meses cortos.
 */
export function venceEn(recurrence: Recurrence, fecha: string): boolean {
  if (!recurrence.activa) return false;
  if (fecha < recurrence.fecha_inicio) return false;
  if (recurrence.fecha_fin && fecha > recurrence.fecha_fin) return false;

  const [year, month, day] = fecha.split("-").map(Number);
  const ultimoDia = daysInMonth(year, month);
  const diaEfectivo = Math.min(recurrence.dia_del_mes, ultimoDia);

  if (day !== diaEfectivo) return false;

  if (recurrence.frecuencia === "anual") {
    const mesInicio = Number(recurrence.fecha_inicio.split("-")[1]);
    return month === mesInicio;
  }

  return true;
}

/**
 * Todas las fechas en que la recurrencia vence dentro de un rango.
 * La usa la UI para mostrar los próximos vencimientos.
 */
export function vencimientosEnRango(
  recurrence: Recurrence,
  desde: string,
  hasta: string,
  maximo = 120,
): string[] {
  const fechas: string[] = [];

  const [yInicio, mInicio] = desde.split("-").map(Number);
  const [yFin, mFin] = hasta.split("-").map(Number);

  let year = yInicio;
  let month = mInicio;

  while (
    (year < yFin || (year === yFin && month <= mFin)) &&
    fechas.length < maximo
  ) {
    const dia = Math.min(recurrence.dia_del_mes, daysInMonth(year, month));
    const fecha = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    if (fecha >= desde && fecha <= hasta && venceEn(recurrence, fecha)) {
      fechas.push(fecha);
    }

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return fechas;
}

/** Próximo vencimiento a partir de una fecha, o null si ya terminó. */
export function proximoVencimiento(
  recurrence: Recurrence,
  desde: string,
): string | null {
  if (!recurrence.activa) return null;

  const arranque =
    desde > recurrence.fecha_inicio ? desde : recurrence.fecha_inicio;
  const limite = recurrence.fecha_fin ?? `${Number(arranque.slice(0, 4)) + 3}-12-31`;

  const [fechas] = [vencimientosEnRango(recurrence, arranque, limite, 1)];
  return fechas[0] ?? null;
}
