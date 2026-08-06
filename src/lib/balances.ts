import { monthKey, monthRange } from "@/lib/dates";
import { montoEnMoneda, round2 } from "@/lib/fx";
import {
  calcularParticipaciones,
  type ParticipacionProyecto,
} from "@/lib/prorrateo";
import type {
  Category,
  Moneda,
  Movement,
  Project,
} from "@/lib/supabase/database.types";

/**
 * Motor de balances.
 *
 * Invariante que sostiene toda la app:
 *
 *   suma(balance de cada proyecto) === balance general
 *
 * Redondear la porción de cada proyecto por separado lo rompe por
 * centavos. Por eso el reparto de gastos compartidos se hace por resto
 * mayor sobre centavos enteros: las partes suman exactamente el total.
 *
 * Única excepción, y es real: si no hay proyectos activos no hay entre
 * quiénes repartir. El gasto compartido sigue contando en el balance
 * general. `Balances.compartidoSinRepartir` lo expone para que la UI
 * pueda avisar en vez de mostrar números que no cierran.
 */

export type FiltroEstado = "efectuado" | "planificado" | "ambos";

export interface FiltrosBalance {
  desde?: string;
  hasta?: string;
  estado: FiltroEstado;
}

export interface Totales {
  ingresos: number;
  egresos: number;
  /** ingresos - egresos */
  balance: number;
}

export interface PuntoMensual {
  mes: string;
  label: string;
  ingresos: number;
  egresos: number;
  balance: number;
  /** Balance acumulado desde el primer mes del rango. */
  acumulado: number;
}

export interface TotalPorCategoria {
  categoryId: string;
  nombre: string;
  total: number;
}

export interface TotalPorProyecto {
  projectId: string;
  nombre: string;
  color: string;
  activo: boolean;
  ingresos: number;
  egresos: number;
  balance: number;
}

export interface Balances {
  /** Solo movimientos efectuados. */
  efectuado: Totales;
  /** Efectuados + planificados. */
  proyectado: Totales;
  porMes: PuntoMensual[];
  egresosPorCategoria: TotalPorCategoria[];
  ingresosPorCategoria: TotalPorCategoria[];
  porProyecto: TotalPorProyecto[];
  /**
   * Egresos compartidos que no se pudieron repartir por no haber
   * proyectos activos. Si es > 0, la suma por proyecto no llega al general.
   */
  compartidoSinRepartir: number;
  cantidadMovimientos: number;
}

/** Filtra por rango de fechas y estado. */
export function filtrarMovimientos(
  movements: Movement[],
  filtros: FiltrosBalance,
): Movement[] {
  return movements.filter((m) => {
    if (filtros.desde && m.fecha < filtros.desde) return false;
    if (filtros.hasta && m.fecha > filtros.hasta) return false;
    if (filtros.estado !== "ambos" && m.estado !== filtros.estado) return false;
    return true;
  });
}

function sumarTotales(movements: Movement[], moneda: Moneda): Totales {
  let ingresos = 0;
  let egresos = 0;

  for (const m of movements) {
    const monto = montoEnMoneda(m, moneda);
    if (m.tipo === "ingreso") ingresos += monto;
    else egresos += monto;
  }

  ingresos = round2(ingresos);
  egresos = round2(egresos);
  return { ingresos, egresos, balance: round2(ingresos - egresos) };
}

/**
 * Reparte un monto entre participantes por resto mayor.
 *
 * Trabaja en centavos enteros para que las partes sumen exactamente el
 * total, sin la deriva que produce redondear cada fracción por separado.
 */
export function repartirPorRestoMayor(
  monto: number,
  fracciones: number[],
): number[] {
  if (fracciones.length === 0) return [];

  const totalCentavos = Math.round(monto * 100);
  const crudos = fracciones.map((f) => totalCentavos * f);
  const pisos = crudos.map((v) => Math.floor(v));

  let restante = totalCentavos - pisos.reduce((a, b) => a + b, 0);

  // Los centavos sobrantes van a los que tienen mayor parte fraccionaria.
  const orden = crudos
    .map((valor, indice) => ({ indice, resto: valor - Math.floor(valor) }))
    .sort((a, b) => b.resto - a.resto);

  const resultado = [...pisos];
  let cursor = 0;
  while (restante > 0 && orden.length > 0) {
    resultado[orden[cursor % orden.length].indice] += 1;
    restante -= 1;
    cursor += 1;
  }

  return resultado.map((centavos) => centavos / 100);
}

/**
 * Reparte los movimientos compartidos entre los proyectos activos y
 * devuelve, por proyecto, el monto imputado de cada movimiento.
 */
function repartirCompartidos(
  compartidos: Movement[],
  participaciones: Map<string, ParticipacionProyecto>,
  moneda: Moneda,
): Map<string, { ingresos: number; egresos: number }> {
  const porProyecto = new Map<string, { ingresos: number; egresos: number }>();

  const ids = [...participaciones.keys()];
  if (ids.length === 0) return porProyecto;

  for (const id of ids) porProyecto.set(id, { ingresos: 0, egresos: 0 });

  const fracciones = ids.map((id) => participaciones.get(id)!.fraccion);

  for (const movement of compartidos) {
    const partes = repartirPorRestoMayor(
      montoEnMoneda(movement, moneda),
      fracciones,
    );

    ids.forEach((id, i) => {
      const acc = porProyecto.get(id)!;
      if (movement.tipo === "ingreso") acc.ingresos += partes[i];
      else acc.egresos += partes[i];
    });
  }

  for (const acc of porProyecto.values()) {
    acc.ingresos = round2(acc.ingresos);
    acc.egresos = round2(acc.egresos);
  }

  return porProyecto;
}

function agruparPorCategoria(
  movements: Movement[],
  categories: Category[],
  tipo: "ingreso" | "egreso",
  moneda: Moneda,
): TotalPorCategoria[] {
  const nombres = new Map(categories.map((c) => [c.id, c.nombre]));
  const totales = new Map<string, number>();

  for (const m of movements) {
    if (m.tipo !== tipo) continue;
    const actual = totales.get(m.category_id) ?? 0;
    totales.set(m.category_id, actual + montoEnMoneda(m, moneda));
  }

  return [...totales.entries()]
    .map(([categoryId, total]) => ({
      categoryId,
      nombre: nombres.get(categoryId) ?? "Sin categoría",
      total: round2(total),
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
}

function agruparPorMes(movements: Movement[], moneda: Moneda): PuntoMensual[] {
  if (movements.length === 0) return [];

  const fechas = movements.map((m) => m.fecha).sort();
  const meses = monthRange(fechas[0], fechas[fechas.length - 1]);

  const acc = new Map<string, { ingresos: number; egresos: number }>();
  for (const mes of meses) acc.set(mes, { ingresos: 0, egresos: 0 });

  for (const m of movements) {
    const key = monthKey(m.fecha);
    const bucket = acc.get(key);
    if (!bucket) continue;
    const monto = montoEnMoneda(m, moneda);
    if (m.tipo === "ingreso") bucket.ingresos += monto;
    else bucket.egresos += monto;
  }

  let acumulado = 0;
  return meses.map((mes) => {
    const bucket = acc.get(mes)!;
    const ingresos = round2(bucket.ingresos);
    const egresos = round2(bucket.egresos);
    const balance = round2(ingresos - egresos);
    acumulado = round2(acumulado + balance);

    return {
      mes,
      label: formatMes(mes),
      ingresos,
      egresos,
      balance,
      acumulado,
    };
  });
}

function formatMes(mes: string): string {
  const [year, month] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "short", year: "2-digit" })
    .format(new Date(year, month - 1, 15, 12))
    .replace(".", "");
}

/**
 * Calcula todos los balances del dashboard general.
 *
 * `porProyecto` incluye la porción prorrateada de los gastos compartidos,
 * de modo que sus balances suman el balance general (salvo el caso de
 * `compartidoSinRepartir`).
 */
export function calcularBalances(
  movements: Movement[],
  projects: Project[],
  categories: Category[],
  moneda: Moneda,
  filtros: FiltrosBalance,
): Balances {
  const filtrados = filtrarMovimientos(movements, filtros);

  const efectuados = filtrados.filter((m) => m.estado === "efectuado");
  const participaciones = calcularParticipaciones(projects);

  const compartidos = filtrados.filter((m) => m.project_id === null);
  const repartoCompartidos = repartirCompartidos(
    compartidos,
    participaciones,
    moneda,
  );

  const directosPorProyecto = new Map<
    string,
    { ingresos: number; egresos: number }
  >();
  for (const project of projects) {
    directosPorProyecto.set(project.id, { ingresos: 0, egresos: 0 });
  }

  for (const m of filtrados) {
    if (m.project_id === null) continue;
    const bucket = directosPorProyecto.get(m.project_id);
    if (!bucket) continue;
    const monto = montoEnMoneda(m, moneda);
    if (m.tipo === "ingreso") bucket.ingresos += monto;
    else bucket.egresos += monto;
  }

  const porProyecto: TotalPorProyecto[] = projects.map((project) => {
    const directo = directosPorProyecto.get(project.id) ?? {
      ingresos: 0,
      egresos: 0,
    };
    const compartido = repartoCompartidos.get(project.id) ?? {
      ingresos: 0,
      egresos: 0,
    };

    const ingresos = round2(directo.ingresos + compartido.ingresos);
    const egresos = round2(directo.egresos + compartido.egresos);

    return {
      projectId: project.id,
      nombre: project.nombre,
      color: project.color,
      activo: project.activo,
      ingresos,
      egresos,
      balance: round2(ingresos - egresos),
    };
  });

  // Si no hay proyectos activos, lo compartido queda sin imputar.
  const compartidoSinRepartir =
    participaciones.size === 0
      ? round2(
          compartidos.reduce((sum, m) => {
            const monto = montoEnMoneda(m, moneda);
            return sum + (m.tipo === "ingreso" ? -monto : monto);
          }, 0),
        )
      : 0;

  return {
    efectuado: sumarTotales(efectuados, moneda),
    proyectado: sumarTotales(filtrados, moneda),
    porMes: agruparPorMes(filtrados, moneda),
    egresosPorCategoria: agruparPorCategoria(
      filtrados,
      categories,
      "egreso",
      moneda,
    ),
    ingresosPorCategoria: agruparPorCategoria(
      filtrados,
      categories,
      "ingreso",
      moneda,
    ),
    porProyecto: porProyecto.sort((a, b) => b.balance - a.balance),
    compartidoSinRepartir,
    cantidadMovimientos: filtrados.length,
  };
}

/**
 * Balances acotados a un proyecto, incluyendo su porción prorrateada.
 * Es la vista por proyecto del spec.
 */
export function calcularBalancesProyecto(
  movements: Movement[],
  projects: Project[],
  categories: Category[],
  projectId: string,
  moneda: Moneda,
  filtros: FiltrosBalance,
): Balances & { participacion: ParticipacionProyecto | undefined } {
  const participaciones = calcularParticipaciones(projects);
  const participacion = participaciones.get(projectId);
  const filtrados = filtrarMovimientos(movements, filtros);

  // Se materializan los movimientos imputados al proyecto: los directos
  // enteros y los compartidos escalados por su fracción. Son objetos
  // efímeros para el cálculo, nunca se persisten.
  const imputados: Movement[] = [];

  for (const m of filtrados) {
    if (m.project_id === projectId) {
      imputados.push(m);
      continue;
    }
    if (m.project_id === null && participacion) {
      imputados.push({
        ...m,
        monto_ars: round2(Number(m.monto_ars) * participacion.fraccion),
        monto_usd: round2(Number(m.monto_usd) * participacion.fraccion),
      });
    }
  }

  const efectuados = imputados.filter((m) => m.estado === "efectuado");

  return {
    efectuado: sumarTotales(efectuados, moneda),
    proyectado: sumarTotales(imputados, moneda),
    porMes: agruparPorMes(imputados, moneda),
    egresosPorCategoria: agruparPorCategoria(
      imputados,
      categories,
      "egreso",
      moneda,
    ),
    ingresosPorCategoria: agruparPorCategoria(
      imputados,
      categories,
      "ingreso",
      moneda,
    ),
    porProyecto: [],
    compartidoSinRepartir: 0,
    cantidadMovimientos: imputados.length,
    participacion,
  };
}
