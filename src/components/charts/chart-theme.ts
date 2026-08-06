"use client";

import { useEffect, useState } from "react";

/**
 * Paleta de gráficos.
 *
 * Recharts necesita colores concretos, no variables CSS, así que se leen
 * de las custom properties del documento y se releen cuando cambia el
 * tema. Las variables están definidas y validadas en globals.css.
 */

export const SLOTS_CATEGORICOS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
  "--chart-7",
  "--chart-8",
] as const;

export interface ChartTheme {
  /** Ocho tonos en orden fijo. Nunca se ciclan. */
  categoricos: string[];
  ingreso: string;
  egreso: string;
  grid: string;
  axis: string;
  label: string;
  /** Fondo de la tarjeta: se usa como separador entre marcas apiladas. */
  surface: string;
}

const FALLBACK: ChartTheme = {
  categoricos: [
    "#2a78d6",
    "#eb6834",
    "#1baf7a",
    "#eda100",
    "#e87ba4",
    "#008300",
    "#4a3aa7",
    "#e34948",
  ],
  ingreso: "#2a78d6",
  egreso: "#e34948",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  label: "#898781",
  surface: "#ffffff",
};

function leerTema(): ChartTheme {
  if (typeof window === "undefined") return FALLBACK;

  const estilos = getComputedStyle(document.documentElement);
  const leer = (nombre: string, porDefecto: string) =>
    estilos.getPropertyValue(nombre).trim() || porDefecto;

  return {
    categoricos: SLOTS_CATEGORICOS.map((slot, i) =>
      leer(slot, FALLBACK.categoricos[i]),
    ),
    ingreso: leer("--chart-ingreso", FALLBACK.ingreso),
    egreso: leer("--chart-egreso", FALLBACK.egreso),
    grid: leer("--chart-grid", FALLBACK.grid),
    axis: leer("--chart-axis", FALLBACK.axis),
    label: leer("--chart-label", FALLBACK.label),
    surface: leer("--card", FALLBACK.surface),
  };
}

export function useChartTheme(): ChartTheme {
  const [tema, setTema] = useState<ChartTheme>(FALLBACK);

  useEffect(() => {
    setTema(leerTema());

    // next-themes cambia la clase del <html>; hay que releer los colores.
    const observer = new MutationObserver(() => setTema(leerTema()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return tema;
}

/**
 * Color de una categoría por su posición en la lista ordenada.
 * A partir del noveno, todo cae en "Otras": nunca se generan tonos nuevos.
 */
export const MAX_CATEGORIAS_GRAFICO = 7;
