import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>No se pudo iniciar sesión</CardTitle>
          <CardDescription>
            Google devolvió el control pero el canje del código falló.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {motivo ? (
            <p className="text-muted-foreground rounded-md border p-3 font-mono text-xs break-words">
              {motivo}
            </p>
          ) : null}
          <p className="text-muted-foreground text-sm">
            Suele pasar cuando la URL de callback no está autorizada en
            Supabase o en la consola de Google. Revisá que{" "}
            <code className="text-xs">/auth/callback</code> figure en las
            Redirect URLs.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Volver a intentar</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
