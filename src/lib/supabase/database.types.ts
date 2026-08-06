/**
 * Tipos de la base de datos.
 *
 * GENERADO — no editar a mano. Para regenerar:
 *
 *   npx supabase gen types typescript --project-id <ref> --schema public \
 *     > src/lib/supabase/database.types.ts
 *
 * y volver a pegar el bloque de alias del final.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          archivada: boolean
          created_at: string
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          user_id: string
        }
        Insert: {
          archivada?: boolean
          created_at?: string
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          user_id: string
        }
        Update: {
          archivada?: boolean
          created_at?: string
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
          user_id?: string
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          compra: number
          fecha: string
          fetched_at: string
          fuente: string
          venta: number
        }
        Insert: {
          compra: number
          fecha: string
          fetched_at?: string
          fuente?: string
          venta: number
        }
        Update: {
          compra?: number
          fecha?: string
          fetched_at?: string
          fuente?: string
          venta?: number
        }
        Relationships: []
      }
      movements: {
        Row: {
          category_id: string
          comprobante_path: string | null
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["estado_movimiento"]
          fecha: string
          id: string
          moneda_origen: Database["public"]["Enums"]["moneda"]
          monto_ars: number
          monto_origen: number
          monto_usd: number
          project_id: string | null
          recurrence_id: string | null
          tasa_fecha: string
          tasa_usada: number
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          comprobante_path?: string | null
          created_at?: string
          descripcion: string
          estado?: Database["public"]["Enums"]["estado_movimiento"]
          fecha: string
          id?: string
          moneda_origen: Database["public"]["Enums"]["moneda"]
          monto_ars: number
          monto_origen: number
          monto_usd: number
          project_id?: string | null
          recurrence_id?: string | null
          tasa_fecha: string
          tasa_usada: number
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          comprobante_path?: string | null
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_movimiento"]
          fecha?: string
          id?: string
          moneda_origen?: Database["public"]["Enums"]["moneda"]
          monto_ars?: number
          monto_origen?: number
          monto_usd?: number
          project_id?: string | null
          recurrence_id?: string | null
          tasa_fecha?: string
          tasa_usada?: number
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movements_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_recurrence_id_fkey"
            columns: ["recurrence_id"]
            isOneToOne: false
            referencedRelation: "recurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          activo: boolean
          color: string
          created_at: string
          id: string
          nombre: string
          peso_prorrateo: number
          slug: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          color?: string
          created_at?: string
          id?: string
          nombre: string
          peso_prorrateo?: number
          slug: string
          user_id: string
        }
        Update: {
          activo?: boolean
          color?: string
          created_at?: string
          id?: string
          nombre?: string
          peso_prorrateo?: number
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
      recurrences: {
        Row: {
          activa: boolean
          category_id: string
          created_at: string
          descripcion: string
          dia_del_mes: number
          fecha_fin: string | null
          fecha_inicio: string
          frecuencia: Database["public"]["Enums"]["frecuencia_recurrencia"]
          id: string
          moneda_origen: Database["public"]["Enums"]["moneda"]
          monto_origen: number
          project_id: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activa?: boolean
          category_id: string
          created_at?: string
          descripcion: string
          dia_del_mes: number
          fecha_fin?: string | null
          fecha_inicio: string
          frecuencia: Database["public"]["Enums"]["frecuencia_recurrencia"]
          id?: string
          moneda_origen: Database["public"]["Enums"]["moneda"]
          monto_origen: number
          project_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activa?: boolean
          category_id?: string
          created_at?: string
          descripcion?: string
          dia_del_mes?: number
          fecha_fin?: string | null
          fecha_inicio?: string
          frecuencia?: Database["public"]["Enums"]["frecuencia_recurrencia"]
          id?: string
          moneda_origen?: Database["public"]["Enums"]["moneda"]
          monto_origen?: number
          project_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurrences_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fx_rate_for_date: {
        Args: { p_fecha: string }
        Returns: {
          compra: number
          fecha: string
          fetched_at: string
          fuente: string
          venta: number
        }[]
        SetofOptions: {
          from: "*"
          to: "fx_rates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      estado_movimiento: "efectuado" | "planificado"
      frecuencia_recurrencia: "mensual" | "anual"
      moneda: "ARS" | "USD"
      tipo_movimiento: "ingreso" | "egreso"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_movimiento: ["efectuado", "planificado"],
      frecuencia_recurrencia: ["mensual", "anual"],
      moneda: ["ARS", "USD"],
      tipo_movimiento: ["ingreso", "egreso"],
    },
  },
} as const

// ─────────────────────────────────────────────────────────────
// Alias de conveniencia usados en toda la app.
// Este bloque se escribe a mano: si regenerás el archivo, volvé a pegarlo.
// ─────────────────────────────────────────────────────────────

export type TipoMovimiento = Database["public"]["Enums"]["tipo_movimiento"];
export type Moneda = Database["public"]["Enums"]["moneda"];
export type EstadoMovimiento =
  Database["public"]["Enums"]["estado_movimiento"];
export type FrecuenciaRecurrencia =
  Database["public"]["Enums"]["frecuencia_recurrencia"];

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Movement = Database["public"]["Tables"]["movements"]["Row"];
export type Recurrence = Database["public"]["Tables"]["recurrences"]["Row"];
export type FxRate = Database["public"]["Tables"]["fx_rates"]["Row"];
