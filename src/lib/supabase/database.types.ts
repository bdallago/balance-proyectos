/**
 * Tipos de la base de datos.
 *
 * Escritos a mano para reflejar exactamente las migraciones de
 * /supabase/migrations. Una vez creado el proyecto en Supabase se pueden
 * regenerar con:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 */

export type TipoMovimiento = "ingreso" | "egreso";
export type Moneda = "ARS" | "USD";
export type EstadoMovimiento = "efectuado" | "planificado";
export type FrecuenciaRecurrencia = "mensual" | "anual";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          slug: string;
          activo: boolean;
          peso_prorrateo: number;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          slug: string;
          activo?: boolean;
          peso_prorrateo?: number;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          slug?: string;
          activo?: boolean;
          peso_prorrateo?: number;
          color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          tipo: TipoMovimiento;
          archivada: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          tipo: TipoMovimiento;
          archivada?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          tipo?: TipoMovimiento;
          archivada?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      movements: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          category_id: string;
          fecha: string;
          descripcion: string;
          tipo: TipoMovimiento;
          monto_origen: number;
          moneda_origen: Moneda;
          monto_ars: number;
          monto_usd: number;
          tasa_usada: number;
          tasa_fecha: string;
          estado: EstadoMovimiento;
          recurrence_id: string | null;
          comprobante_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          category_id: string;
          fecha: string;
          descripcion: string;
          tipo: TipoMovimiento;
          monto_origen: number;
          moneda_origen: Moneda;
          monto_ars: number;
          monto_usd: number;
          tasa_usada: number;
          tasa_fecha: string;
          estado?: EstadoMovimiento;
          recurrence_id?: string | null;
          comprobante_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          category_id?: string;
          fecha?: string;
          descripcion?: string;
          tipo?: TipoMovimiento;
          monto_origen?: number;
          moneda_origen?: Moneda;
          monto_ars?: number;
          monto_usd?: number;
          tasa_usada?: number;
          tasa_fecha?: string;
          estado?: EstadoMovimiento;
          recurrence_id?: string | null;
          comprobante_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recurrences: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          category_id: string;
          descripcion: string;
          tipo: TipoMovimiento;
          monto_origen: number;
          moneda_origen: Moneda;
          frecuencia: FrecuenciaRecurrencia;
          dia_del_mes: number;
          fecha_inicio: string;
          fecha_fin: string | null;
          activa: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          category_id: string;
          descripcion: string;
          tipo: TipoMovimiento;
          monto_origen: number;
          moneda_origen: Moneda;
          frecuencia: FrecuenciaRecurrencia;
          dia_del_mes: number;
          fecha_inicio: string;
          fecha_fin?: string | null;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          category_id?: string;
          descripcion?: string;
          tipo?: TipoMovimiento;
          monto_origen?: number;
          moneda_origen?: Moneda;
          frecuencia?: FrecuenciaRecurrencia;
          dia_del_mes?: number;
          fecha_inicio?: string;
          fecha_fin?: string | null;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      fx_rates: {
        Row: {
          fecha: string;
          compra: number;
          venta: number;
          fuente: string;
          fetched_at: string;
        };
        Insert: {
          fecha: string;
          compra: number;
          venta: number;
          fuente?: string;
          fetched_at?: string;
        };
        Update: {
          fecha?: string;
          compra?: number;
          venta?: number;
          fuente?: string;
          fetched_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      fx_rate_for_date: {
        Args: { p_fecha: string };
        Returns: Database["public"]["Tables"]["fx_rates"]["Row"][];
      };
    };
    Enums: {
      tipo_movimiento: TipoMovimiento;
      moneda: Moneda;
      estado_movimiento: EstadoMovimiento;
      frecuencia_recurrencia: FrecuenciaRecurrencia;
    };
    CompositeTypes: Record<never, never>;
  };
}

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Movement = Database["public"]["Tables"]["movements"]["Row"];
export type Recurrence = Database["public"]["Tables"]["recurrences"]["Row"];
export type FxRate = Database["public"]["Tables"]["fx_rates"]["Row"];
