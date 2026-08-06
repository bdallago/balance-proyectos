export function EmptyChart({ mensaje }: { mensaje: string }) {
  return (
    <div className="text-muted-foreground flex h-[260px] items-center justify-center rounded-md border border-dashed text-sm">
      {mensaje}
    </div>
  );
}
