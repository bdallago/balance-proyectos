"use client";

import { CategoriasPanel } from "@/components/ajustes/categorias-panel";
import { CotizacionPanel } from "@/components/ajustes/cotizacion-panel";
import { ProyectosPanel } from "@/components/ajustes/proyectos-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FxRate } from "@/lib/supabase/database.types";

export function AjustesView({ ultimaTasa }: { ultimaTasa: FxRate | null }) {
  return (
    <Tabs defaultValue="proyectos" className="space-y-4">
      <TabsList>
        <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
        <TabsTrigger value="categorias">Categorías</TabsTrigger>
        <TabsTrigger value="cotizacion">Cotización</TabsTrigger>
      </TabsList>

      <TabsContent value="proyectos">
        <ProyectosPanel />
      </TabsContent>

      <TabsContent value="categorias">
        <CategoriasPanel />
      </TabsContent>

      <TabsContent value="cotizacion">
        <CotizacionPanel ultimaTasa={ultimaTasa} />
      </TabsContent>
    </Tabs>
  );
}
