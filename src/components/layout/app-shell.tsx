"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Menu,
  Plus,
  Repeat,
  Settings,
  Wallet,
} from "lucide-react";

import { MonedaToggle } from "@/components/layout/moneda-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { QuickAddDialog } from "@/components/movimientos/quick-add-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Balance", icon: LayoutDashboard },
  { href: "/proyectos", label: "Proyectos", icon: Wallet },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/recurrentes", label: "Recurrentes", icon: Repeat },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

function esRutaActiva(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {NAV.map(({ href, label, icon: Icon }) => {
        const activo = esRutaActiva(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activo
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({
  email,
  nombre,
  avatarUrl,
  children,
}: {
  email: string;
  nombre: string;
  avatarUrl?: string;
  children: React.ReactNode;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargaRapidaAbierta, setCargaRapidaAbierta] = useState(false);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4">
          <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="border-b">
                <SheetTitle>Balance de proyectos</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                <NavLinks onNavigate={() => setMenuAbierto(false)} />
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="mr-2 hidden items-center gap-2 md:flex">
            <span className="text-sm font-semibold tracking-tight">Balance</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLinks />
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <MonedaToggle />
            <Button
              size="sm"
              onClick={() => setCargaRapidaAbierta(true)}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Cargar</span>
              <kbd className="bg-primary-foreground/15 ml-1 hidden rounded px-1.5 py-0.5 font-mono text-[10px] lg:inline">
                Ctrl K
              </kbd>
            </Button>
            <UserMenu nombre={nombre} email={email} avatarUrl={avatarUrl} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>

      <QuickAddDialog
        open={cargaRapidaAbierta}
        onOpenChange={setCargaRapidaAbierta}
      />
    </div>
  );
}
