<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Guía del proyecto

App de balance de ingresos y egresos por proyecto de software. Un solo
usuario. El spec original está en `prompt-app-gastos.md` y sigue siendo la
fuente de verdad de requisitos.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

No hay suite de tests. Antes de dar algo por terminado, corré
`npm run typecheck && npm run lint && npm run build`.

## Versión de Next

El proyecto está **pineado a Next 15.5.x** porque el spec lo pide, aunque
`create-next-app@latest` instale Next 16. `package.json` tiene `overrides`
para `postcss` y `sharp`: sin eso, las deps transitivas de Next 15 arrastran
tres advisories high y `npm audit fix` te empuja a Next 16. Si tocás
versiones, verificá que `npm audit` siga en cero.

## Reglas de dominio que no son obvias leyendo un archivo suelto

### 1. El tipo de cambio se congela (`src/lib/fx.ts`)

`movements` guarda `monto_ars`, `monto_usd`, `tasa_usada` y `tasa_fecha`
congelados en el momento de la carga. **Nunca recalcular montos históricos
con la cotización actual.**

- La tasa aplicable a una fecha es la de esa fecha o **la última anterior**
  (`fx_rate_for_date` en la base, `resolverTasa` en el cliente).
- `congelarMontos()` es el único lugar donde se arma el par ARS/USD.
- La **única** recotización de la app es `efectuarMovimiento()`: al pasar
  un planificado a efectuado se recalcula contra la fecha real.
- Las Server Actions no pisan la tasa que manda el formulario: el usuario
  puede forzar una cotización distinta a propósito.

### 2. El prorrateo se calcula al vuelo (`src/lib/prorrateo.ts`, `src/lib/balances.ts`)

`project_id = null` es gasto compartido. Se reparte entre los proyectos
**activos** por `peso_prorrateo`, **sin guardar filas duplicadas**.

Invariante: `suma(balance de cada proyecto) === balance general`. Se
sostiene con `repartirPorRestoMayor()`, que reparte centavos enteros —
redondear cada fracción por separado lo rompe. La pantalla de Proyectos
verifica el invariante en pantalla.

Excepción real y documentada: sin proyectos activos no hay entre quiénes
repartir. Eso sale por `Balances.compartidoSinRepartir` y la UI lo avisa.

### 3. Moneda de origen vs. derivada

El formulario muestra ARS y USD a la vez. El campo que se escribe define
`moneda_origen` (importe real); el otro es derivado. En
`movement-form.tsx`, el efecto que recalcula el derivado **excluye a
propósito** `monto_ars`/`monto_usd` de sus dependencias: incluirlos haría
que se dispare con cada tecla y pise lo que se está escribiendo.

## Fechas

Las columnas `date` se manejan siempre como strings `"YYYY-MM-DD"`. Nunca
`new Date(iso)` a secas: eso parsea en UTC y en Argentina devuelve el día
anterior. Usá los helpers de `src/lib/dates.ts`, que trabajan a mediodía
local.

## Gráficos

La paleta está en `globals.css` (`--chart-1..8`, `--chart-ingreso`,
`--chart-egreso`) y **está validada** para daltonismo y contraste en ambos
modos con el validador de la skill `dataviz`. Si cambiás colores, revalidá.

- Los ocho tonos categóricos se asignan **en orden fijo, nunca ciclados**.
  A partir del octavo, todo va a "Otras".
- Ingresos/egresos usan el par divergente **azul↔rojo**, no verde/rojo:
  verde/rojo mide ΔE 6.9 para daltonismo (banda de riesgo) contra 21.6 del
  par elegido.
- En modo claro, aqua/amarillo/magenta quedan bajo 3:1 de contraste. Por
  eso el gráfico de torta lleva siempre la lista con nombre y monto al
  lado: la identidad no puede depender solo del color.

Recharts necesita colores concretos, no variables CSS: `useChartTheme()`
las lee del documento y las relee cuando cambia el tema.

## Convenciones

- Todo en **español rioplatense**: UI, nombres de columnas, enums,
  identificadores del dominio (`fecha`, `descripcion`, `monto_origen`).
- Formato `es-AR` vía `src/lib/format.ts`. ARS sin decimales, USD con dos.
- El CSV se exporta con `;` y BOM: es lo que Excel en configuración
  argentina abre sin pasar por el asistente de importación.
- Server Actions devuelven `ActionResult<T>` (`{ ok, data } | { ok, error }`),
  nunca lanzan para errores esperables.
- `createAdminClient()` saltea RLS. Solo lo usan el cron y la
  actualización forzada de cotización.

## Seguridad

El repo es **público**. `.gitignore` cubre `.env*` (salvo `.env.example`),
`.vercel`, `.supabase`, claves, certificados y dumps de base. Antes de
commitear algo nuevo que pueda tener secretos, verificá que esté cubierto.
