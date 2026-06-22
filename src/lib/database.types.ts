export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string;
          name: string;
          plan: "free" | "pro" | "enterprise";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: "free" | "pro" | "enterprise";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          plan?: "free" | "pro" | "enterprise";
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          full_name: string | null;
          phone: string | null;
          role: "admin" | "manager" | "driver" | "viewer";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          full_name?: string | null;
          phone?: string | null;
          role?: "admin" | "manager" | "driver" | "viewer";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          full_name?: string | null;
          phone?: string | null;
          role?: "admin" | "manager" | "driver" | "viewer";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          org_id: string | null;
          user_id: string;
          brand: string;
          model: string;
          year: number;
          plate: string;
          current_odometer_km: number;
          fuel_type: "gasoline" | "ethanol" | "diesel" | "flex" | "electric" | "hybrid";
          status: "active" | "inactive" | "sold" | "retired";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          user_id: string;
          brand: string;
          model: string;
          year: number;
          plate: string;
          current_odometer_km?: number;
          fuel_type?: "gasoline" | "ethanol" | "diesel" | "flex" | "electric" | "hybrid";
          status?: "active" | "inactive" | "sold" | "retired";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          user_id?: string;
          brand?: string;
          model?: string;
          year?: number;
          plate?: string;
          current_odometer_km?: number;
          fuel_type?: "gasoline" | "ethanol" | "diesel" | "flex" | "electric" | "hybrid";
          status?: "active" | "inactive" | "sold" | "retired";
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicle_components: {
        Row: {
          id: string;
          vehicle_id: string;
          name: string;
          label: string;
          lifespan_km: number;
          installed_at_km: number;
          cost: number | null;
          last_replaced_at: string | null;
          status: "good" | "warning" | "critical" | "replaced";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          name: string;
          label: string;
          lifespan_km: number;
          installed_at_km?: number;
          cost?: number | null;
          last_replaced_at?: string | null;
          status?: "good" | "warning" | "critical" | "replaced";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          name?: string;
          label?: string;
          lifespan_km?: number;
          installed_at_km?: number;
          cost?: number | null;
          last_replaced_at?: string | null;
          status?: "good" | "warning" | "critical" | "replaced";
          created_at?: string;
          updated_at?: string;
        };
      };
      shifts: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          started_at: string;
          ended_at: string | null;
          initial_odometer_km: number;
          final_odometer_km: number | null;
          status: "active" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id: string;
          started_at?: string;
          ended_at?: string | null;
          initial_odometer_km: number;
          final_odometer_km?: number | null;
          status?: "active" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vehicle_id?: string;
          started_at?: string;
          ended_at?: string | null;
          initial_odometer_km?: number;
          final_odometer_km?: number | null;
          status?: "active" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          shift_id: string;
          vehicle_id: string;
          user_id: string;
          category: "passenger_pickup" | "passenger_dropoff" | "repositioning" | "refueling" | "personal" | "unpaid_detour";
          status: "in_progress" | "completed" | "cancelled";
          started_at: string;
          ended_at: string | null;
          start_location: Json | null;
          end_location: Json | null;
          distance_km: number | null;
          estimated_distance_km: number | null;
          fare_amount: number | null;
          app_name: string | null;
          route_geojson: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shift_id: string;
          vehicle_id: string;
          user_id: string;
          category: "passenger_pickup" | "passenger_dropoff" | "repositioning" | "refueling" | "personal" | "unpaid_detour";
          status?: "in_progress" | "completed" | "cancelled";
          started_at?: string;
          ended_at?: string | null;
          start_location?: Json | null;
          end_location?: Json | null;
          distance_km?: number | null;
          estimated_distance_km?: number | null;
          fare_amount?: number | null;
          app_name?: string | null;
          route_geojson?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shift_id?: string;
          vehicle_id?: string;
          user_id?: string;
          category?: "passenger_pickup" | "passenger_dropoff" | "repositioning" | "refueling" | "personal" | "unpaid_detour";
          status?: "in_progress" | "completed" | "cancelled";
          started_at?: string;
          ended_at?: string | null;
          start_location?: Json | null;
          end_location?: Json | null;
          distance_km?: number | null;
          estimated_distance_km?: number | null;
          fare_amount?: number | null;
          app_name?: string | null;
          route_geojson?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          trip_id: string;
          latitude: number;
          longitude: number;
          speed: number | null;
          accuracy: number | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          latitude: number;
          longitude: number;
          speed?: number | null;
          accuracy?: number | null;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          latitude?: number;
          longitude?: number;
          speed?: number | null;
          accuracy?: number | null;
          recorded_at?: string;
        };
      };
      refuelings: {
        Row: {
          id: string;
          vehicle_id: string;
          user_id: string;
          liters: number;
          total_cost: number;
          price_per_liter: number;
          station_name: string | null;
          odometer_km: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          user_id: string;
          liters: number;
          total_cost: number;
          station_name?: string | null;
          odometer_km: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          user_id?: string;
          liters?: number;
          total_cost?: number;
          station_name?: string | null;
          odometer_km?: number;
          created_at?: string;
        };
      };
      maintenances: {
        Row: {
          id: string;
          vehicle_id: string;
          type: "preventive" | "corrective" | "inspection" | "tire_change" | "oil_change" | "other";
          description: string | null;
          cost: number | null;
          odometer_km: number;
          performed_at: string;
          next_due_km: number | null;
          status: "scheduled" | "in_progress" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          type: "preventive" | "corrective" | "inspection" | "tire_change" | "oil_change" | "other";
          description?: string | null;
          cost?: number | null;
          odometer_km: number;
          performed_at?: string;
          next_due_km?: number | null;
          status?: "scheduled" | "in_progress" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          type?: "preventive" | "corrective" | "inspection" | "tire_change" | "oil_change" | "other";
          description?: string | null;
          cost?: number | null;
          odometer_km?: number;
          performed_at?: string;
          next_due_km?: number | null;
          status?: "scheduled" | "in_progress" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicle_expenses: {
        Row: {
          id: string;
          vehicle_id: string;
          category: "ipva" | "insurance" | "licensing" | "financing" | "rent" | "maintenance" | "fuel" | "other";
          description: string;
          amount: number;
          frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
          due_date: string | null;
          status: "pending" | "paid" | "overdue";
          installment_count: number | null;
          installments_paid: number;
          installment_amount: number | null;
          total_amount: number | null;
          due_day: number | null;
          due_month: number | null;
          notes: string | null;
          started_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          category: "ipva" | "insurance" | "licensing" | "financing" | "rent" | "maintenance" | "fuel" | "other";
          description: string;
          amount: number;
          frequency?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
          due_date?: string | null;
          status?: "pending" | "paid" | "overdue";
          installment_count?: number | null;
          installments_paid?: number;
          installment_amount?: number | null;
          total_amount?: number | null;
          due_day?: number | null;
          due_month?: number | null;
          notes?: string | null;
          started_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          category?: "ipva" | "insurance" | "licensing" | "financing" | "rent" | "maintenance" | "fuel" | "other";
          description?: string;
          amount?: number;
          frequency?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
          due_date?: string | null;
          status?: "pending" | "paid" | "overdue";
          installment_count?: number | null;
          installments_paid?: number;
          installment_amount?: number | null;
          total_amount?: number | null;
          due_day?: number | null;
          due_month?: number | null;
          notes?: string | null;
          started_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ride_apps: {
        Row: {
          id: string;
          name: string;
          label: string;
          min_vehicle_year: number | null;
          max_vehicle_age: number | null;
          requirements_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          label: string;
          min_vehicle_year?: number | null;
          max_vehicle_age?: number | null;
          requirements_json?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          label?: string;
          min_vehicle_year?: number | null;
          max_vehicle_age?: number | null;
          requirements_json?: Json | null;
          created_at?: string;
        };
      };
      user_ride_apps: {
        Row: {
          id: string;
          user_id: string;
          ride_app_id: string;
          vehicle_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ride_app_id: string;
          vehicle_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ride_app_id?: string;
          vehicle_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      driver_snapshots: {
        Row: {
          id: string;
          user_id: string;
          snapshot_date: string;
          total_earnings: number;
          total_expenses: number;
          total_km: number;
          net_profit: number;
          efficiency_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          snapshot_date: string;
          total_earnings?: number;
          total_expenses?: number;
          total_km?: number;
          efficiency_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          snapshot_date?: string;
          total_earnings?: number;
          total_expenses?: number;
          total_km?: number;
          efficiency_score?: number | null;
          created_at?: string;
        };
      };
      confirmations: {
        Row: {
          id: string;
          record_type: "trip" | "refueling" | "maintenance" | "expense" | "shift";
          record_id: string;
          user_id: string;
          confirmed_at: string;
          confirmation_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          record_type: "trip" | "refueling" | "maintenance" | "expense" | "shift";
          record_id: string;
          user_id: string;
          confirmed_at?: string;
          confirmation_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          record_type?: "trip" | "refueling" | "maintenance" | "expense" | "shift";
          record_id?: string;
          user_id?: string;
          confirmed_at?: string;
          confirmation_data?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      snapshot_daily_update: {
        Args: { p_user_id: string; p_date: string };
        Returns: void;
      };
    };
    Enums: {
      user_role: "admin" | "manager" | "driver" | "viewer";
      vehicle_status: "active" | "inactive" | "sold" | "retired";
      fuel_type: "gasoline" | "ethanol" | "diesel" | "flex" | "electric" | "hybrid";
      component_status: "good" | "warning" | "critical" | "replaced";
      trip_category: "passenger_pickup" | "passenger_dropoff" | "repositioning" | "refueling" | "personal" | "unpaid_detour";
      trip_status: "in_progress" | "completed" | "cancelled";
      shift_status: "active" | "completed" | "cancelled";
      expense_category: "ipva" | "insurance" | "licensing" | "financing" | "rent" | "maintenance" | "fuel" | "other";
      expense_frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
      expense_status: "pending" | "paid" | "overdue";
      maintenance_type: "preventive" | "corrective" | "inspection" | "tire_change" | "oil_change" | "other";
      maintenance_status: "scheduled" | "in_progress" | "completed" | "cancelled";
      confirmation_type: "trip" | "refueling" | "maintenance" | "expense" | "shift";
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
