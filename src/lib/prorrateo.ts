import { montoEnMoneda, round2 } from "@/lib/fx";
import type { Moneda, Movement, Project } from "@/lib/supabase/database.types";

/**
 * Prorrateo de gastos compartidos.
 *
 * Un movimiento con project_id = null es compartido: sirve a todos los
 * proyectos (Claude Pro, Cursor, etc.). En las vistas por proyecto se
 * reparte entre los proyectos ACTIVOS, ponderado por peso_prorrateo.
 *
 * El reparto se calcula al vuelo. Nunca se guardan filas duplicadas en la
 * base: eso rompería el balance general, que suma el compartido una sola vez.
 */

/** Proyecto que participa del reparto, con su peso ya normalizado. */
export interface ParticipacionProyecto {
  projectId: string;
  /** Fracción del total que le toca. Todas suman 1. */
  fraccion: number;
  /** Posición dentro del reparto, para la etiqueta "Compartido (1/3)". */
  indice: number;
  /** Cantidad de proyectos que participan. */
  total: number;
}

/**
 * Calcula qué fracción del gasto compartido le toca a cada proyecto activo.
 *
 * Si no hay proyectos activos devuelve un mapa vacío: el gasto compartido
 * sigue existiendo en el balance general, simplemente no se reparte.
 */
export function calcularParticipaciones(
  projects: Pick<Project, "id" | "activo" | "peso_prorrateo">[],
): Map<string, ParticipacionProyecto> {
  const activos = projects.filter((p) => p.activo);
  const pesoTotal = activos.reduce(
    (sum, p) => sum + Number(p.peso_prorrateo),
    0,
  );

  const map = new Map<string, ParticipacionProyecto>();
  if (activos.length === 0 || pesoTotal <= 0) return map;

  activos.forEach((project, indice) => {
    map.set(project.id, {
      projectId: project.id,
      fraccion: Number(project.peso_prorrateo) / pesoTotal,
      indice: indice + 1,
      total: activos.length,
    });
  });

  return map;
}

/**
 * Etiqueta del reparto. Con pesos iguales muestra "Compartido (1/3)";
 * con pesos distintos el porcentaje real, que es lo informativo.
 */
export function etiquetaProrrateo(
  participacion: ParticipacionProyecto,
  pesosUniformes: boolean,
): string {
  if (pesosUniformes) {
    return `Compartido (1/${participacion.total})`;
  }
  const pct = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 1,
  }).format(participacion.fraccion * 100);
  return `Compartido (${pct}%)`;
}

export function pesosSonUniformes(
  projects: Pick<Project, "activo" | "peso_prorrateo">[],
): boolean {
  const activos = projects.filter((p) => p.activo);
  if (activos.length === 0) return true;
  const primero = Number(activos[0].peso_prorrateo);
  return activos.every((p) => Number(p.peso_prorrateo) === primero);
}

/**
 * Un movimiento tal como se ve dentro de un proyecto: puede ser directo
 * (el monto completo) o la porción prorrateada de un gasto compartido.
 */
export interface MovimientoImputado {
  movement: Movement;
  /** Monto que le corresponde a este proyecto, en la moneda pedida. */
  monto: number;
  /** true si viene de un gasto compartido. */
  compartido: boolean;
  /** Solo presente cuando `compartido` es true. */
  participacion?: ParticipacionProyecto;
}

/**
 * Imputa los movimientos a un proyecto: los directos enteros, más la
 * porción que le toca de cada gasto compartido.
 */
export function imputarAProyecto(
  movements: Movement[],
  projectId: string,
  participaciones: Map<string, ParticipacionProyecto>,
  moneda: Moneda,
): MovimientoImputado[] {
  const participacion = participaciones.get(projectId);
  const resultado: MovimientoImputado[] = [];

  for (const movement of movements) {
    if (movement.project_id === projectId) {
      resultado.push({
        movement,
        monto: montoEnMoneda(movement, moneda),
        compartido: false,
      });
      continue;
    }

    if (movement.project_id === null && participacion) {
      resultado.push({
        movement,
        monto: round2(montoEnMoneda(movement, moneda) * participacion.fraccion),
        compartido: true,
        participacion,
      });
    }
  }

  return resultado;
}
