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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      confirmations: {
        Row: {
          confirmation_data: Json | null
          confirmed_at: string
          created_at: string
          id: string
          record_id: string
          record_type: Database["public"]["Enums"]["confirmation_type"]
          user_id: string
        }
        Insert: {
          confirmation_data?: Json | null
          confirmed_at?: string
          created_at?: string
          id?: string
          record_id: string
          record_type: Database["public"]["Enums"]["confirmation_type"]
          user_id: string
        }
        Update: {
          confirmation_data?: Json | null
          confirmed_at?: string
          created_at?: string
          id?: string
          record_id?: string
          record_type?: Database["public"]["Enums"]["confirmation_type"]
          user_id?: string
        }
        Relationships: []
      }
      driver_snapshots: {
        Row: {
          created_at: string
          efficiency_score: number | null
          id: string
          net_profit: number | null
          snapshot_date: string
          total_earnings: number
          total_expenses: number
          total_km: number
          user_id: string
        }
        Insert: {
          created_at?: string
          efficiency_score?: number | null
          id?: string
          net_profit?: number | null
          snapshot_date: string
          total_earnings?: number
          total_expenses?: number
          total_km?: number
          user_id: string
        }
        Update: {
          created_at?: string
          efficiency_score?: number | null
          id?: string
          net_profit?: number | null
          snapshot_date?: string
          total_earnings?: number
          total_expenses?: number
          total_km?: number
          user_id?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          accuracy: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed: number | null
          trip_id: string
        }
        Insert: {
          accuracy?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          speed?: number | null
          trip_id: string
        }
        Update: {
          accuracy?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed?: number | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenances: {
        Row: {
          cost: number | null
          created_at: string
          description: string | null
          id: string
          next_due_km: number | null
          odometer_km: number
          performed_at: string
          status: Database["public"]["Enums"]["maintenance_status"]
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          next_due_km?: number | null
          odometer_km: number
          performed_at?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          next_due_km?: number | null
          odometer_km?: number
          performed_at?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          type?: Database["public"]["Enums"]["maintenance_type"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenances_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          org_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          org_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          org_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      refuelings: {
        Row: {
          created_at: string
          id: string
          liters: number
          odometer_km: number
          price_per_liter: number | null
          station_name: string | null
          total_cost: number
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liters: number
          odometer_km: number
          price_per_liter?: number | null
          station_name?: string | null
          total_cost: number
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liters?: number
          odometer_km?: number
          price_per_liter?: number | null
          station_name?: string | null
          total_cost?: number
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refuelings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_apps: {
        Row: {
          created_at: string
          id: string
          label: string
          max_vehicle_age: number | null
          min_vehicle_year: number | null
          name: string
          requirements_json: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          max_vehicle_age?: number | null
          min_vehicle_year?: number | null
          name: string
          requirements_json?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          max_vehicle_age?: number | null
          min_vehicle_year?: number | null
          name?: string
          requirements_json?: Json | null
        }
        Relationships: []
      }
      shifts: {
        Row: {
          created_at: string
          ended_at: string | null
          final_odometer_km: number | null
          id: string
          initial_odometer_km: number
          started_at: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          final_odometer_km?: number | null
          id?: string
          initial_odometer_km: number
          started_at?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          final_odometer_km?: number | null
          id?: string
          initial_odometer_km?: number
          started_at?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          app_name: string | null
          category: Database["public"]["Enums"]["trip_category"]
          created_at: string
          distance_km: number | null
          end_location: Json | null
          ended_at: string | null
          estimated_distance_km: number | null
          fare_amount: number | null
          id: string
          route_geojson: Json | null
          shift_id: string
          start_location: Json | null
          started_at: string
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          app_name?: string | null
          category: Database["public"]["Enums"]["trip_category"]
          created_at?: string
          distance_km?: number | null
          end_location?: Json | null
          ended_at?: string | null
          estimated_distance_km?: number | null
          fare_amount?: number | null
          id?: string
          route_geojson?: Json | null
          shift_id: string
          start_location?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          app_name?: string | null
          category?: Database["public"]["Enums"]["trip_category"]
          created_at?: string
          distance_km?: number | null
          end_location?: Json | null
          ended_at?: string | null
          estimated_distance_km?: number | null
          fare_amount?: number | null
          id?: string
          route_geojson?: Json | null
          shift_id?: string
          start_location?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ride_apps: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          ride_app_id: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          ride_app_id: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          ride_app_id?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ride_apps_ride_app_id_fkey"
            columns: ["ride_app_id"]
            isOneToOne: false
            referencedRelation: "ride_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ride_apps_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_components: {
        Row: {
          cost: number | null
          created_at: string
          id: string
          installed_at_km: number
          label: string
          last_replaced_at: string | null
          lifespan_km: number
          name: string
          status: Database["public"]["Enums"]["component_status"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          id?: string
          installed_at_km?: number
          label: string
          last_replaced_at?: string | null
          lifespan_km: number
          name: string
          status?: Database["public"]["Enums"]["component_status"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          id?: string
          installed_at_km?: number
          label?: string
          last_replaced_at?: string | null
          lifespan_km?: number
          name?: string
          status?: Database["public"]["Enums"]["component_status"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_components_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string
          due_date: string | null
          frequency: Database["public"]["Enums"]["expense_frequency"]
          id: string
          status: Database["public"]["Enums"]["expense_status"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description: string
          due_date?: string | null
          frequency?: Database["public"]["Enums"]["expense_frequency"]
          id?: string
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string
          due_date?: string | null
          frequency?: Database["public"]["Enums"]["expense_frequency"]
          id?: string
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          created_at: string
          current_odometer_km: number
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          model: string
          org_id: string | null
          plate: string
          status: Database["public"]["Enums"]["vehicle_status"]
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          brand: string
          created_at?: string
          current_odometer_km?: number
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          model: string
          org_id?: string | null
          plate: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          brand?: string
          created_at?: string
          current_odometer_km?: number
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          model?: string
          org_id?: string | null
          plate?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      snapshot_daily_update: {
        Args: { p_date: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      component_status: "good" | "warning" | "critical" | "replaced"
      confirmation_type:
        | "trip"
        | "refueling"
        | "maintenance"
        | "expense"
        | "shift"
      expense_category:
        | "ipva"
        | "insurance"
        | "licensing"
        | "financing"
        | "rent"
        | "maintenance"
        | "fuel"
        | "other"
      expense_frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
      expense_status: "pending" | "paid" | "overdue"
      fuel_type:
        | "gasoline"
        | "ethanol"
        | "diesel"
        | "flex"
        | "electric"
        | "hybrid"
      maintenance_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      maintenance_type:
        | "preventive"
        | "corrective"
        | "inspection"
        | "tire_change"
        | "oil_change"
        | "other"
      shift_status: "active" | "completed" | "cancelled"
      trip_category:
        | "passenger_pickup"
        | "passenger_dropoff"
        | "repositioning"
        | "refueling"
        | "personal"
        | "unpaid_detour"
      trip_status: "in_progress" | "completed" | "cancelled"
      user_role: "admin" | "manager" | "driver" | "viewer"
      vehicle_status: "active" | "inactive" | "sold" | "retired"
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
      component_status: ["good", "warning", "critical", "replaced"],
      confirmation_type: [
        "trip",
        "refueling",
        "maintenance",
        "expense",
        "shift",
      ],
      expense_category: [
        "ipva",
        "insurance",
        "licensing",
        "financing",
        "rent",
        "maintenance",
        "fuel",
        "other",
      ],
      expense_frequency: ["daily", "weekly", "monthly", "quarterly", "yearly"],
      expense_status: ["pending", "paid", "overdue"],
      fuel_type: [
        "gasoline",
        "ethanol",
        "diesel",
        "flex",
        "electric",
        "hybrid",
      ],
      maintenance_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      maintenance_type: [
        "preventive",
        "corrective",
        "inspection",
        "tire_change",
        "oil_change",
        "other",
      ],
      shift_status: ["active", "completed", "cancelled"],
      trip_category: [
        "passenger_pickup",
        "passenger_dropoff",
        "repositioning",
        "refueling",
        "personal",
        "unpaid_detour",
      ],
      trip_status: ["in_progress", "completed", "cancelled"],
      user_role: ["admin", "manager", "driver", "viewer"],
      vehicle_status: ["active", "inactive", "sold", "retired"],
    },
  },
} as const
