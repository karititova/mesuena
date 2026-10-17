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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      explicaciones: {
        Row: {
          clave: string
          creada: string
          sesion_id: string
          texto: string
        }
        Insert: {
          clave: string
          creada?: string
          sesion_id: string
          texto: string
        }
        Update: {
          clave?: string
          creada?: string
          sesion_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "explicaciones_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      participantes: {
        Row: {
          apodo: string
          creado: string
          demo: boolean
          dispositivo: string
          id: string
          sesion_id: string
        }
        Insert: {
          apodo: string
          creado?: string
          demo?: boolean
          dispositivo: string
          id?: string
          sesion_id: string
        }
        Update: {
          apodo?: string
          creado?: string
          demo?: boolean
          dispositivo?: string
          id?: string
          sesion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participantes_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      preguntas: {
        Row: {
          configuracion: Json | null
          correcta: number | null
          error_pulso: number | null
          id: string
          opciones: Json | null
          orden: number
          ritmo: string[]
          ronda: number
          sesion_id: string
          suena: string[] | null
        }
        Insert: {
          configuracion?: Json | null
          correcta?: number | null
          error_pulso?: number | null
          id?: string
          opciones?: Json | null
          orden: number
          ritmo: string[]
          ronda?: number
          sesion_id: string
          suena?: string[] | null
        }
        Update: {
          configuracion?: Json | null
          correcta?: number | null
          error_pulso?: number | null
          id?: string
          opciones?: Json | null
          orden?: number
          ritmo?: string[]
          ronda?: number
          sesion_id?: string
          suena?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      respuestas: {
        Row: {
          acierto: boolean
          aciertos: boolean[]
          creada: string
          entrada: Json
          equivalencias: Json
          id: string
          participante_id: string
          pregunta_id: string
          respuesta: string[]
          sesion_id: string
          tiempo_ms: number | null
        }
        Insert: {
          acierto: boolean
          aciertos: boolean[]
          creada?: string
          entrada: Json
          equivalencias?: Json
          id?: string
          participante_id: string
          pregunta_id: string
          respuesta: string[]
          sesion_id: string
          tiempo_ms?: number | null
        }
        Update: {
          acierto?: boolean
          aciertos?: boolean[]
          creada?: string
          entrada?: Json
          equivalencias?: Json
          id?: string
          participante_id?: string
          pregunta_id?: string
          respuesta?: string[]
          sesion_id?: string
          tiempo_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "preguntas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      salas: {
        Row: {
          actualizada: string
          estado: string
          participantes: number
          pregunta_actual: number
          respuestas: number
          sesion_id: string
        }
        Insert: {
          actualizada?: string
          estado: string
          participantes?: number
          pregunta_actual: number
          respuestas?: number
          sesion_id: string
        }
        Update: {
          actualizada?: string
          estado?: string
          participantes?: number
          pregunta_actual?: number
          respuestas?: number
          sesion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salas_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: true
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones: {
        Row: {
          codigo: string
          compas: string
          creada: string
          ejercicio: string
          estado: string
          figuras: string[]
          id: string
          inicio_ronda: number
          nivel: number
          num_compases: number
          num_preguntas: number
          ppm: number
          pregunta_actual: number
          preguntas_ronda: number
          profesora_id: string
          ronda: number
          uso_demo: boolean
        }
        Insert: {
          codigo: string
          compas: string
          creada?: string
          ejercicio: string
          estado?: string
          figuras: string[]
          id?: string
          inicio_ronda?: number
          nivel: number
          num_compases?: number
          num_preguntas: number
          ppm: number
          pregunta_actual?: number
          preguntas_ronda?: number
          profesora_id: string
          ronda?: number
          uso_demo?: boolean
        }
        Update: {
          codigo?: string
          compas?: string
          creada?: string
          ejercicio?: string
          estado?: string
          figuras?: string[]
          id?: string
          inicio_ronda?: number
          nivel?: number
          num_compases?: number
          num_preguntas?: number
          ppm?: number
          pregunta_actual?: number
          preguntas_ronda?: number
          profesora_id?: string
          ronda?: number
          uso_demo?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anadir_ronda: {
        Args: { _cfg: Json; _id: string; _preguntas: Json }
        Returns: undefined
      }
      borrar_clases: {
        Args: { _id?: string; _solo_demo?: boolean }
        Returns: number
      }
      es_mi_sesion: { Args: { _sesion: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
