"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Dark mode. Arranca en "system" para respetar la preferencia del SO,
 * como pide el spec, y permite forzarlo desde el menú de usuario.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
