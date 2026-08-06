import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Callback del OAuth de Google.
 *
 * Supabase redirige acá con un `code` que se canjea por una sesión. El
 * cliente de servidor escribe las cookies en la respuesta.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Solo rutas relativas: evita que un `next` armado a mano redirija afuera.
  const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?motivo=${encodeURIComponent(error.message)}`,
    );
  }

  // En Vercel el request llega al origin interno; x-forwarded-host tiene
  // el dominio real del deploy.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const enProduccion = process.env.NODE_ENV === "production";

  if (enProduccion && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${destino}`);
  }

  return NextResponse.redirect(`${origin}${destino}`);
}
