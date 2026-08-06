/**
 * Leyenda de gráficos.
 *
 * Siempre presente cuando hay dos o más series, para que la identidad no
 * dependa solo del color. El texto va en tinta normal; el cuadrito de
 * color es el que lleva la identidad.
 */
export function ChartLegend({
  items,
}: {
  items: { nombre: string; color: string }[];
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li
          key={item.nombre}
          className="text-muted-foreground flex items-center gap-1.5 text-xs"
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-[2px]"
            style={{ backgroundColor: item.color }}
          />
          {item.nombre}
        </li>
      ))}
    </ul>
  );
}
