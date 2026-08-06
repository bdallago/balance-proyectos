import type { Metadata } from "next";

import { LoginButton } from "@/components/auth/login-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Balance de proyectos</CardTitle>
          <CardDescription>
            Ingresos y egresos de tus proyectos, en pesos y en dólares.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginButton next={next} />
        </CardContent>
      </Card>
    </main>
  );
}
