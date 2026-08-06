# Prompt para Claude Code — App de gastos por proyecto

Construí una aplicación web personal (un solo usuario: yo) para llevar el balance de ingresos y egresos de mis proyectos de software. Reemplaza una planilla de Google Sheets. Quiero el proyecto completo, funcionando y listo para deployar.

## Stack obligatorio

- Next.js 15 con App Router y TypeScript
- Tailwind CSS + shadcn/ui
- Supabase para base de datos (Postgres), autenticación y storage
- Autenticación exclusivamente con Google OAuth vía Supabase Auth
- Recharts para gráficos
- Deploy en Vercel (incluí `vercel.json` con el cron)
- Zod para validación de formularios, react-hook-form para los inputs

No agregues librerías de estado global ni ORMs pesados. Usá el cliente de Supabase directamente con tipos generados.

## Modelo de datos

Creá las migraciones SQL en `/supabase/migrations`. Todas las tablas con RLS activo y política `auth.uid() = user_id`.

**projects**
- `id` uuid pk, `user_id` uuid, `nombre` text, `slug` text, `activo` boolean default true, `peso_prorrateo` numeric default 1, `color` text, `created_at`

**categories**
- `id` uuid pk, `user_id` uuid, `nombre` text, `tipo` enum('ingreso','egreso'), `archivada` boolean default false
- Seedear al crear el usuario: ingresos → Ventas, Suscripciones, Otros. Egresos → Infraestructura, Herramientas, Datos y APIs, Marketing, Impuestos y comisiones, Servicios profesionales, Legales y registro, Otros.

**movements**
- `id` uuid pk, `user_id` uuid, `project_id` uuid nullable (null = gasto compartido), `category_id` uuid
- `fecha` date, `descripcion` text, `tipo` enum('ingreso','egreso')
- `monto_origen` numeric, `moneda_origen` enum('ARS','USD')
- `monto_ars` numeric, `monto_usd` numeric, `tasa_usada` numeric, `tasa_fecha` date
- `estado` enum('efectuado','planificado')
- `recurrence_id` uuid nullable, `comprobante_path` text nullable
- `created_at`, `updated_at`

**recurrences**
- `id` uuid pk, `user_id`, `project_id` nullable, `category_id`, `descripcion`, `tipo`, `monto_origen`, `moneda_origen`, `frecuencia` enum('mensual','anual'), `dia_del_mes` int, `fecha_inicio` date, `fecha_fin` date nullable, `activa` boolean

**fx_rates**
- `fecha` date pk, `compra` numeric, `venta` numeric, `fuente` text default 'BNA', `fetched_at` timestamptz

## Regla central: el tipo de cambio se congela

Esto es lo más importante de la app, no lo simplifiques.

Cada movimiento guarda `monto_ars`, `monto_usd` y la `tasa_usada` en el momento de la carga. **Nunca recalcules montos históricos con la cotización actual.** Un gasto de abril de USD 20 vale lo que valía en abril; si el balance histórico cambia solo, la app no sirve.

- Referencia por defecto: **dólar Oficial BNA, valor VENTA**.
- Fuente: `https://dolarapi.com/v1/dolares/oficial` (gratis, sin API key).
- Un cron de Vercel corre todos los días a las 21:00 hora de Argentina (`0 0 * * *` en UTC) y guarda el cierre en `fx_rates`. Ruta: `/api/cron/fx`, protegida con `CRON_SECRET`.
- Al cargar un movimiento se usa la cotización de `fx_rates` correspondiente a la fecha del movimiento. Si no existe (fin de semana, feriado, o carga retroactiva), se usa la última disponible anterior a esa fecha, y la UI lo indica con un texto chico bajo el input: "Tasa del DD/MM: $X".
- Si la API falla, el cron reintenta y la app permite igual cargar movimientos con la última tasa conocida, marcándolo visualmente.
- La `tasa_usada` es editable manualmente por si quiero forzar otra (por ejemplo una venta cobrada a un tipo de cambio distinto).

## Conversión en el formulario

Dos campos de monto visibles al mismo tiempo: **ARS** y **USD**. Se escribe en cualquiera de los dos y el otro se completa solo en tiempo real usando la tasa de la fecha elegida. El campo donde escribí queda marcado como `moneda_origen` (es el importe real, el otro es el derivado). Si cambio la fecha del movimiento, se recalcula el derivado.

## Prorrateo de gastos compartidos

Un movimiento con `project_id = null` es un gasto compartido (ej: Claude Pro, Cursor: sirven a todos los proyectos).

- En las vistas por proyecto, estos gastos se reparten automáticamente entre los proyectos **activos**, ponderados por su `peso_prorrateo` (default 1 para todos, o sea partes iguales).
- El prorrateo se calcula al vuelo en las consultas, **no se guardan filas duplicadas** en la base.
- En la vista de cada proyecto, la porción prorrateada se muestra en una fila o sección visualmente diferenciada, con una etiqueta tipo "Compartido (1/3)", para que se distinga del gasto directo.
- El balance general suma el 100% del gasto compartido una sola vez. Verificá que la suma de los balances por proyecto sea igual al balance general.

## Pantallas

**Dashboard (balance general)**
- Tarjetas: Ingresos totales, Egresos totales, Balance neto, y Balance proyectado (incluyendo planificados).
- Conmutador global **ARS / USD** que afecta a todos los números y gráficos.
- Gráfico de líneas: evolución del balance acumulado por mes.
- Gráfico de barras apiladas: ingresos vs egresos por mes.
- Gráfico de torta: egresos por categoría.
- Gráfico de barras: balance por proyecto.
- Filtros de rango de fechas y de estado (efectuado / planificado / ambos).

**Vista por proyecto**
- Misma estructura que el dashboard pero acotada al proyecto, incluyendo su porción prorrateada de gastos compartidos.
- Tabla de movimientos del proyecto.

**Movimientos**
- Tabla ordenable y filtrable por fecha, proyecto, categoría, tipo, estado y moneda. Búsqueda por descripción.
- Edición inline o modal, borrado con confirmación.
- Botón de exportar a CSV respetando los filtros activos.

**Recurrentes**
- ABM de movimientos recurrentes. El mismo cron diario genera los movimientos que corresponden al día, en estado `planificado`, sin duplicar (chequear por `recurrence_id` + fecha).
- Desde la lista de movimientos, un planificado se marca como efectuado con un click, y ahí se recalcula la tasa contra la fecha real de efectivización.

**Ajustes**
- ABM de proyectos (nombre, color, activo, peso de prorrateo) y de categorías.
- Cotización actual y fecha del último fetch, con botón para forzar la actualización.

## Carga rápida

Un modal de alta de movimiento accesible con `⌘K` / `Ctrl+K` desde cualquier pantalla, con foco automático en descripción, navegación completa por teclado y `Enter` para guardar. La fecha por defecto es hoy. Recordá el último proyecto usado. Cargar un gasto tiene que llevar menos de diez segundos.

## Comprobantes

Bucket privado de Supabase Storage. Subida opcional de imagen o PDF al crear o editar un movimiento, con preview y descarga por URL firmada.

## Detalles de implementación

- Formato de números: separador de miles con punto y decimales con coma (`es-AR`). ARS sin decimales, USD con dos.
- Toda la interfaz en español rioplatense.
- Dark mode incluido, respetando la preferencia del sistema.
- Responsive: la carga de movimientos tiene que ser cómoda desde el celular.
- `README.md` con los pasos exactos para: crear el proyecto en Supabase, configurar el OAuth de Google, correr las migraciones, las variables de entorno necesarias y el deploy en Vercel con el cron.
- `.env.example` completo.
- Seed opcional con datos de ejemplo para probar los gráficos.

## Entrega

Andá construyendo en este orden y verificá que compile en cada etapa: migraciones y tipos → auth → CRUD de proyectos y categorías → carga de movimientos con conversión → cron de cotizaciones → prorrateo y balances → gráficos → recurrentes → comprobantes → export. No dejes TODOs ni funciones stub.
