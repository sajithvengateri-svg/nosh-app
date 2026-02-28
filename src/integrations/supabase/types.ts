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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      absence_records: {
        Row: {
          absence_type: string
          created_at: string | null
          created_by: string | null
          date: string
          hours_missed: number | null
          id: string
          medical_cert_required: boolean | null
          medical_cert_url: string | null
          org_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          absence_type: string
          created_at?: string | null
          created_by?: string | null
          date: string
          hours_missed?: number | null
          id?: string
          medical_cert_required?: boolean | null
          medical_cert_url?: string | null
          org_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          absence_type?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          hours_missed?: number | null
          id?: string
          medical_cert_required?: boolean | null
          medical_cert_url?: string | null
          org_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      active_timers: {
        Row: {
          alert_type: string
          auto_start_after: string | null
          chain_id: string | null
          chain_position: number | null
          colour: string | null
          completed_at: string | null
          created_at: string
          critical: boolean
          dismissed_at: string | null
          dismissed_by: string | null
          duration_seconds: number
          icon: string | null
          id: string
          is_minimum_time: boolean
          label: string
          notes: string | null
          order_id: string | null
          org_id: string
          paused_at: string | null
          paused_duration_seconds: number
          prep_task_id: string | null
          recipe_id: string | null
          snooze_count: number
          snooze_until: string | null
          source_type: string
          stages: Json | null
          started_at: string
          started_by: string | null
          station: string | null
          status: string
          timer_type: string
        }
        Insert: {
          alert_type?: string
          auto_start_after?: string | null
          chain_id?: string | null
          chain_position?: number | null
          colour?: string | null
          completed_at?: string | null
          created_at?: string
          critical?: boolean
          dismissed_at?: string | null
          dismissed_by?: string | null
          duration_seconds: number
          icon?: string | null
          id?: string
          is_minimum_time?: boolean
          label: string
          notes?: string | null
          order_id?: string | null
          org_id: string
          paused_at?: string | null
          paused_duration_seconds?: number
          prep_task_id?: string | null
          recipe_id?: string | null
          snooze_count?: number
          snooze_until?: string | null
          source_type?: string
          stages?: Json | null
          started_at?: string
          started_by?: string | null
          station?: string | null
          status?: string
          timer_type?: string
        }
        Update: {
          alert_type?: string
          auto_start_after?: string | null
          chain_id?: string | null
          chain_position?: number | null
          colour?: string | null
          completed_at?: string | null
          created_at?: string
          critical?: boolean
          dismissed_at?: string | null
          dismissed_by?: string | null
          duration_seconds?: number
          icon?: string | null
          id?: string
          is_minimum_time?: boolean
          label?: string
          notes?: string | null
          order_id?: string | null
          org_id?: string
          paused_at?: string | null
          paused_duration_seconds?: number
          prep_task_id?: string | null
          recipe_id?: string | null
          snooze_count?: number
          snooze_until?: string | null
          source_type?: string
          stages?: Json | null
          started_at?: string
          started_by?: string | null
          station?: string | null
          status?: string
          timer_type?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          org_id: string | null
          section_id: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          org_id?: string | null
          section_id?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          org_id?: string | null
          section_id?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "kitchen_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permissions: {
        Row: {
          created_at: string
          id: string
          permission_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_type?: string
          user_id?: string
        }
        Relationships: []
      }
      allergens: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      allowance_rates: {
        Row: {
          allowance_type: string
          amount: number
          award_code: string
          created_at: string
          description: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_current: boolean | null
          unit: string
        }
        Insert: {
          allowance_type: string
          amount: number
          award_code?: string
          created_at?: string
          description?: string | null
          effective_from: string
          effective_to?: string | null
          id?: string
          is_current?: boolean | null
          unit?: string
        }
        Update: {
          allowance_type?: string
          amount?: number
          award_code?: string
          created_at?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_current?: boolean | null
          unit?: string
        }
        Relationships: []
      }
      audit_intake_sessions: {
        Row: {
          answers: Json
          audit_score_id: string | null
          completion_pct: number
          created_at: string
          created_by: string
          id: string
          org_id: string | null
          scored_at: string | null
          seats: number | null
          services: string | null
          status: string
          trading_days: number | null
          updated_at: string
          venue_name: string
          venue_type: string
          years_operating: string | null
        }
        Insert: {
          answers?: Json
          audit_score_id?: string | null
          completion_pct?: number
          created_at?: string
          created_by: string
          id?: string
          org_id?: string | null
          scored_at?: string | null
          seats?: number | null
          services?: string | null
          status?: string
          trading_days?: number | null
          updated_at?: string
          venue_name?: string
          venue_type?: string
          years_operating?: string | null
        }
        Update: {
          answers?: Json
          audit_score_id?: string | null
          completion_pct?: number
          created_at?: string
          created_by?: string
          id?: string
          org_id?: string | null
          scored_at?: string | null
          seats?: number | null
          services?: string | null
          status?: string
          trading_days?: number | null
          updated_at?: string
          venue_name?: string
          venue_type?: string
          years_operating?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_intake_sessions_audit_score_id_fkey"
            columns: ["audit_score_id"]
            isOneToOne: false
            referencedRelation: "audit_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_intake_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_source: string | null
          findings: Json | null
          generated_at: string | null
          id: string
          org_id: string
          overall_risk_rating: string | null
          overall_score: number | null
          period_end: string | null
          period_start: string | null
          recovery_roadmap: Json | null
          report_pdf_url: string | null
          status: string
          total_annual_savings_identified: number | null
          total_liabilities_identified: number | null
          true_pnl: Json | null
          type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_source?: string | null
          findings?: Json | null
          generated_at?: string | null
          id?: string
          org_id: string
          overall_risk_rating?: string | null
          overall_score?: number | null
          period_end?: string | null
          period_start?: string | null
          recovery_roadmap?: Json | null
          report_pdf_url?: string | null
          status?: string
          total_annual_savings_identified?: number | null
          total_liabilities_identified?: number | null
          true_pnl?: Json | null
          type?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_source?: string | null
          findings?: Json | null
          generated_at?: string | null
          id?: string
          org_id?: string
          overall_risk_rating?: string | null
          overall_score?: number | null
          period_end?: string | null
          period_start?: string | null
          recovery_roadmap?: Json | null
          report_pdf_url?: string | null
          status?: string
          total_annual_savings_identified?: number | null
          total_liabilities_identified?: number | null
          true_pnl?: Json | null
          type?: string
        }
        Relationships: []
      }
      audit_scores: {
        Row: {
          bev_score: number | null
          calculated_at: string | null
          compliance_score: number | null
          food_score: number | null
          id: string
          labour_score: number | null
          marketing_score: number | null
          ops_supplies_score: number | null
          org_id: string
          overall_score: number | null
          overhead_score: number | null
          period_date: string
          period_type: string
          recommendations: Json | null
          score_breakdown: Json | null
          service_score: number | null
          trend_direction: string | null
        }
        Insert: {
          bev_score?: number | null
          calculated_at?: string | null
          compliance_score?: number | null
          food_score?: number | null
          id?: string
          labour_score?: number | null
          marketing_score?: number | null
          ops_supplies_score?: number | null
          org_id: string
          overall_score?: number | null
          overhead_score?: number | null
          period_date: string
          period_type?: string
          recommendations?: Json | null
          score_breakdown?: Json | null
          service_score?: number | null
          trend_direction?: string | null
        }
        Update: {
          bev_score?: number | null
          calculated_at?: string | null
          compliance_score?: number | null
          food_score?: number | null
          id?: string
          labour_score?: number | null
          marketing_score?: number | null
          ops_supplies_score?: number | null
          org_id?: string
          overall_score?: number | null
          overhead_score?: number | null
          period_date?: string
          period_type?: string
          recommendations?: Json | null
          score_breakdown?: Json | null
          service_score?: number | null
          trend_direction?: string | null
        }
        Relationships: []
      }
      audit_self_assessments: {
        Row: {
          assessed_by: string | null
          assessed_by_name: string | null
          assessment_date: string
          checklist_items: Json
          created_at: string
          id: string
          notes: string | null
          org_id: string
          predicted_star_rating: number | null
          total_critical: number | null
          total_major: number | null
          total_minor: number | null
        }
        Insert: {
          assessed_by?: string | null
          assessed_by_name?: string | null
          assessment_date?: string
          checklist_items?: Json
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          predicted_star_rating?: number | null
          total_critical?: number | null
          total_major?: number | null
          total_minor?: number | null
        }
        Update: {
          assessed_by?: string | null
          assessed_by_name?: string | null
          assessment_date?: string
          checklist_items?: Json
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          predicted_star_rating?: number | null
          total_critical?: number | null
          total_major?: number | null
          total_minor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_self_assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_sub_scores: {
        Row: {
          audit_score_id: string
          created_at: string
          data_source: string | null
          id: string
          module: string
          recommendation: Json | null
          score: number
          status: string
          sub_score_name: string
          target: string | null
          value: string | null
          weight: number
        }
        Insert: {
          audit_score_id: string
          created_at?: string
          data_source?: string | null
          id?: string
          module: string
          recommendation?: Json | null
          score?: number
          status?: string
          sub_score_name: string
          target?: string | null
          value?: string | null
          weight?: number
        }
        Update: {
          audit_score_id?: string
          created_at?: string
          data_source?: string | null
          id?: string
          module?: string
          recommendation?: Json | null
          score?: number
          status?: string
          sub_score_name?: string
          target?: string | null
          value?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "audit_sub_scores_audit_score_id_fkey"
            columns: ["audit_score_id"]
            isOneToOne: false
            referencedRelation: "audit_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_uploaded_documents: {
        Row: {
          confidence_score: number | null
          created_at: string
          created_by: string
          document_type: string
          error_message: string | null
          extracted_data: Json | null
          extraction_status: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          created_by: string
          document_type?: string
          error_message?: string | null
          extracted_data?: Json | null
          extraction_status?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          session_id: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          created_by?: string
          document_type?: string
          error_message?: string | null
          extracted_data?: Json | null
          extraction_status?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_uploaded_documents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "audit_intake_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      award_rates: {
        Row: {
          annual_rate: number | null
          award_code: string
          base_hourly_rate: number
          casual_hourly_rate: number | null
          casual_loading_pct: number | null
          classification: string
          created_at: string
          effective_from: string
          effective_to: string | null
          employment_type: string
          id: string
          is_current: boolean | null
          weekly_rate: number | null
        }
        Insert: {
          annual_rate?: number | null
          award_code?: string
          base_hourly_rate: number
          casual_hourly_rate?: number | null
          casual_loading_pct?: number | null
          classification: string
          created_at?: string
          effective_from: string
          effective_to?: string | null
          employment_type: string
          id?: string
          is_current?: boolean | null
          weekly_rate?: number | null
        }
        Update: {
          annual_rate?: number | null
          award_code?: string
          base_hourly_rate?: number
          casual_hourly_rate?: number | null
          casual_loading_pct?: number | null
          classification?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          employment_type?: string
          id?: string
          is_current?: boolean | null
          weekly_rate?: number | null
        }
        Relationships: []
      }
      batch_resting_timers: {
        Row: {
          actual_end_at: string | null
          batch_code: string | null
          check_count: number | null
          check_intervals_hours: number | null
          completed_by: string | null
          created_at: string | null
          expected_end_at: string | null
          id: string
          last_check_at: string | null
          notes: string | null
          org_id: string
          recipe_id: string | null
          recipe_name: string | null
          resting_type: string | null
          started_at: string | null
          started_by: string | null
          status: string
          target_duration_hours: number | null
        }
        Insert: {
          actual_end_at?: string | null
          batch_code?: string | null
          check_count?: number | null
          check_intervals_hours?: number | null
          completed_by?: string | null
          created_at?: string | null
          expected_end_at?: string | null
          id?: string
          last_check_at?: string | null
          notes?: string | null
          org_id: string
          recipe_id?: string | null
          recipe_name?: string | null
          resting_type?: string | null
          started_at?: string | null
          started_by?: string | null
          status?: string
          target_duration_hours?: number | null
        }
        Update: {
          actual_end_at?: string | null
          batch_code?: string | null
          check_count?: number | null
          check_intervals_hours?: number | null
          completed_by?: string | null
          created_at?: string | null
          expected_end_at?: string | null
          id?: string
          last_check_at?: string | null
          notes?: string | null
          org_id?: string
          recipe_id?: string | null
          recipe_name?: string | null
          resting_type?: string | null
          started_at?: string | null
          started_by?: string | null
          status?: string
          target_duration_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_resting_timers_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      bcc_cleaning_completions: {
        Row: {
          completed_at: string
          completed_by: string | null
          id: string
          notes: string | null
          org_id: string
          photo_url: string | null
          sanitiser_concentration_ppm: number | null
          schedule_id: string | null
          signed_off_at: string | null
          signed_off_by: string | null
        }
        Insert: {
          completed_at?: string
          completed_by?: string | null
          id?: string
          notes?: string | null
          org_id: string
          photo_url?: string | null
          sanitiser_concentration_ppm?: number | null
          schedule_id?: string | null
          signed_off_at?: string | null
          signed_off_by?: string | null
        }
        Update: {
          completed_at?: string
          completed_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          photo_url?: string | null
          sanitiser_concentration_ppm?: number | null
          schedule_id?: string | null
          signed_off_at?: string | null
          signed_off_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bcc_cleaning_completions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bcc_cleaning_completions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "bcc_cleaning_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      bcc_cleaning_schedules: {
        Row: {
          area: string
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          method: string | null
          org_id: string
          responsible_role: string | null
          sanitiser_required: boolean | null
          task_name: string
        }
        Insert: {
          area: string
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          method?: string | null
          org_id: string
          responsible_role?: string | null
          sanitiser_required?: boolean | null
          task_name: string
        }
        Update: {
          area?: string
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          method?: string | null
          org_id?: string
          responsible_role?: string | null
          sanitiser_required?: boolean | null
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bcc_cleaning_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bcc_equipment_calibration_logs: {
        Row: {
          created_at: string
          document_url: string | null
          equipment_name: string
          equipment_type: string | null
          id: string
          log_type: string
          method: string | null
          next_due_date: string | null
          notes: string | null
          org_id: string
          passed: boolean | null
          performed_at: string
          performed_by: string | null
          result: string | null
          serial_number: string | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          equipment_name: string
          equipment_type?: string | null
          id?: string
          log_type?: string
          method?: string | null
          next_due_date?: string | null
          notes?: string | null
          org_id: string
          passed?: boolean | null
          performed_at?: string
          performed_by?: string | null
          result?: string | null
          serial_number?: string | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          equipment_name?: string
          equipment_type?: string | null
          id?: string
          log_type?: string
          method?: string | null
          next_due_date?: string | null
          notes?: string | null
          org_id?: string
          passed?: boolean | null
          performed_at?: string
          performed_by?: string | null
          result?: string | null
          serial_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bcc_equipment_calibration_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bcc_pest_control_logs: {
        Row: {
          areas_inspected: string[] | null
          corrective_action: string | null
          created_at: string
          date_of_service: string
          findings: string | null
          id: string
          log_type: string
          next_service_date: string | null
          org_id: string
          pest_types: string[] | null
          pests_found: boolean | null
          report_document_url: string | null
          service_provider: string | null
          technician_name: string | null
          treatment_applied: string | null
        }
        Insert: {
          areas_inspected?: string[] | null
          corrective_action?: string | null
          created_at?: string
          date_of_service?: string
          findings?: string | null
          id?: string
          log_type?: string
          next_service_date?: string | null
          org_id: string
          pest_types?: string[] | null
          pests_found?: boolean | null
          report_document_url?: string | null
          service_provider?: string | null
          technician_name?: string | null
          treatment_applied?: string | null
        }
        Update: {
          areas_inspected?: string[] | null
          corrective_action?: string | null
          created_at?: string
          date_of_service?: string
          findings?: string | null
          id?: string
          log_type?: string
          next_service_date?: string | null
          org_id?: string
          pest_types?: string[] | null
          pests_found?: boolean | null
          report_document_url?: string | null
          service_provider?: string | null
          technician_name?: string | null
          treatment_applied?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bcc_pest_control_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bcc_section_toggles: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean | null
          org_id: string
          section_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          org_id: string
          section_key: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          org_id?: string
          section_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "bcc_section_toggles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bcc_supplier_register: {
        Row: {
          abn: string | null
          address: string | null
          contact_name: string | null
          created_at: string
          delivery_schedule: string | null
          email: string | null
          id: string
          is_approved: boolean | null
          notes: string | null
          org_id: string
          phone: string | null
          products_supplied: string[] | null
          supplier_name: string
        }
        Insert: {
          abn?: string | null
          address?: string | null
          contact_name?: string | null
          created_at?: string
          delivery_schedule?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean | null
          notes?: string | null
          org_id: string
          phone?: string | null
          products_supplied?: string[] | null
          supplier_name: string
        }
        Update: {
          abn?: string | null
          address?: string | null
          contact_name?: string | null
          created_at?: string
          delivery_schedule?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean | null
          notes?: string | null
          org_id?: string
          phone?: string | null
          products_supplied?: string[] | null
          supplier_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bcc_supplier_register_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_bar_prep: {
        Row: {
          assigned_to: string | null
          created_at: string
          date: string
          id: string
          items: Json
          name: string
          notes: string | null
          org_id: string
          section_id: string | null
          shift: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          date?: string
          id?: string
          items?: Json
          name: string
          notes?: string | null
          org_id: string
          section_id?: string | null
          shift?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          date?: string
          id?: string
          items?: Json
          name?: string
          notes?: string | null
          org_id?: string
          section_id?: string | null
          shift?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      bev_beer_details: {
        Row: {
          beer_type: string | null
          coupler_type: string | null
          format: string
          gas_type: string | null
          glycol_temp_c: number | null
          id: string
          keg_size_litres: number | null
          line_number: number | null
          product_id: string
          tap_number: number | null
        }
        Insert: {
          beer_type?: string | null
          coupler_type?: string | null
          format?: string
          gas_type?: string | null
          glycol_temp_c?: number | null
          id?: string
          keg_size_litres?: number | null
          line_number?: number | null
          product_id: string
          tap_number?: number | null
        }
        Update: {
          beer_type?: string | null
          coupler_type?: string | null
          format?: string
          gas_type?: string | null
          glycol_temp_c?: number | null
          id?: string
          keg_size_litres?: number | null
          line_number?: number | null
          product_id?: string
          tap_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bev_beer_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_cellar: {
        Row: {
          batch_ref: string | null
          created_at: string
          id: string
          location: string | null
          org_id: string
          product_id: string
          quantity: number
          received_date: string | null
          supplier: string | null
          updated_at: string
        }
        Insert: {
          batch_ref?: string | null
          created_at?: string
          id?: string
          location?: string | null
          org_id: string
          product_id: string
          quantity?: number
          received_date?: string | null
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          batch_ref?: string | null
          created_at?: string
          id?: string
          location?: string | null
          org_id?: string
          product_id?: string
          quantity?: number
          received_date?: string | null
          supplier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bev_cellar_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_cocktail_ingredients: {
        Row: {
          cost: number
          id: string
          org_id: string
          product_id: string | null
          quantity_ml: number
          spec_id: string
          unit: string
        }
        Insert: {
          cost?: number
          id?: string
          org_id: string
          product_id?: string | null
          quantity_ml?: number
          spec_id: string
          unit?: string
        }
        Update: {
          cost?: number
          id?: string
          org_id?: string
          product_id?: string | null
          quantity_ml?: number
          spec_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "bev_cocktail_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bev_cocktail_ingredients_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "bev_cocktail_specs"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_cocktail_specs: {
        Row: {
          batch_yield_ml: number | null
          category: string
          cost_price: number
          created_at: string
          difficulty_level: number
          flash_card_notes: string | null
          garnish: string | null
          glassware: string | null
          ice_type: string
          id: string
          image_url: string | null
          is_prebatch: boolean
          method_steps: Json
          name: string
          org_id: string
          quiz_answers: Json | null
          sell_price: number
          tasting_notes: string | null
          updated_at: string
        }
        Insert: {
          batch_yield_ml?: number | null
          category?: string
          cost_price?: number
          created_at?: string
          difficulty_level?: number
          flash_card_notes?: string | null
          garnish?: string | null
          glassware?: string | null
          ice_type?: string
          id?: string
          image_url?: string | null
          is_prebatch?: boolean
          method_steps?: Json
          name: string
          org_id: string
          quiz_answers?: Json | null
          sell_price?: number
          tasting_notes?: string | null
          updated_at?: string
        }
        Update: {
          batch_yield_ml?: number | null
          category?: string
          cost_price?: number
          created_at?: string
          difficulty_level?: number
          flash_card_notes?: string | null
          garnish?: string | null
          glassware?: string | null
          ice_type?: string
          id?: string
          image_url?: string | null
          is_prebatch?: boolean
          method_steps?: Json
          name?: string
          org_id?: string
          quiz_answers?: Json | null
          sell_price?: number
          tasting_notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bev_coffee_details: {
        Row: {
          best_before: string | null
          brew_ratio: string | null
          dose_g: number | null
          grind_setting: string | null
          id: string
          method: string | null
          origin: string | null
          product_id: string
          roast_date: string | null
          roaster: string | null
          steep_temp_c: number | null
          steep_time_s: number | null
          tds_reading: number | null
          tea_type: string | null
          yield_ml: number | null
        }
        Insert: {
          best_before?: string | null
          brew_ratio?: string | null
          dose_g?: number | null
          grind_setting?: string | null
          id?: string
          method?: string | null
          origin?: string | null
          product_id: string
          roast_date?: string | null
          roaster?: string | null
          steep_temp_c?: number | null
          steep_time_s?: number | null
          tds_reading?: number | null
          tea_type?: string | null
          yield_ml?: number | null
        }
        Update: {
          best_before?: string | null
          brew_ratio?: string | null
          dose_g?: number | null
          grind_setting?: string | null
          id?: string
          method?: string | null
          origin?: string | null
          product_id?: string
          roast_date?: string | null
          roaster?: string | null
          steep_temp_c?: number | null
          steep_time_s?: number | null
          tds_reading?: number | null
          tea_type?: string | null
          yield_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bev_coffee_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_coffee_dialing: {
        Row: {
          created_at: string
          dialed_by: string | null
          dose_g: number
          grinder_setting: string | null
          id: string
          notes: string | null
          org_id: string
          product_id: string
          tds: number | null
          time_s: number
          yield_ml: number
        }
        Insert: {
          created_at?: string
          dialed_by?: string | null
          dose_g: number
          grinder_setting?: string | null
          id?: string
          notes?: string | null
          org_id: string
          product_id: string
          tds?: number | null
          time_s: number
          yield_ml: number
        }
        Update: {
          created_at?: string
          dialed_by?: string | null
          dose_g?: number
          grinder_setting?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          product_id?: string
          tds?: number | null
          time_s?: number
          yield_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "bev_coffee_dialing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_coravin_capsules: {
        Row: {
          capsule_type: string
          cost_per_capsule: number
          created_at: string
          id: string
          org_id: string
          pours_per_capsule: number
          quantity_in_stock: number
        }
        Insert: {
          capsule_type?: string
          cost_per_capsule?: number
          created_at?: string
          id?: string
          org_id: string
          pours_per_capsule?: number
          quantity_in_stock?: number
        }
        Update: {
          capsule_type?: string
          cost_per_capsule?: number
          created_at?: string
          id?: string
          org_id?: string
          pours_per_capsule?: number
          quantity_in_stock?: number
        }
        Relationships: []
      }
      bev_demand_insights: {
        Row: {
          avg_price_paid: number | null
          created_at: string
          id: string
          order_count: number
          postcode: string
          product_category: string
          product_name: string | null
          total_quantity: number
          week_ending: string
        }
        Insert: {
          avg_price_paid?: number | null
          created_at?: string
          id?: string
          order_count?: number
          postcode: string
          product_category: string
          product_name?: string | null
          total_quantity?: number
          week_ending: string
        }
        Update: {
          avg_price_paid?: number | null
          created_at?: string
          id?: string
          order_count?: number
          postcode?: string
          product_category?: string
          product_name?: string | null
          total_quantity?: number
          week_ending?: string
        }
        Relationships: []
      }
      bev_flash_cards: {
        Row: {
          category: string
          content: string
          created_at: string
          difficulty_level: number
          id: string
          image_url: string | null
          org_id: string
          quiz_answers: Json | null
          quiz_question: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          difficulty_level?: number
          id?: string
          image_url?: string | null
          org_id: string
          quiz_answers?: Json | null
          quiz_question?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          difficulty_level?: number
          id?: string
          image_url?: string | null
          org_id?: string
          quiz_answers?: Json | null
          quiz_question?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bev_infusions: {
        Row: {
          actual_completion: string | null
          created_at: string
          created_by: string | null
          id: string
          infusion_ingredient: string | null
          name: string
          org_id: string
          recipe_id: string | null
          spirit_base: string | null
          started_at: string
          status: string
          target_completion: string | null
          tasting_notes: string | null
          timer_id: string | null
          volume_ml: number | null
          yield_ml: number | null
        }
        Insert: {
          actual_completion?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          infusion_ingredient?: string | null
          name: string
          org_id: string
          recipe_id?: string | null
          spirit_base?: string | null
          started_at?: string
          status?: string
          target_completion?: string | null
          tasting_notes?: string | null
          timer_id?: string | null
          volume_ml?: number | null
          yield_ml?: number | null
        }
        Update: {
          actual_completion?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          infusion_ingredient?: string | null
          name?: string
          org_id?: string
          recipe_id?: string | null
          spirit_base?: string | null
          started_at?: string
          status?: string
          target_completion?: string | null
          tasting_notes?: string | null
          timer_id?: string | null
          volume_ml?: number | null
          yield_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bev_infusions_timer_id_fkey"
            columns: ["timer_id"]
            isOneToOne: false
            referencedRelation: "active_timers"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_keg_tracking: {
        Row: {
          actual_pours: number
          created_at: string
          id: string
          kicked_at: string | null
          org_id: string
          product_id: string
          tap_number: number | null
          tapped_at: string
          theoretical_pours: number
          yield_pct: number | null
        }
        Insert: {
          actual_pours?: number
          created_at?: string
          id?: string
          kicked_at?: string | null
          org_id: string
          product_id: string
          tap_number?: number | null
          tapped_at?: string
          theoretical_pours?: number
          yield_pct?: number | null
        }
        Update: {
          actual_pours?: number
          created_at?: string
          id?: string
          kicked_at?: string | null
          org_id?: string
          product_id?: string
          tap_number?: number | null
          tapped_at?: string
          theoretical_pours?: number
          yield_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bev_keg_tracking_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_line_cleaning_log: {
        Row: {
          chemical_used: string | null
          cleaned_at: string
          cleaned_by: string | null
          id: string
          line_number: number
          next_due: string | null
          org_id: string
        }
        Insert: {
          chemical_used?: string | null
          cleaned_at?: string
          cleaned_by?: string | null
          id?: string
          line_number: number
          next_due?: string | null
          org_id: string
        }
        Update: {
          chemical_used?: string | null
          cleaned_at?: string
          cleaned_by?: string | null
          id?: string
          line_number?: number
          next_due?: string | null
          org_id?: string
        }
        Relationships: []
      }
      bev_open_bottles: {
        Row: {
          coravin_gas_pours_remaining: number | null
          created_at: string
          expires_at: string | null
          id: string
          is_coravin: boolean
          opened_at: string
          opened_by: string | null
          org_id: string
          product_id: string
          remaining_ml: number
        }
        Insert: {
          coravin_gas_pours_remaining?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_coravin?: boolean
          opened_at?: string
          opened_by?: string | null
          org_id: string
          product_id: string
          remaining_ml?: number
        }
        Update: {
          coravin_gas_pours_remaining?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_coravin?: boolean
          opened_at?: string
          opened_by?: string | null
          org_id?: string
          product_id?: string
          remaining_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "bev_open_bottles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_pour_events: {
        Row: {
          cost_per_pour: number
          created_at: string
          gp_per_pour: number
          id: string
          is_coravin_pour: boolean
          org_id: string
          pour_type: string
          poured_by: string | null
          product_id: string
          quantity_ml: number
          sell_price: number
          shift_date: string
        }
        Insert: {
          cost_per_pour?: number
          created_at?: string
          gp_per_pour?: number
          id?: string
          is_coravin_pour?: boolean
          org_id: string
          pour_type?: string
          poured_by?: string | null
          product_id: string
          quantity_ml: number
          sell_price?: number
          shift_date?: string
        }
        Update: {
          cost_per_pour?: number
          created_at?: string
          gp_per_pour?: number
          id?: string
          is_coravin_pour?: boolean
          org_id?: string
          pour_type?: string
          poured_by?: string | null
          product_id?: string
          quantity_ml?: number
          sell_price?: number
          shift_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bev_pour_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_prebatch_logs: {
        Row: {
          batch_number: string | null
          cost: number
          created_at: string
          expires_at: string | null
          id: string
          org_id: string
          prepared_by: string | null
          spec_id: string
          volume_ml: number
        }
        Insert: {
          batch_number?: string | null
          cost?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          org_id: string
          prepared_by?: string | null
          spec_id: string
          volume_ml: number
        }
        Update: {
          batch_number?: string | null
          cost?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          org_id?: string
          prepared_by?: string | null
          spec_id?: string
          volume_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "bev_prebatch_logs_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "bev_cocktail_specs"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_products: {
        Row: {
          abv: number | null
          bottle_size_ml: number | null
          created_at: string
          format: string | null
          id: string
          is_coravin_eligible: boolean
          main_category: string
          name: string
          org_id: string
          par_level: number | null
          pour_size_ml: number | null
          pours_per_unit: number | null
          purchase_price: number
          sell_price: number
          speed_rail_position: number | null
          sub_category: string | null
          updated_at: string
        }
        Insert: {
          abv?: number | null
          bottle_size_ml?: number | null
          created_at?: string
          format?: string | null
          id?: string
          is_coravin_eligible?: boolean
          main_category?: string
          name: string
          org_id: string
          par_level?: number | null
          pour_size_ml?: number | null
          pours_per_unit?: number | null
          purchase_price?: number
          sell_price?: number
          speed_rail_position?: number | null
          sub_category?: string | null
          updated_at?: string
        }
        Update: {
          abv?: number | null
          bottle_size_ml?: number | null
          created_at?: string
          format?: string | null
          id?: string
          is_coravin_eligible?: boolean
          main_category?: string
          name?: string
          org_id?: string
          par_level?: number | null
          pour_size_ml?: number | null
          pours_per_unit?: number | null
          purchase_price?: number
          sell_price?: number
          speed_rail_position?: number | null
          sub_category?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bev_run_sheet_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          org_id: string
          priority: string
          run_sheet_id: string
          sort_order: number
          status: string
          task: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          priority?: string
          run_sheet_id: string
          sort_order?: number
          status?: string
          task: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          priority?: string
          run_sheet_id?: string
          sort_order?: number
          status?: string
          task?: string
        }
        Relationships: [
          {
            foreignKeyName: "bev_run_sheet_tasks_run_sheet_id_fkey"
            columns: ["run_sheet_id"]
            isOneToOne: false
            referencedRelation: "bev_run_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_run_sheets: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          is_template: boolean
          notes: string | null
          org_id: string
          posted_to_wall: boolean
          shift: string
          status: string
          template_name: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          is_template?: boolean
          notes?: string | null
          org_id: string
          posted_to_wall?: boolean
          shift?: string
          status?: string
          template_name?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          is_template?: boolean
          notes?: string | null
          org_id?: string
          posted_to_wall?: boolean
          shift?: string
          status?: string
          template_name?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bev_stocktake_items: {
        Row: {
          counted_qty: number
          expected_qty: number
          id: string
          location: string | null
          org_id: string
          product_id: string
          stocktake_id: string
          variance: number
          variance_cost: number
        }
        Insert: {
          counted_qty?: number
          expected_qty?: number
          id?: string
          location?: string | null
          org_id: string
          product_id: string
          stocktake_id: string
          variance?: number
          variance_cost?: number
        }
        Update: {
          counted_qty?: number
          expected_qty?: number
          id?: string
          location?: string | null
          org_id?: string
          product_id?: string
          stocktake_id?: string
          variance?: number
          variance_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "bev_stocktake_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bev_stocktake_items_stocktake_id_fkey"
            columns: ["stocktake_id"]
            isOneToOne: false
            referencedRelation: "bev_stocktakes"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_stocktakes: {
        Row: {
          completed_by: string | null
          count_type: string
          created_at: string
          date: string
          id: string
          location: string | null
          notes: string | null
          org_id: string
          status: string
        }
        Insert: {
          completed_by?: string | null
          count_type?: string
          created_at?: string
          date?: string
          id?: string
          location?: string | null
          notes?: string | null
          org_id: string
          status?: string
        }
        Update: {
          completed_by?: string | null
          count_type?: string
          created_at?: string
          date?: string
          id?: string
          location?: string | null
          notes?: string | null
          org_id?: string
          status?: string
        }
        Relationships: []
      }
      bev_vendor_orders: {
        Row: {
          created_at: string
          id: string
          items: Json
          notes: string | null
          org_id: string
          status: string
          total: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          org_id: string
          status?: string
          total?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          org_id?: string
          status?: string
          total?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      bev_vendor_pricing: {
        Row: {
          category: string
          created_at: string
          format: string | null
          id: string
          is_available: boolean
          lead_time_days: number | null
          min_order_qty: number
          price_per_unit: number
          producer: string | null
          product_name: string
          region: string | null
          sub_category: string | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          vendor_id: string
          vintage: number | null
        }
        Insert: {
          category: string
          created_at?: string
          format?: string | null
          id?: string
          is_available?: boolean
          lead_time_days?: number | null
          min_order_qty?: number
          price_per_unit?: number
          producer?: string | null
          product_name: string
          region?: string | null
          sub_category?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          vendor_id: string
          vintage?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          format?: string | null
          id?: string
          is_available?: boolean
          lead_time_days?: number | null
          min_order_qty?: number
          price_per_unit?: number
          producer?: string | null
          product_name?: string
          region?: string | null
          sub_category?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          vendor_id?: string
          vintage?: number | null
        }
        Relationships: []
      }
      bev_waste_events: {
        Row: {
          cost: number
          created_at: string
          id: string
          org_id: string
          product_id: string
          quantity_ml: number
          reason: string
          reported_by: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          org_id: string
          product_id: string
          quantity_ml: number
          reason?: string
          reported_by?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          org_id?: string
          product_id?: string
          quantity_ml?: number
          reason?: string
          reported_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bev_waste_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bev_wine_details: {
        Row: {
          appellation: string | null
          bin_number: string | null
          cellar_location: string | null
          drink_from: number | null
          drink_to: number | null
          id: string
          optimal_serve_temp_c: number | null
          producer: string | null
          product_id: string
          region: string | null
          varietal: string | null
          vintage: number | null
          wine_type: string
        }
        Insert: {
          appellation?: string | null
          bin_number?: string | null
          cellar_location?: string | null
          drink_from?: number | null
          drink_to?: number | null
          id?: string
          optimal_serve_temp_c?: number | null
          producer?: string | null
          product_id: string
          region?: string | null
          varietal?: string | null
          vintage?: number | null
          wine_type?: string
        }
        Update: {
          appellation?: string | null
          bin_number?: string | null
          cellar_location?: string | null
          drink_from?: number | null
          drink_to?: number | null
          id?: string
          optimal_serve_temp_c?: number | null
          producer?: string | null
          product_id?: string
          region?: string | null
          varietal?: string | null
          vintage?: number | null
          wine_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bev_wine_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          location: string | null
          org_id: string | null
          recurring: string | null
          status: string | null
          time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          location?: string | null
          org_id?: string | null
          recurring?: string | null
          status?: string | null
          time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          location?: string | null
          org_id?: string | null
          recurring?: string | null
          status?: string | null
          time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cheatsheets: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          org_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          org_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          org_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cheatsheets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_idea_badges: {
        Row: {
          badge_name: string
          created_at: string
          id: string
          idea_id: string
          org_id: string
          user_id: string
        }
        Insert: {
          badge_name: string
          created_at?: string
          id?: string
          idea_id: string
          org_id: string
          user_id: string
        }
        Update: {
          badge_name?: string
          created_at?: string
          id?: string
          idea_id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chef_idea_badges_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "chef_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chef_idea_badges_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_ideas: {
        Row: {
          admin_note: string | null
          badge_awarded: boolean | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          org_id: string
          status: string | null
          submitted_by: string
          submitted_by_name: string | null
          title: string
        }
        Insert: {
          admin_note?: string | null
          badge_awarded?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          org_id: string
          status?: string | null
          submitted_by: string
          submitted_by_name?: string | null
          title: string
        }
        Update: {
          admin_note?: string | null
          badge_awarded?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          org_id?: string
          status?: string | null
          submitted_by?: string
          submitted_by_name?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chef_ideas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_wishlists: {
        Row: {
          ai_recommendations: Json | null
          chef_notes: string | null
          created_at: string
          id: string
          items: Json
          org_id: string
          reviewed_at: string | null
          status: string
          submitted_by: string
          submitted_by_name: string
          target_date: string
          venue_id: string | null
        }
        Insert: {
          ai_recommendations?: Json | null
          chef_notes?: string | null
          created_at?: string
          id?: string
          items?: Json
          org_id: string
          reviewed_at?: string | null
          status?: string
          submitted_by: string
          submitted_by_name: string
          target_date?: string
          venue_id?: string | null
        }
        Update: {
          ai_recommendations?: Json | null
          chef_notes?: string | null
          created_at?: string
          id?: string
          items?: Json
          org_id?: string
          reviewed_at?: string | null
          status?: string
          submitted_by?: string
          submitted_by_name?: string
          target_date?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chef_wishlists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chef_wishlists_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "org_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_areas: {
        Row: {
          cleaning_frequency: string | null
          created_at: string
          id: string
          instructions: string | null
          location: string | null
          name: string
          org_id: string | null
          reference_image_url: string | null
          updated_at: string
        }
        Insert: {
          cleaning_frequency?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          location?: string | null
          name: string
          org_id?: string | null
          reference_image_url?: string | null
          updated_at?: string
        }
        Update: {
          cleaning_frequency?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          location?: string | null
          name?: string
          org_id?: string | null
          reference_image_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_areas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_inventory: {
        Row: {
          category: string
          cost_per_unit: number | null
          created_at: string
          id: string
          last_ordered: string | null
          location: string | null
          name: string
          notes: string | null
          org_id: string
          par_level: number | null
          quantity: number
          sds_url: string | null
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          last_ordered?: string | null
          location?: string | null
          name: string
          notes?: string | null
          org_id: string
          par_level?: number | null
          quantity?: number
          sds_url?: string | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          last_ordered?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          par_level?: number | null
          quantity?: number
          sds_url?: string | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      clock_devices: {
        Row: {
          allow_remote: boolean | null
          created_at: string | null
          device_identifier: string
          device_name: string
          id: string
          is_active: boolean | null
          location_description: string | null
          org_id: string
          require_photo: boolean | null
          updated_at: string | null
        }
        Insert: {
          allow_remote?: boolean | null
          created_at?: string | null
          device_identifier: string
          device_name: string
          id?: string
          is_active?: boolean | null
          location_description?: string | null
          org_id: string
          require_photo?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allow_remote?: boolean | null
          created_at?: string | null
          device_identifier?: string
          device_name?: string
          id?: string
          is_active?: boolean | null
          location_description?: string | null
          org_id?: string
          require_photo?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clock_events: {
        Row: {
          break_type: string | null
          compliance_status: string | null
          created_at: string
          device_id: string | null
          device_type: string | null
          early_minutes: number | null
          event_time: string
          event_type: string
          geofence_result: string | null
          gps_accuracy: number | null
          id: string
          late_minutes: number | null
          latitude: number | null
          location_type: string | null
          longitude: number | null
          notes: string | null
          org_id: string
          override_by: string | null
          override_reason: string | null
          photo_url: string | null
          remote_reason: string | null
          role_change_from: string | null
          role_change_to: string | null
          rostered: boolean | null
          rostered_end: string | null
          rostered_start: string | null
          shift_date: string
          user_id: string
        }
        Insert: {
          break_type?: string | null
          compliance_status?: string | null
          created_at?: string
          device_id?: string | null
          device_type?: string | null
          early_minutes?: number | null
          event_time?: string
          event_type: string
          geofence_result?: string | null
          gps_accuracy?: number | null
          id?: string
          late_minutes?: number | null
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          notes?: string | null
          org_id: string
          override_by?: string | null
          override_reason?: string | null
          photo_url?: string | null
          remote_reason?: string | null
          role_change_from?: string | null
          role_change_to?: string | null
          rostered?: boolean | null
          rostered_end?: string | null
          rostered_start?: string | null
          shift_date?: string
          user_id: string
        }
        Update: {
          break_type?: string | null
          compliance_status?: string | null
          created_at?: string
          device_id?: string | null
          device_type?: string | null
          early_minutes?: number | null
          event_time?: string
          event_type?: string
          geofence_result?: string | null
          gps_accuracy?: number | null
          id?: string
          late_minutes?: number | null
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          notes?: string | null
          org_id?: string
          override_by?: string | null
          override_reason?: string | null
          photo_url?: string | null
          remote_reason?: string | null
          role_change_from?: string | null
          role_change_to?: string | null
          rostered?: boolean | null
          rostered_end?: string | null
          rostered_start?: string | null
          shift_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clock_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clock_induction_modules: {
        Row: {
          content_text: string | null
          content_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          is_active: boolean | null
          module_type: string
          org_id: string
          quiz_pass_pct: number | null
          quiz_questions: Json | null
          required_for_roles: Json | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_text?: string | null
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          module_type: string
          org_id: string
          quiz_pass_pct?: number | null
          quiz_questions?: Json | null
          required_for_roles?: Json | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_text?: string | null
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          module_type?: string
          org_id?: string
          quiz_pass_pct?: number | null
          quiz_questions?: Json | null
          required_for_roles?: Json | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clock_induction_progress: {
        Row: {
          acknowledged_at: string | null
          assessed_by: string | null
          assessment_notes: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          module_id: string
          org_id: string
          quiz_attempts: number | null
          quiz_score: number | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          assessed_by?: string | null
          assessment_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id: string
          org_id: string
          quiz_attempts?: number | null
          quiz_score?: number | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          assessed_by?: string | null
          assessment_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: string
          org_id?: string
          quiz_attempts?: number | null
          quiz_score?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clock_induction_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "clock_induction_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      clock_settings: {
        Row: {
          allow_remote_clock: boolean | null
          auto_break_end_minutes: number | null
          casual_conversion_months: number | null
          created_at: string | null
          grace_period_minutes: number | null
          id: string
          max_remote_hours_week: number | null
          meal_break_minutes: number | null
          meal_break_threshold_hours: number | null
          min_shift_gap_hours: number | null
          org_id: string
          photo_retention_days: number | null
          pin_lockout_attempts: number | null
          pin_lockout_minutes: number | null
          probation_months: number | null
          require_photo: boolean | null
          rest_break_minutes: number | null
          rest_break_threshold_hours: number | null
          updated_at: string | null
        }
        Insert: {
          allow_remote_clock?: boolean | null
          auto_break_end_minutes?: number | null
          casual_conversion_months?: number | null
          created_at?: string | null
          grace_period_minutes?: number | null
          id?: string
          max_remote_hours_week?: number | null
          meal_break_minutes?: number | null
          meal_break_threshold_hours?: number | null
          min_shift_gap_hours?: number | null
          org_id: string
          photo_retention_days?: number | null
          pin_lockout_attempts?: number | null
          pin_lockout_minutes?: number | null
          probation_months?: number | null
          require_photo?: boolean | null
          rest_break_minutes?: number | null
          rest_break_threshold_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          allow_remote_clock?: boolean | null
          auto_break_end_minutes?: number | null
          casual_conversion_months?: number | null
          created_at?: string | null
          grace_period_minutes?: number | null
          id?: string
          max_remote_hours_week?: number | null
          meal_break_minutes?: number | null
          meal_break_threshold_hours?: number | null
          min_shift_gap_hours?: number | null
          org_id?: string
          photo_retention_days?: number | null
          pin_lockout_attempts?: number | null
          pin_lockout_minutes?: number | null
          probation_months?: number | null
          require_photo?: boolean | null
          rest_break_minutes?: number | null
          rest_break_threshold_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clock_shifts: {
        Row: {
          break_minutes: number | null
          clock_in: string
          clock_out: string | null
          created_at: string | null
          id: string
          notes: string | null
          org_id: string
          paid_hours: number | null
          section: string | null
          shift_date: string
          status: string | null
          total_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          break_minutes?: number | null
          clock_in: string
          clock_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          org_id: string
          paid_hours?: number | null
          section?: string | null
          shift_date: string
          status?: string | null
          total_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          break_minutes?: number | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          paid_hours?: number | null
          section?: string | null
          shift_date?: string
          status?: string | null
          total_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      communication_rules: {
        Row: {
          allowed_window_end: string | null
          allowed_window_start: string | null
          channel: string
          created_at: string
          emergency_override: boolean | null
          id: string
          message_type: string
          org_id: string
          respect_rtd: boolean | null
        }
        Insert: {
          allowed_window_end?: string | null
          allowed_window_start?: string | null
          channel: string
          created_at?: string
          emergency_override?: boolean | null
          id?: string
          message_type: string
          org_id: string
          respect_rtd?: boolean | null
        }
        Update: {
          allowed_window_end?: string | null
          allowed_window_start?: string | null
          channel?: string
          created_at?: string
          emergency_override?: boolean | null
          id?: string
          message_type?: string
          org_id?: string
          respect_rtd?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_profiles: {
        Row: {
          bcc_licence_number: string | null
          business_category: string
          created_at: string
          food_safety_program_accredited: boolean | null
          food_safety_program_auditor: string | null
          id: string
          last_star_rating: number | null
          licence_displayed: boolean | null
          licence_expiry: string | null
          next_audit_date: string | null
          org_id: string
          updated_at: string
        }
        Insert: {
          bcc_licence_number?: string | null
          business_category?: string
          created_at?: string
          food_safety_program_accredited?: boolean | null
          food_safety_program_auditor?: string | null
          id?: string
          last_star_rating?: number | null
          licence_displayed?: boolean | null
          licence_expiry?: string | null
          next_audit_date?: string | null
          org_id: string
          updated_at?: string
        }
        Update: {
          bcc_licence_number?: string | null
          business_category?: string
          created_at?: string
          food_safety_program_accredited?: boolean | null
          food_safety_program_auditor?: string | null
          id?: string
          last_star_rating?: number | null
          licence_displayed?: boolean | null
          licence_expiry?: string | null
          next_audit_date?: string | null
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      corrective_actions: {
        Row: {
          action_taken: string | null
          action_taken_at: string | null
          action_taken_by: string | null
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          follow_up_completed: boolean | null
          follow_up_date: string | null
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          log_id: string | null
          log_type: string | null
          org_id: string
          photo_url: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
        }
        Insert: {
          action_taken?: string | null
          action_taken_at?: string | null
          action_taken_by?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          log_id?: string | null
          log_type?: string | null
          org_id: string
          photo_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
        }
        Update: {
          action_taken?: string | null
          action_taken_at?: string | null
          action_taken_by?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          log_id?: string | null
          log_type?: string | null
          org_id?: string
          photo_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "corrective_actions_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "daily_compliance_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrective_actions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      correlation_events: {
        Row: {
          correlation_type: string
          data_points: Json | null
          description: string
          detected_at: string | null
          id: string
          impact_estimated: number | null
          org_id: string
          recommendation: string | null
          status: string
        }
        Insert: {
          correlation_type: string
          data_points?: Json | null
          description: string
          detected_at?: string | null
          id?: string
          impact_estimated?: number | null
          org_id: string
          recommendation?: string | null
          status?: string
        }
        Update: {
          correlation_type?: string
          data_points?: Json | null
          description?: string
          detected_at?: string | null
          id?: string
          impact_estimated?: number | null
          org_id?: string
          recommendation?: string | null
          status?: string
        }
        Relationships: []
      }
      daily_compliance_logs: {
        Row: {
          corrective_action_id: string | null
          created_at: string
          id: string
          is_within_safe_zone: boolean | null
          item_description: string | null
          location: string | null
          log_date: string
          log_type: string
          logged_by: string | null
          logged_by_name: string | null
          notes: string | null
          org_id: string
          photo_url: string | null
          recorded_at: string
          requires_corrective_action: boolean | null
          sanitiser_concentration_ppm: number | null
          sanitiser_type: string | null
          shift: string | null
          staff_fit_to_work: boolean | null
          staff_illness_details: string | null
          staff_name: string | null
          status: string | null
          supplier_name: string | null
          temperature_reading: number | null
          visual_check_passed: boolean | null
        }
        Insert: {
          corrective_action_id?: string | null
          created_at?: string
          id?: string
          is_within_safe_zone?: boolean | null
          item_description?: string | null
          location?: string | null
          log_date?: string
          log_type: string
          logged_by?: string | null
          logged_by_name?: string | null
          notes?: string | null
          org_id: string
          photo_url?: string | null
          recorded_at?: string
          requires_corrective_action?: boolean | null
          sanitiser_concentration_ppm?: number | null
          sanitiser_type?: string | null
          shift?: string | null
          staff_fit_to_work?: boolean | null
          staff_illness_details?: string | null
          staff_name?: string | null
          status?: string | null
          supplier_name?: string | null
          temperature_reading?: number | null
          visual_check_passed?: boolean | null
        }
        Update: {
          corrective_action_id?: string | null
          created_at?: string
          id?: string
          is_within_safe_zone?: boolean | null
          item_description?: string | null
          location?: string | null
          log_date?: string
          log_type?: string
          logged_by?: string | null
          logged_by_name?: string | null
          notes?: string | null
          org_id?: string
          photo_url?: string | null
          recorded_at?: string
          requires_corrective_action?: boolean | null
          sanitiser_concentration_ppm?: number | null
          sanitiser_type?: string | null
          shift?: string | null
          staff_fit_to_work?: boolean | null
          staff_illness_details?: string | null
          staff_name?: string | null
          status?: string | null
          supplier_name?: string | null
          temperature_reading?: number | null
          visual_check_passed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_compliance_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_thoughts: {
        Row: {
          author: string | null
          category: string
          created_at: string
          day_number: number
          id: string
          is_active: boolean
          message: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string
          created_at?: string
          day_number: number
          id?: string
          is_active?: boolean
          message: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string
          created_at?: string
          day_number?: number
          id?: string
          is_active?: boolean
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_connections: {
        Row: {
          category: string
          config: Json | null
          created_at: string
          error_message: string | null
          id: string
          last_sync_at: string | null
          org_id: string
          provider: string
          status: string
          sync_frequency: string
          updated_at: string
        }
        Insert: {
          category: string
          config?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          org_id: string
          provider: string
          status?: string
          sync_frequency?: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          org_id?: string
          provider?: string
          status?: string
          sync_frequency?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_imports: {
        Row: {
          amount: number
          connection_id: string | null
          created_at: string
          data_type: string
          id: string
          metadata: Json | null
          org_id: string
          period_end: string
          period_start: string
          processed_at: string | null
          source_type: string
          status: string
        }
        Insert: {
          amount?: number
          connection_id?: string | null
          created_at?: string
          data_type: string
          id?: string
          metadata?: Json | null
          org_id: string
          period_end: string
          period_start: string
          processed_at?: string | null
          source_type?: string
          status?: string
        }
        Update: {
          amount?: number
          connection_id?: string | null
          created_at?: string
          data_type?: string
          id?: string
          metadata?: Json | null
          org_id?: string
          period_end?: string
          period_start?: string
          processed_at?: string | null
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_imports_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "data_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_imports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      delegated_tasks: {
        Row: {
          assigned_to: string
          assigned_to_name: string
          completed_at: string | null
          created_at: string
          created_by: string
          due_date: string
          id: string
          org_id: string
          quantity: string | null
          source_todo_id: string | null
          status: string
          task: string
          urgency: string
          venue_id: string | null
        }
        Insert: {
          assigned_to: string
          assigned_to_name: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          due_date?: string
          id?: string
          org_id: string
          quantity?: string | null
          source_todo_id?: string | null
          status?: string
          task: string
          urgency?: string
          venue_id?: string | null
        }
        Update: {
          assigned_to?: string
          assigned_to_name?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          due_date?: string
          id?: string
          org_id?: string
          quantity?: string | null
          source_todo_id?: string | null
          status?: string
          task?: string
          urgency?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delegated_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegated_tasks_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "org_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_insights: {
        Row: {
          avg_price_paid: number | null
          created_at: string
          id: string
          ingredient_category: string
          ingredient_name: string | null
          order_count: number
          postcode: string
          total_quantity: number
          unit: string
          week_ending: string
        }
        Insert: {
          avg_price_paid?: number | null
          created_at?: string
          id?: string
          ingredient_category: string
          ingredient_name?: string | null
          order_count?: number
          postcode: string
          total_quantity?: number
          unit?: string
          week_ending: string
        }
        Update: {
          avg_price_paid?: number | null
          created_at?: string
          id?: string
          ingredient_category?: string
          ingredient_name?: string | null
          order_count?: number
          postcode?: string
          total_quantity?: number
          unit?: string
          week_ending?: string
        }
        Relationships: []
      }
      depreciation_assets: {
        Row: {
          created_at: string
          created_by: string | null
          current_book_value: number
          depreciation_method: string
          id: string
          is_active: boolean
          monthly_depreciation: number
          name: string
          org_id: string
          purchase_date: string
          purchase_price: number
          salvage_value: number
          useful_life_years: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_book_value?: number
          depreciation_method?: string
          id?: string
          is_active?: boolean
          monthly_depreciation?: number
          name: string
          org_id: string
          purchase_date?: string
          purchase_price?: number
          salvage_value?: number
          useful_life_years?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_book_value?: number
          depreciation_method?: string
          id?: string
          is_active?: boolean
          monthly_depreciation?: number
          name?: string
          org_id?: string
          purchase_date?: string
          purchase_price?: number
          salvage_value?: number
          useful_life_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "depreciation_assets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      ecosystem_sync_log: {
        Row: {
          last_data_at: string
          module: string
          org_id: string
          record_count: number
          source_type: string
          status: string
        }
        Insert: {
          last_data_at?: string
          module: string
          org_id: string
          record_count?: number
          source_type?: string
          status?: string
        }
        Update: {
          last_data_at?: string
          module?: string
          org_id?: string
          record_count?: number
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_sync_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ingestion_log: {
        Row: {
          attachments: Json | null
          confidence: number | null
          created_at: string
          email_from: string | null
          email_subject: string | null
          extracted_data: Json | null
          id: string
          org_id: string
          raw_body: string | null
          routed_to: string | null
          status: string
        }
        Insert: {
          attachments?: Json | null
          confidence?: number | null
          created_at?: string
          email_from?: string | null
          email_subject?: string | null
          extracted_data?: Json | null
          id?: string
          org_id: string
          raw_body?: string | null
          routed_to?: string | null
          status?: string
        }
        Update: {
          attachments?: Json | null
          confidence?: number | null
          created_at?: string
          email_from?: string | null
          email_subject?: string | null
          extracted_data?: Json | null
          id?: string
          org_id?: string
          raw_body?: string | null
          routed_to?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_ingestion_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          recipient_user_id: string | null
          sent_at: string | null
          status: string
          template_slug: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_user_id?: string | null
          sent_at?: string | null
          status?: string
          template_slug: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_user_id?: string | null
          sent_at?: string | null
          status?: string
          template_slug?: string
          variables?: Json | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          attachments: Json | null
          body_html: string
          body_text: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          subject: string
          updated_at: string
          updated_by: string | null
          variables: Json | null
        }
        Insert: {
          attachments?: Json | null
          body_html?: string
          body_text?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          subject: string
          updated_at?: string
          updated_by?: string | null
          variables?: Json | null
        }
        Update: {
          attachments?: Json | null
          body_html?: string
          body_text?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          subject?: string
          updated_at?: string
          updated_by?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string
          document_type: string
          expires_at: string | null
          file_url: string | null
          id: string
          is_verified: boolean
          name: string
          org_id: string
          uploaded_at: string
          user_id: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          is_verified?: boolean
          name: string
          org_id: string
          uploaded_at?: string
          user_id: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          is_verified?: boolean
          name?: string
          org_id?: string
          uploaded_at?: string
          user_id?: string
          verified_by?: string | null
        }
        Relationships: []
      }
      employee_lifecycle: {
        Row: {
          conducted_by: string | null
          created_at: string | null
          details: Json | null
          document_url: string | null
          event_type: string
          id: string
          notes: string | null
          org_id: string
          user_id: string
        }
        Insert: {
          conducted_by?: string | null
          created_at?: string | null
          details?: Json | null
          document_url?: string | null
          event_type: string
          id?: string
          notes?: string | null
          org_id: string
          user_id: string
        }
        Update: {
          conducted_by?: string | null
          created_at?: string | null
          details?: Json | null
          document_url?: string | null
          event_type?: string
          id?: string
          notes?: string | null
          org_id?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_milestones: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_acknowledged: boolean
          milestone_date: string
          milestone_type: string
          org_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_acknowledged?: boolean
          milestone_date: string
          milestone_type?: string
          org_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_acknowledged?: boolean
          milestone_date?: string
          milestone_type?: string
          org_id?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_notes: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          id: string
          is_private: boolean | null
          note: string
          org_id: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          note: string
          org_id: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          note?: string
          org_id?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_pins: {
        Row: {
          created_at: string | null
          failed_attempts: number | null
          id: string
          is_temporary: boolean | null
          last_used_at: string | null
          locked_until: string | null
          org_id: string
          pin_hash: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          is_temporary?: boolean | null
          last_used_at?: string | null
          locked_until?: string | null
          org_id: string
          pin_hash: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          is_temporary?: boolean | null
          last_used_at?: string | null
          locked_until?: string | null
          org_id?: string
          pin_hash?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      employee_profiles: {
        Row: {
          address: string | null
          agreed_hours_per_week: number | null
          annual_salary: number | null
          award_code: string
          bank_account_name: string | null
          bank_account_number: string | null
          bank_bsb: string | null
          classification: string
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_type: string
          end_date: string | null
          id: string
          is_active: boolean | null
          is_first_aid_officer: boolean | null
          notes: string | null
          org_id: string
          pay_type: string
          section_tags: Json | null
          start_date: string
          super_fund_name: string | null
          super_fund_usi: string | null
          super_member_number: string | null
          supplies_own_tools: boolean | null
          tax_file_number_encrypted: string | null
          termination_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          agreed_hours_per_week?: number | null
          annual_salary?: number | null
          award_code?: string
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_bsb?: string | null
          classification: string
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_first_aid_officer?: boolean | null
          notes?: string | null
          org_id: string
          pay_type?: string
          section_tags?: Json | null
          start_date?: string
          super_fund_name?: string | null
          super_fund_usi?: string | null
          super_member_number?: string | null
          supplies_own_tools?: boolean | null
          tax_file_number_encrypted?: string | null
          termination_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          agreed_hours_per_week?: number | null
          annual_salary?: number | null
          award_code?: string
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_bsb?: string | null
          classification?: string
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_first_aid_officer?: boolean | null
          notes?: string | null
          org_id?: string
          pay_type?: string
          section_tags?: Json | null
          start_date?: string
          super_fund_name?: string | null
          super_fund_usi?: string | null
          super_member_number?: string | null
          supplies_own_tools?: boolean | null
          tax_file_number_encrypted?: string | null
          termination_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_warnings: {
        Row: {
          created_at: string
          details: string | null
          document_url: string | null
          employee_response: string | null
          expires_at: string | null
          id: string
          issued_at: string
          issued_by: string | null
          org_id: string
          reason: string
          user_id: string
          warning_type: string
          witness_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          document_url?: string | null
          employee_response?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          org_id: string
          reason: string
          user_id: string
          warning_type?: string
          witness_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          document_url?: string | null
          employee_response?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          org_id?: string
          reason?: string
          user_id?: string
          warning_type?: string
          witness_id?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          created_at: string
          id: string
          last_maintenance: string | null
          location: string | null
          maintenance_schedule: string | null
          manual_url: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_maintenance: string | null
          notes: string | null
          org_id: string | null
          purchase_date: string | null
          serial_number: string | null
          status: string | null
          tech_contacts: Json | null
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_maintenance?: string | null
          location?: string | null
          maintenance_schedule?: string | null
          manual_url?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_maintenance?: string | null
          notes?: string | null
          org_id?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          tech_contacts?: Json | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_maintenance?: string | null
          location?: string | null
          maintenance_schedule?: string | null
          manual_url?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_maintenance?: string | null
          notes?: string | null
          org_id?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          tech_contacts?: Json | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_inventory: {
        Row: {
          category: string
          condition: string | null
          cost_per_unit: number | null
          created_at: string
          id: string
          last_counted: string | null
          location: string | null
          name: string
          notes: string | null
          org_id: string
          par_level: number | null
          quantity: number
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string
          condition?: string | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          last_counted?: string | null
          location?: string | null
          name: string
          notes?: string | null
          org_id: string
          par_level?: number | null
          quantity?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          condition?: string | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          last_counted?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          par_level?: number | null
          quantity?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_releases: {
        Row: {
          created_at: string
          description: string | null
          id: string
          module_name: string
          module_slug: string
          release_notes: string | null
          release_type: string
          released_at: string | null
          scheduled_release_at: string | null
          sort_order: number
          status: string
          target_release: string | null
          updated_at: string
          version_tag: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          module_name: string
          module_slug: string
          release_notes?: string | null
          release_type?: string
          released_at?: string | null
          scheduled_release_at?: string | null
          sort_order?: number
          status?: string
          target_release?: string | null
          updated_at?: string
          version_tag?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          module_name?: string
          module_slug?: string
          release_notes?: string | null
          release_type?: string
          released_at?: string | null
          scheduled_release_at?: string | null
          sort_order?: number
          status?: string
          target_release?: string | null
          updated_at?: string
          version_tag?: string | null
        }
        Relationships: []
      }
      food_complaints: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          category: string | null
          complaint_date: string
          complaint_text: string
          created_at: string | null
          created_by: string | null
          dish_name: string | null
          id: string
          notes: string | null
          org_id: string
          recipe_id: string | null
          recipe_name: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          section_id: string | null
          section_name: string | null
          severity: string | null
          source: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          category?: string | null
          complaint_date?: string
          complaint_text: string
          created_at?: string | null
          created_by?: string | null
          dish_name?: string | null
          id?: string
          notes?: string | null
          org_id: string
          recipe_id?: string | null
          recipe_name?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          section_id?: string | null
          section_name?: string | null
          severity?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          category?: string | null
          complaint_date?: string
          complaint_text?: string
          created_at?: string | null
          created_by?: string | null
          dish_name?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          recipe_id?: string | null
          recipe_name?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          section_id?: string | null
          section_name?: string | null
          severity?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_complaints_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_complaints_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "kitchen_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      food_handler_training: {
        Row: {
          certificate_url: string | null
          covers_cleaning: boolean | null
          covers_contamination: boolean | null
          covers_personal_hygiene: boolean | null
          covers_safe_handling: boolean | null
          created_at: string
          expiry_date: string | null
          handler_name: string
          id: string
          org_id: string
          role: string | null
          training_date: string | null
          training_provider: string | null
          training_type: string
        }
        Insert: {
          certificate_url?: string | null
          covers_cleaning?: boolean | null
          covers_contamination?: boolean | null
          covers_personal_hygiene?: boolean | null
          covers_safe_handling?: boolean | null
          created_at?: string
          expiry_date?: string | null
          handler_name: string
          id?: string
          org_id: string
          role?: string | null
          training_date?: string | null
          training_provider?: string | null
          training_type?: string
        }
        Update: {
          certificate_url?: string | null
          covers_cleaning?: boolean | null
          covers_contamination?: boolean | null
          covers_personal_hygiene?: boolean | null
          covers_safe_handling?: boolean | null
          created_at?: string
          expiry_date?: string | null
          handler_name?: string
          id?: string
          org_id?: string
          role?: string | null
          training_date?: string | null
          training_provider?: string | null
          training_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_handler_training_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      food_safety_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          id: string
          location: string | null
          log_id: string
          log_type: string
          org_id: string | null
          recorded_by_name: string | null
          status: string
          temperature: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          location?: string | null
          log_id: string
          log_type: string
          org_id?: string | null
          recorded_by_name?: string | null
          status?: string
          temperature?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          location?: string | null
          log_id?: string
          log_type?: string
          org_id?: string | null
          recorded_by_name?: string | null
          status?: string
          temperature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_safety_alerts_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "food_safety_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_safety_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      food_safety_duties: {
        Row: {
          assigned_by: string | null
          created_at: string
          duty_date: string | null
          id: string
          org_id: string
          shift: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          duty_date?: string | null
          id?: string
          org_id: string
          shift?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          duty_date?: string | null
          id?: string
          org_id?: string
          shift?: string
          user_id?: string
        }
        Relationships: []
      }
      food_safety_logs: {
        Row: {
          ai_verification_notes: string | null
          ai_verification_status: string | null
          corrective_action: string | null
          created_at: string
          date: string
          id: string
          location: string | null
          log_type: string
          notes: string | null
          org_id: string | null
          readings: Json | null
          receiving_data: Json | null
          recorded_by: string | null
          recorded_by_name: string | null
          reference_image_url: string | null
          shift: string | null
          status: string | null
          temp_image_url: string | null
          time: string
          updated_at: string
          verification_image_url: string | null
        }
        Insert: {
          ai_verification_notes?: string | null
          ai_verification_status?: string | null
          corrective_action?: string | null
          created_at?: string
          date?: string
          id?: string
          location?: string | null
          log_type: string
          notes?: string | null
          org_id?: string | null
          readings?: Json | null
          receiving_data?: Json | null
          recorded_by?: string | null
          recorded_by_name?: string | null
          reference_image_url?: string | null
          shift?: string | null
          status?: string | null
          temp_image_url?: string | null
          time?: string
          updated_at?: string
          verification_image_url?: string | null
        }
        Update: {
          ai_verification_notes?: string | null
          ai_verification_status?: string | null
          corrective_action?: string | null
          created_at?: string
          date?: string
          id?: string
          location?: string | null
          log_type?: string
          notes?: string | null
          org_id?: string | null
          readings?: Json | null
          receiving_data?: Json | null
          recorded_by?: string | null
          recorded_by_name?: string | null
          reference_image_url?: string | null
          shift?: string | null
          status?: string | null
          temp_image_url?: string | null
          time?: string
          updated_at?: string
          verification_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_safety_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      food_safety_reminders: {
        Row: {
          created_at: string
          dismissed_at: string | null
          id: string
          org_id: string
          reminder_date: string
          reminder_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed_at?: string | null
          id?: string
          org_id: string
          reminder_date?: string
          reminder_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed_at?: string | null
          id?: string
          org_id?: string
          reminder_date?: string
          reminder_type?: string
          user_id?: string
        }
        Relationships: []
      }
      food_safety_supervisors: {
        Row: {
          certificate_date: string | null
          certificate_document_url: string | null
          certificate_expiry: string | null
          certificate_number: string | null
          certificate_rto: string | null
          created_at: string
          id: string
          is_contactable: boolean | null
          is_primary: boolean | null
          name: string
          notified_council: boolean | null
          org_id: string
        }
        Insert: {
          certificate_date?: string | null
          certificate_document_url?: string | null
          certificate_expiry?: string | null
          certificate_number?: string | null
          certificate_rto?: string | null
          created_at?: string
          id?: string
          is_contactable?: boolean | null
          is_primary?: boolean | null
          name: string
          notified_council?: boolean | null
          org_id: string
        }
        Update: {
          certificate_date?: string | null
          certificate_document_url?: string | null
          certificate_expiry?: string | null
          certificate_number?: string | null
          certificate_rto?: string | null
          created_at?: string
          id?: string
          is_contactable?: boolean | null
          is_primary?: boolean | null
          name?: string
          notified_council?: boolean | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_safety_supervisors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      geofence_locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          org_id: string
          radius_meters: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          org_id: string
          radius_meters?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          org_id?: string
          radius_meters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "geofence_locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          created_at: string
          guest_id: string
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          created_at?: string
          guest_id: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string
          guest_id?: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "growth_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_campaign_recipients_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "res_guests"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_campaigns: {
        Row: {
          body: string | null
          bookings_attributed: number
          channel: string
          clicked_count: number
          created_at: string
          created_by: string | null
          cta_text: string | null
          cta_url: string | null
          id: string
          name: string
          opened_count: number
          org_id: string
          recipients_count: number
          scheduled_at: string | null
          segment: Json | null
          sent_at: string | null
          social_caption: string | null
          status: string
          subject: string | null
          trigger_type: string
          type: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          bookings_attributed?: number
          channel?: string
          clicked_count?: number
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          id?: string
          name: string
          opened_count?: number
          org_id: string
          recipients_count?: number
          scheduled_at?: string | null
          segment?: Json | null
          sent_at?: string | null
          social_caption?: string | null
          status?: string
          subject?: string | null
          trigger_type?: string
          type?: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          bookings_attributed?: number
          channel?: string
          clicked_count?: number
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          id?: string
          name?: string
          opened_count?: number
          org_id?: string
          recipients_count?: number
          scheduled_at?: string | null
          segment?: Json | null
          sent_at?: string | null
          social_caption?: string | null
          status?: string
          subject?: string | null
          trigger_type?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_communications: {
        Row: {
          body: string | null
          booking_link_utm: string | null
          campaign_id: string | null
          channel: string
          clicked_at: string | null
          created_at: string
          guest_id: string | null
          id: string
          opened_at: string | null
          org_id: string
          sent_at: string | null
          status: string
          subject: string | null
          type: string
        }
        Insert: {
          body?: string | null
          booking_link_utm?: string | null
          campaign_id?: string | null
          channel?: string
          clicked_at?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          opened_at?: string | null
          org_id: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          type?: string
        }
        Update: {
          body?: string | null
          booking_link_utm?: string | null
          campaign_id?: string | null
          channel?: string
          clicked_at?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          opened_at?: string | null
          org_id?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_communications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "growth_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_communications_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "res_guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_communications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          category: string
          created_at: string
          icon: string | null
          id: string
          is_published: boolean | null
          module: string
          page: string
          sort_order: number | null
          steps: Json
          subtitle: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean | null
          module: string
          page?: string
          sort_order?: number | null
          steps?: Json
          subtitle?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean | null
          module?: string
          page?: string
          sort_order?: number | null
          steps?: Json
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_cook_feature_config: {
        Row: {
          description: string | null
          enabled: boolean
          feature_key: string
          id: string
          label: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          feature_key: string
          id?: string
          label: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          feature_key?: string
          id?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      home_cook_landing_sections: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_visible: boolean
          section_key: string
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean
          section_key: string
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean
          section_key?: string
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      induction_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          org_id: string
          skipped: boolean
          step_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          org_id: string
          skipped?: boolean
          step_key: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          org_id?: string
          skipped?: boolean
          step_key?: string
          user_id?: string
        }
        Relationships: []
      }
      ingredient_price_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          ingredient_id: string
          new_price: number
          old_price: number | null
          source: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          ingredient_id: string
          new_price: number
          old_price?: number | null
          source?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          ingredient_id?: string
          new_price?: number
          old_price?: number | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_price_history_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          allergens: string[] | null
          category: string
          cost_per_unit: number | null
          created_at: string
          current_stock: number | null
          id: string
          last_price_update: string | null
          name: string
          notes: string | null
          org_id: string | null
          par_level: number | null
          previous_cost_per_unit: number | null
          supplier: string | null
          unit: string
          updated_at: string
          yield_percent: number
        }
        Insert: {
          allergens?: string[] | null
          category?: string
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number | null
          id?: string
          last_price_update?: string | null
          name: string
          notes?: string | null
          org_id?: string | null
          par_level?: number | null
          previous_cost_per_unit?: number | null
          supplier?: string | null
          unit?: string
          updated_at?: string
          yield_percent?: number
        }
        Update: {
          allergens?: string[] | null
          category?: string
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number | null
          id?: string
          last_price_update?: string | null
          name?: string
          notes?: string | null
          org_id?: string | null
          par_level?: number | null
          previous_cost_per_unit?: number | null
          supplier?: string | null
          unit?: string
          updated_at?: string
          yield_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          batch_number: string | null
          created_at: string
          expiry_date: string | null
          id: string
          ingredient_id: string | null
          location: string | null
          min_stock: number | null
          name: string
          org_id: string | null
          quantity: number
          received_date: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          ingredient_id?: string | null
          location?: string | null
          min_stock?: number | null
          name: string
          org_id?: string | null
          quantity?: number
          received_date?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          ingredient_id?: string | null
          location?: string | null
          min_stock?: number | null
          name?: string
          org_id?: string | null
          quantity?: number
          received_date?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_locations: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_scans: {
        Row: {
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          invoice_date: string | null
          invoice_type: string
          items_extracted: number | null
          items_matched: number | null
          notes: string | null
          org_id: string | null
          prices_updated: number | null
          scan_data: Json | null
          scanned_by: string | null
          status: string
          supplier_name: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          invoice_date?: string | null
          invoice_type?: string
          items_extracted?: number | null
          items_matched?: number | null
          notes?: string | null
          org_id?: string | null
          prices_updated?: number | null
          scan_data?: Json | null
          scanned_by?: string | null
          status?: string
          supplier_name?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          invoice_date?: string | null
          invoice_type?: string
          items_extracted?: number | null
          items_matched?: number | null
          notes?: string | null
          org_id?: string | null
          prices_updated?: number | null
          scan_data?: Json | null
          scanned_by?: string | null
          status?: string
          supplier_name?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      kitchen_sections: {
        Row: {
          color: string | null
          created_at: string
          current_month_cost: number | null
          description: string | null
          id: string
          is_active: boolean | null
          monthly_budget: number | null
          name: string
          org_id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          current_month_cost?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          monthly_budget?: number | null
          name: string
          org_id: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          current_month_cost?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          monthly_budget?: number | null
          name?: string
          org_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_sections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_tasks: {
        Row: {
          actual_minutes: number | null
          approved_at: string | null
          approved_by: string | null
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          estimated_minutes: number | null
          id: string
          org_id: string | null
          prep_list_id: string | null
          priority: string
          recipe_id: string | null
          rejection_reason: string | null
          section_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_minutes?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_minutes?: number | null
          id?: string
          org_id?: string | null
          prep_list_id?: string | null
          priority?: string
          recipe_id?: string | null
          rejection_reason?: string | null
          section_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_minutes?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_minutes?: number | null
          id?: string
          org_id?: string | null
          prep_list_id?: string | null
          priority?: string
          recipe_id?: string | null
          rejection_reason?: string | null
          section_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_tasks_prep_list_id_fkey"
            columns: ["prep_list_id"]
            isOneToOne: false
            referencedRelation: "prep_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_tasks_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_tasks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "kitchen_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_roster_shifts: {
        Row: {
          break_minutes: number | null
          created_at: string
          date: string
          end_time: string
          estimated_cost: number | null
          estimated_hours: number | null
          higher_duties_classification: string | null
          higher_duties_reason: string | null
          id: string
          is_published: boolean | null
          notes: string | null
          notification_sent: boolean | null
          org_id: string
          roster_id: string
          section: string | null
          shift_type: string | null
          start_time: string
          status: string | null
          sub_section: string | null
          user_id: string
        }
        Insert: {
          break_minutes?: number | null
          created_at?: string
          date: string
          end_time: string
          estimated_cost?: number | null
          estimated_hours?: number | null
          higher_duties_classification?: string | null
          higher_duties_reason?: string | null
          id?: string
          is_published?: boolean | null
          notes?: string | null
          notification_sent?: boolean | null
          org_id: string
          roster_id: string
          section?: string | null
          shift_type?: string | null
          start_time: string
          status?: string | null
          sub_section?: string | null
          user_id: string
        }
        Update: {
          break_minutes?: number | null
          created_at?: string
          date?: string
          end_time?: string
          estimated_cost?: number | null
          estimated_hours?: number | null
          higher_duties_classification?: string | null
          higher_duties_reason?: string | null
          id?: string
          is_published?: boolean | null
          notes?: string | null
          notification_sent?: boolean | null
          org_id?: string
          roster_id?: string
          section?: string | null
          shift_type?: string | null
          start_time?: string
          status?: string | null
          sub_section?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labour_roster_shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_roster_shifts_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_settings: {
        Row: {
          auto_break_deduction: boolean | null
          created_at: string
          default_award_code: string | null
          default_super_rate: number | null
          id: string
          org_id: string
          overtime_approval_required: boolean | null
          pay_cycle: string | null
          payday: number
          payday_super_enabled: boolean | null
          record_retention_years: number | null
          rounding_rule: string | null
          updated_at: string
        }
        Insert: {
          auto_break_deduction?: boolean | null
          created_at?: string
          default_award_code?: string | null
          default_super_rate?: number | null
          id?: string
          org_id: string
          overtime_approval_required?: boolean | null
          pay_cycle?: string | null
          payday?: number
          payday_super_enabled?: boolean | null
          record_retention_years?: number | null
          rounding_rule?: string | null
          updated_at?: string
        }
        Update: {
          auto_break_deduction?: boolean | null
          created_at?: string
          default_award_code?: string | null
          default_super_rate?: number | null
          id?: string
          org_id?: string
          overtime_approval_required?: boolean | null
          pay_cycle?: string | null
          payday?: number
          payday_super_enabled?: boolean | null
          record_retention_years?: number | null
          rounding_rule?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "labour_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_sections: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_visible: boolean
          section_key: string
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean
          section_key: string
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean
          section_key?: string
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_ups: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          due_at: string
          id: string
          lead_id: string
          note: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          due_at: string
          id?: string
          lead_id: string
          note?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          due_at?: string
          id?: string
          lead_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_rep_id: string | null
          closed_at: string | null
          contact_name: string | null
          created_at: string | null
          deal_value: number | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          source: string | null
          source_referral_id: string | null
          stage: string | null
          stage_entered_at: string | null
          updated_at: string | null
          venue_name: string
        }
        Insert: {
          assigned_rep_id?: string | null
          closed_at?: string | null
          contact_name?: string | null
          created_at?: string | null
          deal_value?: number | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          source_referral_id?: string | null
          stage?: string | null
          stage_entered_at?: string | null
          updated_at?: string | null
          venue_name: string
        }
        Update: {
          assigned_rep_id?: string | null
          closed_at?: string | null
          contact_name?: string | null
          created_at?: string | null
          deal_value?: number | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          source_referral_id?: string | null
          stage?: string | null
          stage_entered_at?: string | null
          updated_at?: string | null
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_source_referral_id_fkey"
            columns: ["source_referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          accrued_hours: number | null
          balance_hours: number | null
          id: string
          last_calculated: string | null
          leave_type: string
          org_id: string
          taken_hours: number | null
          user_id: string
        }
        Insert: {
          accrued_hours?: number | null
          balance_hours?: number | null
          id?: string
          last_calculated?: string | null
          leave_type: string
          org_id: string
          taken_hours?: number | null
          user_id: string
        }
        Update: {
          accrued_hours?: number | null
          balance_hours?: number | null
          id?: string
          last_calculated?: string | null
          leave_type?: string
          org_id?: string
          taken_hours?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          decline_reason: string | null
          end_date: string
          hours_requested: number
          id: string
          leave_type: string
          medical_cert_url: string | null
          org_id: string
          reason: string | null
          start_date: string
          status: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          decline_reason?: string | null
          end_date: string
          hours_requested: number
          id?: string
          leave_type: string
          medical_cert_url?: string | null
          org_id: string
          reason?: string | null
          start_date: string
          status?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          decline_reason?: string | null
          end_date?: string
          hours_requested?: number
          id?: string
          leave_type?: string
          medical_cert_url?: string | null
          org_id?: string
          reason?: string | null
          start_date?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_credits: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string
          id: string
          source_id: string | null
          source_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description: string
          id?: string
          source_id?: string | null
          source_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string
          id?: string
          source_id?: string | null
          source_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      menu_cost_snapshots: {
        Row: {
          created_at: string
          dish_name: string
          fc_percent: number
          food_cost: number
          id: string
          menu_id: string | null
          menu_item_id: string | null
          org_id: string | null
          sell_price: number
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          dish_name: string
          fc_percent?: number
          food_cost?: number
          id?: string
          menu_id?: string | null
          menu_item_id?: string | null
          org_id?: string | null
          sell_price?: number
          snapshot_date?: string
        }
        Update: {
          created_at?: string
          dish_name?: string
          fc_percent?: number
          food_cost?: number
          id?: string
          menu_id?: string | null
          menu_item_id?: string | null
          org_id?: string | null
          sell_price?: number
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_cost_snapshots_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_cost_snapshots_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_cost_snapshots_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          category: string
          contribution_margin: number
          created_at: string
          description: string | null
          food_cost: number
          food_cost_percent: number
          id: string
          is_active: boolean
          menu_id: string
          name: string
          org_id: string | null
          popularity: number
          profitability: string
          recipe_id: string | null
          sell_price: number
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          category?: string
          contribution_margin?: number
          created_at?: string
          description?: string | null
          food_cost?: number
          food_cost_percent?: number
          id?: string
          is_active?: boolean
          menu_id: string
          name: string
          org_id?: string | null
          popularity?: number
          profitability?: string
          recipe_id?: string | null
          sell_price?: number
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          category?: string
          contribution_margin?: number
          created_at?: string
          description?: string | null
          food_cost?: number
          food_cost_percent?: number
          id?: string
          is_active?: boolean
          menu_id?: string
          name?: string
          org_id?: string | null
          popularity?: number
          profitability?: string
          recipe_id?: string | null
          sell_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          avg_food_cost_percent: number | null
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          name: string
          org_id: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          avg_food_cost_percent?: number | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          name: string
          org_id?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          avg_food_cost_percent?: number | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          name?: string
          org_id?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "menus_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      minimum_staffing: {
        Row: {
          created_at: string
          day_type: string
          id: string
          min_covers_threshold: number | null
          min_staff: number
          notes: string | null
          org_id: string
          section: string
          service_period: string
        }
        Insert: {
          created_at?: string
          day_type: string
          id?: string
          min_covers_threshold?: number | null
          min_staff: number
          notes?: string | null
          org_id: string
          section: string
          service_period: string
        }
        Update: {
          created_at?: string
          day_type?: string
          id?: string
          min_covers_threshold?: number | null
          min_staff?: number
          notes?: string | null
          org_id?: string
          section?: string
          service_period?: string
        }
        Relationships: [
          {
            foreignKeyName: "minimum_staffing_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_nav_sections: {
        Row: {
          created_at: string
          direct_path: string | null
          icon_name: string
          id: string
          label: string
          module_paths: string[] | null
          org_id: string | null
          section_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          direct_path?: string | null
          icon_name: string
          id?: string
          label: string
          module_paths?: string[] | null
          org_id?: string | null
          section_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          direct_path?: string | null
          icon_name?: string
          id?: string
          label?: string
          module_paths?: string[] | null
          org_id?: string | null
          section_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_nav_sections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      module_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      money_lite_entries: {
        Row: {
          bev_cost: number
          created_at: string
          food_cost: number
          id: string
          labour: number
          org_id: string
          overheads: number
          period_start: string
          period_type: string
          revenue: number
          updated_at: string
        }
        Insert: {
          bev_cost?: number
          created_at?: string
          food_cost?: number
          id?: string
          labour?: number
          org_id: string
          overheads?: number
          period_start: string
          period_type?: string
          revenue?: number
          updated_at?: string
        }
        Update: {
          bev_cost?: number
          created_at?: string
          food_cost?: number
          id?: string
          labour?: number
          org_id?: string
          overheads?: number
          period_start?: string
          period_type?: string
          revenue?: number
          updated_at?: string
        }
        Relationships: []
      }
      nightly_stock_counts: {
        Row: {
          count_date: string
          created_at: string
          id: string
          notes: string | null
          org_id: string | null
          prep_checklist: Json
          recorded_by: string | null
          recorded_by_name: string | null
          section_id: string | null
          status: string
          stock_data: Json
          template_id: string | null
          updated_at: string
        }
        Insert: {
          count_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          prep_checklist?: Json
          recorded_by?: string | null
          recorded_by_name?: string | null
          section_id?: string | null
          status?: string
          stock_data?: Json
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          count_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          prep_checklist?: Json
          recorded_by?: string | null
          recorded_by_name?: string | null
          section_id?: string | null
          status?: string
          stock_data?: Json
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nightly_stock_counts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nightly_stock_counts_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "kitchen_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nightly_stock_counts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "section_stock_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklists: {
        Row: {
          checklist_type: string
          completed_at: string | null
          created_at: string
          data: Json | null
          id: string
          org_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist_type: string
          completed_at?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          org_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist_type?: string
          completed_at?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          org_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_status: {
        Row: {
          bank_details_complete: boolean | null
          certs_verified: boolean | null
          completed_at: string | null
          created_at: string | null
          employment_docs_signed: boolean | null
          id: string
          induction_complete: boolean | null
          invited_at: string | null
          org_id: string
          personal_details_complete: boolean | null
          pin_changed_from_temp: boolean | null
          profile_photo_uploaded: boolean | null
          status: string | null
          super_details_complete: boolean | null
          tfn_submitted: boolean | null
          updated_at: string | null
          user_id: string
          welcome_email_sent: boolean | null
          welcome_email_sent_at: string | null
        }
        Insert: {
          bank_details_complete?: boolean | null
          certs_verified?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          employment_docs_signed?: boolean | null
          id?: string
          induction_complete?: boolean | null
          invited_at?: string | null
          org_id: string
          personal_details_complete?: boolean | null
          pin_changed_from_temp?: boolean | null
          profile_photo_uploaded?: boolean | null
          status?: string | null
          super_details_complete?: boolean | null
          tfn_submitted?: boolean | null
          updated_at?: string | null
          user_id: string
          welcome_email_sent?: boolean | null
          welcome_email_sent_at?: string | null
        }
        Update: {
          bank_details_complete?: boolean | null
          certs_verified?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          employment_docs_signed?: boolean | null
          id?: string
          induction_complete?: boolean | null
          invited_at?: string | null
          org_id?: string
          personal_details_complete?: boolean | null
          pin_changed_from_temp?: boolean | null
          profile_photo_uploaded?: boolean | null
          status?: string | null
          super_details_complete?: boolean | null
          tfn_submitted?: boolean | null
          updated_at?: string | null
          user_id?: string
          welcome_email_sent?: boolean | null
          welcome_email_sent_at?: string | null
        }
        Relationships: []
      }
      org_email_settings: {
        Row: {
          from_email: string | null
          from_name: string | null
          id: string
          org_id: string
          provider: string
          smtp_host: string | null
          smtp_pass_encrypted: string | null
          smtp_port: number | null
          smtp_user: string | null
          updated_at: string
        }
        Insert: {
          from_email?: string | null
          from_name?: string | null
          id?: string
          org_id: string
          provider?: string
          smtp_host?: string | null
          smtp_pass_encrypted?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string
        }
        Update: {
          from_email?: string | null
          from_name?: string | null
          id?: string
          org_id?: string
          provider?: string
          smtp_host?: string | null
          smtp_pass_encrypted?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_email_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_memberships: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          joined_at: string
          member_status: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          member_status?: string
          org_id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          member_status?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "org_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      org_storage_settings: {
        Row: {
          auto_delete_after_parse: boolean
          bucket_name: string
          created_at: string
          enabled: boolean
          id: string
          org_id: string
          retention_days: number
          updated_at: string
        }
        Insert: {
          auto_delete_after_parse?: boolean
          bucket_name: string
          created_at?: string
          enabled?: boolean
          id?: string
          org_id: string
          retention_days?: number
          updated_at?: string
        }
        Update: {
          auto_delete_after_parse?: boolean
          bucket_name?: string
          created_at?: string
          enabled?: boolean
          id?: string
          org_id?: string
          retention_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_storage_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_venues: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          phone: string | null
          postcode: string | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          phone?: string | null
          postcode?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          phone?: string | null
          postcode?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_venues_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          cover_image_url: string | null
          created_at: string
          id: string
          logo_url: string | null
          max_members: number
          max_venues: number
          name: string
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          owner_id: string
          role_structure: string | null
          settings: Json | null
          slug: string
          store_mode: string
          subscription_tier: string
          team_size_estimate: number | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          max_members?: number
          max_venues?: number
          name: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          owner_id: string
          role_structure?: string | null
          settings?: Json | null
          slug: string
          store_mode?: string
          subscription_tier?: string
          team_size_estimate?: number | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          max_members?: number
          max_venues?: number
          name?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          owner_id?: string
          role_structure?: string | null
          settings?: Json | null
          slug?: string
          store_mode?: string
          subscription_tier?: string
          team_size_estimate?: number | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      overhead_alert_rules: {
        Row: {
          comparison: string
          cost_category: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          metric: string
          notify_email: boolean
          notify_in_app: boolean
          notify_pos: boolean
          notify_sms: boolean
          org_id: string
          period: string
          threshold_critical: number | null
          threshold_warning: number | null
        }
        Insert: {
          comparison?: string
          cost_category: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metric?: string
          notify_email?: boolean
          notify_in_app?: boolean
          notify_pos?: boolean
          notify_sms?: boolean
          org_id: string
          period?: string
          threshold_critical?: number | null
          threshold_warning?: number | null
        }
        Update: {
          comparison?: string
          cost_category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metric?: string
          notify_email?: boolean
          notify_in_app?: boolean
          notify_pos?: boolean
          notify_sms?: boolean
          org_id?: string
          period?: string
          threshold_critical?: number | null
          threshold_warning?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "overhead_alert_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      overhead_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actual_value: number
          id: string
          message: string
          metric_name: string
          org_id: string
          pattern_insight: string | null
          rule_id: string | null
          severity: string
          status: string
          threshold_value: number
          triggered_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_value?: number
          id?: string
          message: string
          metric_name: string
          org_id: string
          pattern_insight?: string | null
          rule_id?: string | null
          severity?: string
          status?: string
          threshold_value?: number
          triggered_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_value?: number
          id?: string
          message?: string
          metric_name?: string
          org_id?: string
          pattern_insight?: string | null
          rule_id?: string | null
          severity?: string
          status?: string
          threshold_value?: number
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "overhead_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overhead_alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "overhead_alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      overhead_benchmarks: {
        Row: {
          benchmark_avg: number
          benchmark_high: number
          benchmark_low: number
          created_at: string
          id: string
          is_default: boolean
          metric: string
          org_id: string
          target_value: number
          venue_type: string
        }
        Insert: {
          benchmark_avg?: number
          benchmark_high?: number
          benchmark_low?: number
          created_at?: string
          id?: string
          is_default?: boolean
          metric: string
          org_id: string
          target_value?: number
          venue_type?: string
        }
        Update: {
          benchmark_avg?: number
          benchmark_high?: number
          benchmark_low?: number
          created_at?: string
          id?: string
          is_default?: boolean
          metric?: string
          org_id?: string
          target_value?: number
          venue_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "overhead_benchmarks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      overhead_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_cogs: boolean
          is_default: boolean
          is_labour: boolean
          name: string
          org_id: string
          parent_category: string | null
          sort_order: number
          type: string
          xero_account_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_cogs?: boolean
          is_default?: boolean
          is_labour?: boolean
          name: string
          org_id: string
          parent_category?: string | null
          sort_order?: number
          type?: string
          xero_account_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_cogs?: boolean
          is_default?: boolean
          is_labour?: boolean
          name?: string
          org_id?: string
          parent_category?: string | null
          sort_order?: number
          type?: string
          xero_account_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "overhead_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overhead_categories_parent_category_fkey"
            columns: ["parent_category"]
            isOneToOne: false
            referencedRelation: "overhead_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      overhead_entries: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          created_by: string | null
          date: string
          description: string
          id: string
          is_auto_generated: boolean
          is_recurring: boolean
          notes: string | null
          org_id: string
          product_source: string | null
          receipt_url: string | null
          recurring_id: string | null
          source: string
          supplier_name: string | null
        }
        Insert: {
          amount?: number
          category_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          description: string
          id?: string
          is_auto_generated?: boolean
          is_recurring?: boolean
          notes?: string | null
          org_id: string
          product_source?: string | null
          receipt_url?: string | null
          recurring_id?: string | null
          source?: string
          supplier_name?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          is_auto_generated?: boolean
          is_recurring?: boolean
          notes?: string | null
          org_id?: string
          product_source?: string | null
          receipt_url?: string | null
          recurring_id?: string | null
          source?: string
          supplier_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "overhead_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "overhead_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overhead_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overhead_entries_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "overhead_recurring"
            referencedColumns: ["id"]
          },
        ]
      }
      overhead_recurring: {
        Row: {
          amount: number
          auto_generate: boolean
          category_id: string
          created_at: string
          created_by: string | null
          description: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          next_due_date: string | null
          org_id: string
          start_date: string
          supplier_name: string | null
        }
        Insert: {
          amount?: number
          auto_generate?: boolean
          category_id: string
          created_at?: string
          created_by?: string | null
          description: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          next_due_date?: string | null
          org_id: string
          start_date?: string
          supplier_name?: string | null
        }
        Update: {
          amount?: number
          auto_generate?: boolean
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          next_due_date?: string | null
          org_id?: string
          start_date?: string
          supplier_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "overhead_recurring_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "overhead_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overhead_recurring_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          allowance_details: Json | null
          allowances: number | null
          bank_account: string | null
          bank_bsb: string | null
          base_pay: number | null
          classification: string
          created_at: string
          deduction_details: Json | null
          employment_type: string
          evening_hours: number | null
          gross_pay: number | null
          id: string
          late_night_hours: number | null
          leave_hours: number | null
          leave_loading: number | null
          leave_pay: number | null
          net_pay: number | null
          ordinary_hours: number | null
          org_id: string
          other_deductions: number | null
          overtime_hours_150: number | null
          overtime_hours_200: number | null
          overtime_pay: number | null
          payg_tax: number | null
          payment_status: string | null
          payroll_run_id: string
          payslip_sent: boolean | null
          payslip_url: string | null
          penalty_pay: number | null
          public_holiday_hours: number | null
          salary_sacrifice: number | null
          saturday_hours: number | null
          stp_allowances: Json | null
          stp_event_id: string | null
          stp_gross_salary: number | null
          stp_lump_sum_amount: number | null
          stp_lump_sum_type: string | null
          stp_overtime: number | null
          stp_paid_leave: number | null
          stp_paid_leave_type: string | null
          stp_resc: number | null
          stp_submitted: boolean | null
          sunday_hours: number | null
          super_guarantee: number | null
          super_salary_sacrifice: number | null
          super_total: number | null
          total_hours: number | null
          user_id: string
          ytd_gross: number | null
          ytd_super: number | null
          ytd_tax: number | null
        }
        Insert: {
          allowance_details?: Json | null
          allowances?: number | null
          bank_account?: string | null
          bank_bsb?: string | null
          base_pay?: number | null
          classification: string
          created_at?: string
          deduction_details?: Json | null
          employment_type: string
          evening_hours?: number | null
          gross_pay?: number | null
          id?: string
          late_night_hours?: number | null
          leave_hours?: number | null
          leave_loading?: number | null
          leave_pay?: number | null
          net_pay?: number | null
          ordinary_hours?: number | null
          org_id: string
          other_deductions?: number | null
          overtime_hours_150?: number | null
          overtime_hours_200?: number | null
          overtime_pay?: number | null
          payg_tax?: number | null
          payment_status?: string | null
          payroll_run_id: string
          payslip_sent?: boolean | null
          payslip_url?: string | null
          penalty_pay?: number | null
          public_holiday_hours?: number | null
          salary_sacrifice?: number | null
          saturday_hours?: number | null
          stp_allowances?: Json | null
          stp_event_id?: string | null
          stp_gross_salary?: number | null
          stp_lump_sum_amount?: number | null
          stp_lump_sum_type?: string | null
          stp_overtime?: number | null
          stp_paid_leave?: number | null
          stp_paid_leave_type?: string | null
          stp_resc?: number | null
          stp_submitted?: boolean | null
          sunday_hours?: number | null
          super_guarantee?: number | null
          super_salary_sacrifice?: number | null
          super_total?: number | null
          total_hours?: number | null
          user_id: string
          ytd_gross?: number | null
          ytd_super?: number | null
          ytd_tax?: number | null
        }
        Update: {
          allowance_details?: Json | null
          allowances?: number | null
          bank_account?: string | null
          bank_bsb?: string | null
          base_pay?: number | null
          classification?: string
          created_at?: string
          deduction_details?: Json | null
          employment_type?: string
          evening_hours?: number | null
          gross_pay?: number | null
          id?: string
          late_night_hours?: number | null
          leave_hours?: number | null
          leave_loading?: number | null
          leave_pay?: number | null
          net_pay?: number | null
          ordinary_hours?: number | null
          org_id?: string
          other_deductions?: number | null
          overtime_hours_150?: number | null
          overtime_hours_200?: number | null
          overtime_pay?: number | null
          payg_tax?: number | null
          payment_status?: string | null
          payroll_run_id?: string
          payslip_sent?: boolean | null
          payslip_url?: string | null
          penalty_pay?: number | null
          public_holiday_hours?: number | null
          salary_sacrifice?: number | null
          saturday_hours?: number | null
          stp_allowances?: Json | null
          stp_event_id?: string | null
          stp_gross_salary?: number | null
          stp_lump_sum_amount?: number | null
          stp_lump_sum_type?: string | null
          stp_overtime?: number | null
          stp_paid_leave?: number | null
          stp_paid_leave_type?: string | null
          stp_resc?: number | null
          stp_submitted?: boolean | null
          sunday_hours?: number | null
          super_guarantee?: number | null
          super_salary_sacrifice?: number | null
          super_total?: number | null
          total_hours?: number | null
          user_id?: string
          ytd_gross?: number | null
          ytd_super?: number | null
          ytd_tax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          bank_file_generated: boolean | null
          bank_file_url: string | null
          created_at: string
          id: string
          org_id: string
          pay_cycle: string | null
          period_end: string
          period_start: string
          processed_at: string | null
          processed_by: string | null
          status: string | null
          stp_submitted: boolean | null
          super_confirmed: boolean | null
          super_due_date: string | null
          super_file_generated: boolean | null
          super_file_url: string | null
          total_employees: number | null
          total_gross: number | null
          total_net: number | null
          total_super: number | null
          total_tax: number | null
        }
        Insert: {
          bank_file_generated?: boolean | null
          bank_file_url?: string | null
          created_at?: string
          id?: string
          org_id: string
          pay_cycle?: string | null
          period_end: string
          period_start: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          stp_submitted?: boolean | null
          super_confirmed?: boolean | null
          super_due_date?: string | null
          super_file_generated?: boolean | null
          super_file_url?: string | null
          total_employees?: number | null
          total_gross?: number | null
          total_net?: number | null
          total_super?: number | null
          total_tax?: number | null
        }
        Update: {
          bank_file_generated?: boolean | null
          bank_file_url?: string | null
          created_at?: string
          id?: string
          org_id?: string
          pay_cycle?: string | null
          period_end?: string
          period_start?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          stp_submitted?: boolean | null
          super_confirmed?: boolean | null
          super_due_date?: string | null
          super_file_generated?: boolean | null
          super_file_url?: string | null
          total_employees?: number | null
          total_gross?: number | null
          total_net?: number | null
          total_super?: number | null
          total_tax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      penalty_rules: {
        Row: {
          applies_from_time: string | null
          applies_to_day: string | null
          applies_to_time: string | null
          award_code: string
          condition: string
          created_at: string
          employment_type: string
          flat_addition: number | null
          id: string
          multiplier: number | null
          notes: string | null
        }
        Insert: {
          applies_from_time?: string | null
          applies_to_day?: string | null
          applies_to_time?: string | null
          award_code?: string
          condition: string
          created_at?: string
          employment_type: string
          flat_addition?: number | null
          id?: string
          multiplier?: number | null
          notes?: string | null
        }
        Update: {
          applies_from_time?: string | null
          applies_to_day?: string | null
          applies_to_time?: string | null
          award_code?: string
          condition?: string
          created_at?: string
          employment_type?: string
          flat_addition?: number | null
          id?: string
          multiplier?: number | null
          notes?: string | null
        }
        Relationships: []
      }
      performance_reviews: {
        Row: {
          comments: string | null
          created_at: string
          employee_comments: string | null
          id: string
          next_review_date: string | null
          org_id: string
          overall_score: number | null
          period_end: string | null
          period_start: string | null
          review_date: string | null
          review_type: string
          reviewer_id: string | null
          scores: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          employee_comments?: string | null
          id?: string
          next_review_date?: string | null
          org_id: string
          overall_score?: number | null
          period_end?: string | null
          period_start?: string | null
          review_date?: string | null
          review_type?: string
          reviewer_id?: string | null
          scores?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          employee_comments?: string | null
          id?: string
          next_review_date?: string | null
          org_id?: string
          overall_score?: number | null
          period_end?: string | null
          period_start?: string | null
          review_date?: string | null
          review_type?: string
          reviewer_id?: string | null
          scores?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pnl_snapshots: {
        Row: {
          break_even_revenue: number
          cogs_bev: number
          cogs_food: number
          cogs_waste_bev: number
          cogs_waste_food: number
          data_completeness_pct: number
          generated_at: string
          gross_margin_pct: number
          gross_profit: number
          id: string
          labour_overtime: number
          labour_pct: number
          labour_super: number
          labour_total: number
          labour_wages: number
          net_profit: number
          net_profit_pct: number
          ops_supplies_cleaning: number | null
          ops_supplies_pct: number | null
          org_id: string
          overhead_pct: number
          overhead_total: number
          period_end: string
          period_start: string
          period_type: string
          prime_cost: number
          prime_cost_pct: number
          revenue_total: number
        }
        Insert: {
          break_even_revenue?: number
          cogs_bev?: number
          cogs_food?: number
          cogs_waste_bev?: number
          cogs_waste_food?: number
          data_completeness_pct?: number
          generated_at?: string
          gross_margin_pct?: number
          gross_profit?: number
          id?: string
          labour_overtime?: number
          labour_pct?: number
          labour_super?: number
          labour_total?: number
          labour_wages?: number
          net_profit?: number
          net_profit_pct?: number
          ops_supplies_cleaning?: number | null
          ops_supplies_pct?: number | null
          org_id: string
          overhead_pct?: number
          overhead_total?: number
          period_end: string
          period_start: string
          period_type?: string
          prime_cost?: number
          prime_cost_pct?: number
          revenue_total?: number
        }
        Update: {
          break_even_revenue?: number
          cogs_bev?: number
          cogs_food?: number
          cogs_waste_bev?: number
          cogs_waste_food?: number
          data_completeness_pct?: number
          generated_at?: string
          gross_margin_pct?: number
          gross_profit?: number
          id?: string
          labour_overtime?: number
          labour_pct?: number
          labour_super?: number
          labour_total?: number
          labour_wages?: number
          net_profit?: number
          net_profit_pct?: number
          ops_supplies_cleaning?: number | null
          ops_supplies_pct?: number | null
          org_id?: string
          overhead_pct?: number
          overhead_total?: number
          period_end?: string
          period_start?: string
          period_type?: string
          prime_cost?: number
          prime_cost_pct?: number
          revenue_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pnl_snapshots_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_audit_events: {
        Row: {
          action: string
          after_data: Json | null
          authorised_by: string | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          org_id: string
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          authorised_by?: string | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          org_id: string
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          authorised_by?: string | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          org_id?: string
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_audit_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_certifications: {
        Row: {
          cert_name: string
          cert_type: string
          created_at: string
          expiry_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          org_id: string
          qr_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cert_name: string
          cert_type: string
          created_at?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          org_id: string
          qr_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cert_name?: string
          cert_type?: string
          created_at?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          org_id?: string
          qr_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_certifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_daily_close: {
        Row: {
          actual_cash: number
          close_date: string
          closed_by: string | null
          created_at: string
          expected_cash: number
          id: string
          notes: string | null
          order_count: number
          org_id: string
          total_card: number
          total_cash: number
          total_discounts: number
          total_refunds: number
          total_sales: number
          total_voids: number
          variance: number
        }
        Insert: {
          actual_cash?: number
          close_date: string
          closed_by?: string | null
          created_at?: string
          expected_cash?: number
          id?: string
          notes?: string | null
          order_count?: number
          org_id: string
          total_card?: number
          total_cash?: number
          total_discounts?: number
          total_refunds?: number
          total_sales?: number
          total_voids?: number
          variance?: number
        }
        Update: {
          actual_cash?: number
          close_date?: string
          closed_by?: string | null
          created_at?: string
          expected_cash?: number
          id?: string
          notes?: string | null
          order_count?: number
          org_id?: string
          total_card?: number
          total_cash?: number
          total_discounts?: number
          total_refunds?: number
          total_sales?: number
          total_voids?: number
          variance?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_daily_close_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_menu_item_modifier_groups: {
        Row: {
          id: string
          menu_item_id: string
          modifier_group_id: string
        }
        Insert: {
          id?: string
          menu_item_id: string
          modifier_group_id: string
        }
        Update: {
          id?: string
          menu_item_id?: string
          modifier_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_menu_item_modifier_groups_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "pos_menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_menu_item_modifier_groups_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "pos_modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_menu_items: {
        Row: {
          bev_product_id: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          org_id: string
          price: number
          recipe_id: string | null
          sort_order: number
          station: string | null
          updated_at: string
        }
        Insert: {
          bev_product_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          org_id: string
          price?: number
          recipe_id?: string | null
          sort_order?: number
          station?: string | null
          updated_at?: string
        }
        Update: {
          bev_product_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          org_id?: string
          price?: number
          recipe_id?: string | null
          sort_order?: number
          station?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_menu_items_bev_product_id_fkey"
            columns: ["bev_product_id"]
            isOneToOne: false
            referencedRelation: "bev_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pos_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_menu_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_menu_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_modifier_groups: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          max_selections: number
          min_selections: number
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          max_selections?: number
          min_selections?: number
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          max_selections?: number
          min_selections?: number
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_modifier_groups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_modifiers: {
        Row: {
          group_id: string
          id: string
          is_active: boolean
          name: string
          price_adjustment: number
          sort_order: number
        }
        Insert: {
          group_id: string
          id?: string
          is_active?: boolean
          name: string
          price_adjustment?: number
          sort_order?: number
        }
        Update: {
          group_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price_adjustment?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_modifiers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pos_modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_order_events: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          order_id: string
          org_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          order_id: string
          org_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          order_id?: string
          org_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_order_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_order_items: {
        Row: {
          course_number: number | null
          created_at: string
          id: string
          item_name: string
          menu_item_id: string | null
          modifiers: Json | null
          notes: string | null
          order_id: string
          quantity: number
          station: string | null
          unit_price: number
        }
        Insert: {
          course_number?: number | null
          created_at?: string
          id?: string
          item_name: string
          menu_item_id?: string | null
          modifiers?: Json | null
          notes?: string | null
          order_id: string
          quantity?: number
          station?: string | null
          unit_price?: number
        }
        Update: {
          course_number?: number | null
          created_at?: string
          id?: string
          item_name?: string
          menu_item_id?: string | null
          modifiers?: Json | null
          notes?: string | null
          order_id?: string
          quantity?: number
          station?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "pos_menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_orders: {
        Row: {
          created_at: string
          created_by: string | null
          discount: number
          function_id: string | null
          id: string
          notes: string | null
          order_number: number
          order_type: string
          org_id: string
          paid_at: string | null
          reservation_id: string | null
          status: string
          subtotal: number
          surcharge: number
          tab_id: string | null
          table_number: string | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount?: number
          function_id?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          order_type?: string
          org_id: string
          paid_at?: string | null
          reservation_id?: string | null
          status?: string
          subtotal?: number
          surcharge?: number
          tab_id?: string | null
          table_number?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount?: number
          function_id?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          order_type?: string
          org_id?: string
          paid_at?: string | null
          reservation_id?: string | null
          status?: string
          subtotal?: number
          surcharge?: number
          tab_id?: string | null
          table_number?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "pos_tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_payments: {
        Row: {
          amount: number
          card_brand: string | null
          card_last_four: string | null
          change_given: number | null
          created_at: string
          id: string
          is_refund: boolean
          method: string
          order_id: string
          org_id: string
          processed_by: string | null
          refund_reason: string | null
          stripe_payment_intent_id: string | null
          tendered: number | null
          tip: number
        }
        Insert: {
          amount?: number
          card_brand?: string | null
          card_last_four?: string | null
          change_given?: number | null
          created_at?: string
          id?: string
          is_refund?: boolean
          method?: string
          order_id: string
          org_id: string
          processed_by?: string | null
          refund_reason?: string | null
          stripe_payment_intent_id?: string | null
          tendered?: number | null
          tip?: number
        }
        Update: {
          amount?: number
          card_brand?: string | null
          card_last_four?: string | null
          change_given?: number | null
          created_at?: string
          id?: string
          is_refund?: boolean
          method?: string
          order_id?: string
          org_id?: string
          processed_by?: string | null
          refund_reason?: string | null
          stripe_payment_intent_id?: string | null
          tendered?: number | null
          tip?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_shifts: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          hours: number | null
          id: string
          org_id: string
          status: string
          user_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          hours?: number | null
          id?: string
          org_id: string
          status?: string
          user_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          hours?: number | null
          id?: string
          org_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_staff: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          org_id: string
          pin_hash: string | null
          pos_role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          org_id: string
          pin_hash?: string | null
          pos_role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          org_id?: string
          pin_hash?: string | null
          pos_role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_staff_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_stores: {
        Row: {
          card_surcharge_pct: number
          created_at: string
          id: string
          mode: string
          org_id: string
          receipt_footer: string | null
          receipt_header: string | null
          settings: Json | null
          store_name: string
          stripe_account_id: string | null
          stripe_location_id: string | null
          stripe_reader_id: string | null
          tax_rate: number
          trading_hours: Json | null
          updated_at: string
        }
        Insert: {
          card_surcharge_pct?: number
          created_at?: string
          id?: string
          mode?: string
          org_id: string
          receipt_footer?: string | null
          receipt_header?: string | null
          settings?: Json | null
          store_name?: string
          stripe_account_id?: string | null
          stripe_location_id?: string | null
          stripe_reader_id?: string | null
          tax_rate?: number
          trading_hours?: Json | null
          updated_at?: string
        }
        Update: {
          card_surcharge_pct?: number
          created_at?: string
          id?: string
          mode?: string
          org_id?: string
          receipt_footer?: string | null
          receipt_header?: string | null
          settings?: Json | null
          store_name?: string
          stripe_account_id?: string | null
          stripe_location_id?: string | null
          stripe_reader_id?: string | null
          tax_rate?: number
          trading_hours?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_stores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_tabs: {
        Row: {
          card_last_four: string | null
          closed_at: string | null
          created_at: string
          id: string
          name: string
          opened_at: string
          opened_by: string | null
          org_id: string
          status: string
          stripe_setup_intent_id: string | null
        }
        Insert: {
          card_last_four?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          name: string
          opened_at?: string
          opened_by?: string | null
          org_id: string
          status?: string
          stripe_setup_intent_id?: string | null
        }
        Update: {
          card_last_four?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          opened_at?: string
          opened_by?: string | null
          org_id?: string
          status?: string
          stripe_setup_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_tabs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_waste_logs: {
        Row: {
          cost: number
          created_at: string
          id: string
          item_name: string
          logged_by: string | null
          menu_item_id: string | null
          org_id: string
          quantity: number
          reason: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          item_name: string
          logged_by?: string | null
          menu_item_id?: string | null
          org_id: string
          quantity?: number
          reason?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          item_name?: string
          logged_by?: string | null
          menu_item_id?: string | null
          org_id?: string
          quantity?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_waste_logs_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "pos_menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_waste_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_avatar_url: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_avatar_url?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_avatar_url?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "team_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "team_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      prep_list_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          prep_list_id: string
          task_id: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          prep_list_id: string
          task_id?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          prep_list_id?: string
          task_id?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prep_list_comments_prep_list_id_fkey"
            columns: ["prep_list_id"]
            isOneToOne: false
            referencedRelation: "prep_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      prep_list_templates: {
        Row: {
          auto_generate_enabled: boolean | null
          auto_generate_time: string | null
          created_at: string
          created_by: string | null
          default_assignee_name: string | null
          id: string
          is_active: boolean | null
          items: Json
          name: string
          org_id: string
          schedule_days: string[] | null
          schedule_type: string
          section_id: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          auto_generate_enabled?: boolean | null
          auto_generate_time?: string | null
          created_at?: string
          created_by?: string | null
          default_assignee_name?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json
          name: string
          org_id: string
          schedule_days?: string[] | null
          schedule_type?: string
          section_id?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          auto_generate_enabled?: boolean | null
          auto_generate_time?: string | null
          created_at?: string
          created_by?: string | null
          default_assignee_name?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json
          name?: string
          org_id?: string
          schedule_days?: string[] | null
          schedule_type?: string
          section_id?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prep_list_templates_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "kitchen_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_list_templates_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "org_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      prep_lists: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string
          created_by: string | null
          date: string
          head_chef_notes: string | null
          head_chef_reviewed: boolean | null
          id: string
          is_auto_generated: boolean | null
          items: Json | null
          name: string
          notes: string | null
          org_id: string | null
          section_id: string | null
          status: string | null
          template_id: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          head_chef_notes?: string | null
          head_chef_reviewed?: boolean | null
          id?: string
          is_auto_generated?: boolean | null
          items?: Json | null
          name: string
          notes?: string | null
          org_id?: string | null
          section_id?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          head_chef_notes?: string | null
          head_chef_reviewed?: boolean | null
          id?: string
          is_auto_generated?: boolean | null
          items?: Json | null
          name?: string
          notes?: string | null
          org_id?: string | null
          section_id?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prep_lists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_lists_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "kitchen_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_lists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "prep_list_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_lists_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "org_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      production_batches: {
        Row: {
          actual_cost: number | null
          batch_code: string
          created_at: string
          expiry_date: string | null
          id: string
          notes: string | null
          org_id: string
          produced_by: string | null
          produced_by_name: string | null
          production_date: string
          quantity: number
          recipe_id: string | null
          recipe_name: string
          scale_factor: number | null
          servings_produced: number
          shelf_life_days: number | null
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          batch_code: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          org_id: string
          produced_by?: string | null
          produced_by_name?: string | null
          production_date?: string
          quantity?: number
          recipe_id?: string | null
          recipe_name: string
          scale_factor?: number | null
          servings_produced?: number
          shelf_life_days?: number | null
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          batch_code?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          produced_by?: string | null
          produced_by_name?: string | null
          production_date?: string
          quantity?: number
          recipe_id?: string | null
          recipe_name?: string
          scale_factor?: number | null
          servings_produced?: number
          shelf_life_days?: number | null
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_batches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batches_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      production_expiry_log: {
        Row: {
          alert_hours_before: number | null
          alert_sent: boolean | null
          batch_code: string | null
          check_notes: string | null
          checked_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          last_checked_at: string | null
          org_id: string
          produced_at: string | null
          recipe_id: string | null
          recipe_name: string | null
          status: string
          storage_notes: string | null
          storage_temp: string | null
        }
        Insert: {
          alert_hours_before?: number | null
          alert_sent?: boolean | null
          batch_code?: string | null
          check_notes?: string | null
          checked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_checked_at?: string | null
          org_id: string
          produced_at?: string | null
          recipe_id?: string | null
          recipe_name?: string | null
          status?: string
          storage_notes?: string | null
          storage_temp?: string | null
        }
        Update: {
          alert_hours_before?: number | null
          alert_sent?: boolean | null
          batch_code?: string | null
          check_notes?: string | null
          checked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_checked_at?: string | null
          org_id?: string
          produced_at?: string | null
          recipe_id?: string | null
          recipe_name?: string | null
          status?: string
          storage_notes?: string | null
          storage_temp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_expiry_log_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          menu_costing_onboarded: boolean
          phone: string | null
          position: string | null
          postcode: string | null
          save_invoice_files: boolean | null
          updated_at: string
          user_id: string
          walkthrough_completed: boolean
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          menu_costing_onboarded?: boolean
          phone?: string | null
          position?: string | null
          postcode?: string | null
          save_invoice_files?: boolean | null
          updated_at?: string
          user_id: string
          walkthrough_completed?: boolean
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          menu_costing_onboarded?: boolean
          phone?: string | null
          position?: string | null
          postcode?: string | null
          save_invoice_files?: boolean | null
          updated_at?: string
          user_id?: string
          walkthrough_completed?: boolean
        }
        Relationships: []
      }
      public_holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          is_national: boolean | null
          name: string
          state: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_national?: boolean | null
          name: string
          state: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_national?: boolean | null
          name?: string
          state?: string
        }
        Relationships: []
      }
      recipe_ccps: {
        Row: {
          corrective_action: string | null
          created_at: string
          critical_limit_max: number | null
          critical_limit_min: number | null
          hazard_description: string | null
          hazard_type: string | null
          id: string
          is_critical: boolean | null
          monitoring_frequency: string | null
          monitoring_procedure: string | null
          recipe_id: string
          record_keeping_notes: string | null
          step_name: string
          step_order: number
          step_type: string
          target_temp: number | null
          temp_unit: string | null
          time_limit: number | null
          timeline_position: number | null
          updated_at: string
          verification_method: string | null
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string
          critical_limit_max?: number | null
          critical_limit_min?: number | null
          hazard_description?: string | null
          hazard_type?: string | null
          id?: string
          is_critical?: boolean | null
          monitoring_frequency?: string | null
          monitoring_procedure?: string | null
          recipe_id: string
          record_keeping_notes?: string | null
          step_name: string
          step_order?: number
          step_type?: string
          target_temp?: number | null
          temp_unit?: string | null
          time_limit?: number | null
          timeline_position?: number | null
          updated_at?: string
          verification_method?: string | null
        }
        Update: {
          corrective_action?: string | null
          created_at?: string
          critical_limit_max?: number | null
          critical_limit_min?: number | null
          hazard_description?: string | null
          hazard_type?: string | null
          id?: string
          is_critical?: boolean | null
          monitoring_frequency?: string | null
          monitoring_procedure?: string | null
          recipe_id?: string
          record_keeping_notes?: string | null
          step_name?: string
          step_order?: number
          step_type?: string
          target_temp?: number | null
          temp_unit?: string | null
          time_limit?: number | null
          timeline_position?: number | null
          updated_at?: string
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ccps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string | null
          notes: string | null
          quantity: number
          recipe_id: string
          sub_recipe_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          notes?: string | null
          quantity?: number
          recipe_id: string
          sub_recipe_id?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          notes?: string | null
          quantity?: number
          recipe_id?: string
          sub_recipe_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_sub_recipe_id_fkey"
            columns: ["sub_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_method_steps: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          instruction: string
          org_id: string
          recipe_id: string
          section_number: number
          section_title: string
          sort_order: number
          step_number: number
          timer_id: string | null
          tips: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction?: string
          org_id: string
          recipe_id: string
          section_number?: number
          section_title?: string
          sort_order?: number
          step_number?: number
          timer_id?: string | null
          tips?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction?: string
          org_id?: string
          recipe_id?: string
          section_number?: number
          section_title?: string
          sort_order?: number
          step_number?: number
          timer_id?: string | null
          tips?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_method_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_method_steps_timer_id_fkey"
            columns: ["timer_id"]
            isOneToOne: false
            referencedRelation: "recipe_timers"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_plating_steps: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          instruction: string
          org_id: string
          recipe_id: string
          sort_order: number
          step_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction?: string
          org_id: string
          recipe_id: string
          sort_order?: number
          step_number?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction?: string
          org_id?: string
          recipe_id?: string
          sort_order?: number
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_plating_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_sections: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          org_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          org_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          org_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_sections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_timers: {
        Row: {
          alert_type: string
          colour: string | null
          created_at: string
          critical: boolean
          duration_seconds: number
          icon: string | null
          id: string
          is_enabled: boolean
          is_minimum_time: boolean
          label: string
          notes: string | null
          org_id: string
          recipe_id: string
          sort_order: number
          stages: Json | null
          step_number: number
          timer_type: string
        }
        Insert: {
          alert_type?: string
          colour?: string | null
          created_at?: string
          critical?: boolean
          duration_seconds: number
          icon?: string | null
          id?: string
          is_enabled?: boolean
          is_minimum_time?: boolean
          label: string
          notes?: string | null
          org_id: string
          recipe_id: string
          sort_order?: number
          stages?: Json | null
          step_number?: number
          timer_type?: string
        }
        Update: {
          alert_type?: string
          colour?: string | null
          created_at?: string
          critical?: boolean
          duration_seconds?: number
          icon?: string | null
          id?: string
          is_enabled?: boolean
          is_minimum_time?: boolean
          label?: string
          notes?: string | null
          org_id?: string
          recipe_id?: string
          sort_order?: number
          stages?: Json | null
          step_number?: number
          timer_type?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          allergens: string[] | null
          batch_yield_quantity: number | null
          batch_yield_unit: string | null
          category: string
          cook_time: number | null
          cost_per_serving: number | null
          created_at: string
          created_by: string | null
          description: string | null
          food_cost_high_alert: number | null
          food_cost_low_alert: number | null
          gst_percent: number | null
          id: string
          image_url: string | null
          ingredients: Json | null
          instructions: Json | null
          is_batch_recipe: boolean | null
          is_public: boolean | null
          name: string
          org_id: string | null
          prep_time: number | null
          recipe_type: string
          requires_resting: boolean
          resting_duration_hours: number
          resting_type: string | null
          sell_price: number | null
          servings: number | null
          shelf_life_days: number
          shelf_life_hours: number
          storage_notes: string | null
          storage_temp: string | null
          target_food_cost_percent: number | null
          tasting_notes: string | null
          total_yield: number | null
          updated_at: string
          yield_percent: number | null
          yield_unit: string | null
        }
        Insert: {
          allergens?: string[] | null
          batch_yield_quantity?: number | null
          batch_yield_unit?: string | null
          category?: string
          cook_time?: number | null
          cost_per_serving?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          food_cost_high_alert?: number | null
          food_cost_low_alert?: number | null
          gst_percent?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          is_batch_recipe?: boolean | null
          is_public?: boolean | null
          name: string
          org_id?: string | null
          prep_time?: number | null
          recipe_type?: string
          requires_resting?: boolean
          resting_duration_hours?: number
          resting_type?: string | null
          sell_price?: number | null
          servings?: number | null
          shelf_life_days?: number
          shelf_life_hours?: number
          storage_notes?: string | null
          storage_temp?: string | null
          target_food_cost_percent?: number | null
          tasting_notes?: string | null
          total_yield?: number | null
          updated_at?: string
          yield_percent?: number | null
          yield_unit?: string | null
        }
        Update: {
          allergens?: string[] | null
          batch_yield_quantity?: number | null
          batch_yield_unit?: string | null
          category?: string
          cook_time?: number | null
          cost_per_serving?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          food_cost_high_alert?: number | null
          food_cost_low_alert?: number | null
          gst_percent?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          is_batch_recipe?: boolean | null
          is_public?: boolean | null
          name?: string
          org_id?: string | null
          prep_time?: number | null
          recipe_type?: string
          requires_resting?: boolean
          resting_duration_hours?: number
          resting_type?: string | null
          sell_price?: number | null
          servings?: number | null
          shelf_life_days?: number
          shelf_life_hours?: number
          storage_notes?: string | null
          storage_temp?: string | null
          target_food_cost_percent?: number | null
          tasting_notes?: string | null
          total_yield?: number | null
          updated_at?: string
          yield_percent?: number | null
          yield_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_applicants: {
        Row: {
          ai_score: number | null
          ai_summary: string | null
          applied_at: string
          cover_letter: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          interview_notes: Json | null
          org_id: string
          phone: string | null
          position_id: string | null
          resume_url: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_score?: number | null
          ai_summary?: string | null
          applied_at?: string
          cover_letter?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          interview_notes?: Json | null
          org_id: string
          phone?: string | null
          position_id?: string | null
          resume_url?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_score?: number | null
          ai_summary?: string | null
          applied_at?: string
          cover_letter?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          interview_notes?: Json | null
          org_id?: string
          phone?: string | null
          position_id?: string | null
          resume_url?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_applicants_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "recruitment_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_interviews: {
        Row: {
          applicant_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          interview_type: string
          interviewer_id: string | null
          notes: string | null
          org_id: string
          outcome: string
          scheduled_at: string | null
          score: number | null
          scoring_notes: Json | null
        }
        Insert: {
          applicant_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          interview_type?: string
          interviewer_id?: string | null
          notes?: string | null
          org_id: string
          outcome?: string
          scheduled_at?: string | null
          score?: number | null
          scoring_notes?: Json | null
        }
        Update: {
          applicant_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          interview_type?: string
          interviewer_id?: string | null
          notes?: string | null
          org_id?: string
          outcome?: string
          scheduled_at?: string | null
          score?: number | null
          scoring_notes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_interviews_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "recruitment_applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_positions: {
        Row: {
          classification: string | null
          closes_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          employment_type: string
          id: string
          org_id: string
          posted_at: string | null
          requirements: string | null
          section: string
          status: string
          title: string
          updated_at: string
          wage_range_max: number | null
          wage_range_min: number | null
        }
        Insert: {
          classification?: string | null
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          employment_type?: string
          id?: string
          org_id: string
          posted_at?: string | null
          requirements?: string | null
          section?: string
          status?: string
          title: string
          updated_at?: string
          wage_range_max?: number | null
          wage_range_min?: number | null
        }
        Update: {
          classification?: string | null
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          employment_type?: string
          id?: string
          org_id?: string
          posted_at?: string | null
          requirements?: string | null
          section?: string
          status?: string
          title?: string
          updated_at?: string
          wage_range_max?: number | null
          wage_range_min?: number | null
        }
        Relationships: []
      }
      referral_analytics: {
        Row: {
          created_at: string | null
          id: string
          net_margin: number | null
          paid_conversions: number | null
          period_end: string
          period_start: string
          referrals_sent: number | null
          revenue_generated: number | null
          reward_cost: number | null
          signups: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          net_margin?: number | null
          paid_conversions?: number | null
          period_end: string
          period_start: string
          referrals_sent?: number | null
          revenue_generated?: number | null
          reward_cost?: number | null
          signups?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          net_margin?: number | null
          paid_conversions?: number | null
          period_end?: string
          period_start?: string
          referrals_sent?: number | null
          revenue_generated?: number | null
          reward_cost?: number | null
          signups?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          badge_color: string | null
          badge_icon: string | null
          created_at: string
          id: string
          min_referrals: number
          reward_description: string
          tier: string
        }
        Insert: {
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string
          id?: string
          min_referrals: number
          reward_description: string
          tier: string
        }
        Update: {
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string
          id?: string
          min_referrals?: number
          reward_description?: string
          tier?: string
        }
        Relationships: []
      }
      referral_settings: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          milestone_thresholds: Json | null
          plan_tier: string
          qualification_event: string | null
          referred_reward_value_credit: number | null
          referred_reward_value_percent: number | null
          reward_cap: number | null
          reward_type: string
          reward_value_credit: number | null
          reward_value_percent: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          milestone_thresholds?: Json | null
          plan_tier: string
          qualification_event?: string | null
          referred_reward_value_credit?: number | null
          referred_reward_value_percent?: number | null
          reward_cap?: number | null
          reward_type?: string
          reward_value_credit?: number | null
          reward_value_percent?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          milestone_thresholds?: Json | null
          plan_tier?: string
          qualification_event?: string | null
          referred_reward_value_credit?: number | null
          referred_reward_value_percent?: number | null
          reward_cap?: number | null
          reward_type?: string
          reward_value_credit?: number | null
          reward_value_percent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_shares: {
        Row: {
          channel: string
          code_id: string
          id: string
          shared_at: string | null
        }
        Insert: {
          channel: string
          code_id: string
          id?: string
          shared_at?: string | null
        }
        Update: {
          channel?: string
          code_id?: string
          id?: string
          shared_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_shares_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          channel: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          referral_code: string
          referred_email: string | null
          referred_reward_value: number | null
          referred_user_id: string | null
          referrer_id: string
          reward_status: string | null
          reward_tier: string | null
          reward_type: string | null
          reward_value: number | null
          shared_at: string | null
          status: string
        }
        Insert: {
          channel?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          referral_code: string
          referred_email?: string | null
          referred_reward_value?: number | null
          referred_user_id?: string | null
          referrer_id: string
          reward_status?: string | null
          reward_tier?: string | null
          reward_type?: string | null
          reward_value?: number | null
          shared_at?: string | null
          status?: string
        }
        Update: {
          channel?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          referral_code?: string
          referred_email?: string | null
          referred_reward_value?: number | null
          referred_user_id?: string | null
          referrer_id?: string
          reward_status?: string | null
          reward_tier?: string | null
          reward_type?: string | null
          reward_value?: number | null
          shared_at?: string | null
          status?: string
        }
        Relationships: []
      }
      res_demand_forecasts: {
        Row: {
          actual_covers: number | null
          bev_os_stock_checked: boolean
          chef_os_prep_generated: boolean
          confidence_score: number
          confirmed_reservations: number
          created_at: string
          date: string
          id: string
          labour_os_coverage_checked: boolean
          org_id: string
          predicted_covers: number
          predicted_functions_covers: number
          predicted_no_shows: number
          predicted_walk_ins: number
          service_period: string
          updated_at: string
        }
        Insert: {
          actual_covers?: number | null
          bev_os_stock_checked?: boolean
          chef_os_prep_generated?: boolean
          confidence_score?: number
          confirmed_reservations?: number
          created_at?: string
          date: string
          id?: string
          labour_os_coverage_checked?: boolean
          org_id: string
          predicted_covers?: number
          predicted_functions_covers?: number
          predicted_no_shows?: number
          predicted_walk_ins?: number
          service_period?: string
          updated_at?: string
        }
        Update: {
          actual_covers?: number | null
          bev_os_stock_checked?: boolean
          chef_os_prep_generated?: boolean
          confidence_score?: number
          confirmed_reservations?: number
          created_at?: string
          date?: string
          id?: string
          labour_os_coverage_checked?: boolean
          org_id?: string
          predicted_covers?: number
          predicted_functions_covers?: number
          predicted_no_shows?: number
          predicted_walk_ins?: number
          service_period?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "res_demand_forecasts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      res_floor_layouts: {
        Row: {
          background_url: string | null
          canvas_height: number
          canvas_width: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          background_url?: string | null
          canvas_height?: number
          canvas_width?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id: string
          updated_at?: string
        }
        Update: {
          background_url?: string | null
          canvas_height?: number
          canvas_width?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "res_floor_layouts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      res_floor_zones: {
        Row: {
          color: string
          created_at: string
          height: number
          id: string
          label: string
          layout_id: string | null
          org_id: string
          sort_order: number
          updated_at: string
          width: number
          x: number
          y: number
          zone: string
        }
        Insert: {
          color?: string
          created_at?: string
          height?: number
          id?: string
          label?: string
          layout_id?: string | null
          org_id: string
          sort_order?: number
          updated_at?: string
          width?: number
          x?: number
          y?: number
          zone?: string
        }
        Update: {
          color?: string
          created_at?: string
          height?: number
          id?: string
          label?: string
          layout_id?: string | null
          org_id?: string
          sort_order?: number
          updated_at?: string
          width?: number
          x?: number
          y?: number
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "res_floor_zones_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "res_floor_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      res_function_clients: {
        Row: {
          address: string | null
          company_name: string | null
          contact_name: string
          created_at: string
          email: string | null
          id: string
          last_event_date: string | null
          notes: string | null
          org_id: string
          phone: string | null
          pipeline_stage: string
          source: string | null
          tags: string[] | null
          total_events: number | null
          total_spend: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          last_event_date?: string | null
          notes?: string | null
          org_id: string
          phone?: string | null
          pipeline_stage?: string
          source?: string | null
          tags?: string[] | null
          total_events?: number | null
          total_spend?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          last_event_date?: string | null
          notes?: string | null
          org_id?: string
          phone?: string | null
          pipeline_stage?: string
          source?: string | null
          tags?: string[] | null
          total_events?: number | null
          total_spend?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      res_function_notes: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          function_id: string | null
          id: string
          note: string
          note_type: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          function_id?: string | null
          id?: string
          note: string
          note_type?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          function_id?: string | null
          id?: string
          note?: string
          note_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "res_function_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "res_function_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "res_function_notes_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "res_functions"
            referencedColumns: ["id"]
          },
        ]
      }
      res_function_packages: {
        Row: {
          description: string
          flat_price: number | null
          function_id: string
          id: string
          per_head_price: number | null
          quantity: number
          total: number
          type: string
        }
        Insert: {
          description: string
          flat_price?: number | null
          function_id: string
          id?: string
          per_head_price?: number | null
          quantity?: number
          total?: number
          type: string
        }
        Update: {
          description?: string
          flat_price?: number | null
          function_id?: string
          id?: string
          per_head_price?: number | null
          quantity?: number
          total?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "res_function_packages_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "res_functions"
            referencedColumns: ["id"]
          },
        ]
      }
      res_function_payments: {
        Row: {
          amount: number
          function_id: string
          id: string
          paid_at: string
          payment_method: string | null
          payment_type: string
          received_by: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          function_id: string
          id?: string
          paid_at?: string
          payment_method?: string | null
          payment_type: string
          received_by?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          function_id?: string
          id?: string
          paid_at?: string
          payment_method?: string | null
          payment_type?: string
          received_by?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "res_function_payments_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "res_functions"
            referencedColumns: ["id"]
          },
        ]
      }
      res_function_proposals: {
        Row: {
          accepted_at: string | null
          add_ons: Json | null
          balance_due_days_before: number | null
          beverage_package_id: string | null
          client_company: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          cover_message: string | null
          created_at: string
          created_by: string | null
          deposit_amount: number | null
          deposit_percent: number | null
          deposit_schedule: Json | null
          end_time: string | null
          event_date: string | null
          expires_at: string | null
          function_id: string | null
          hero_headline: string | null
          hero_subheadline: string | null
          id: string
          invite_message: string | null
          menu_template_id: string | null
          minimum_spend: number | null
          org_id: string
          party_size: number | null
          proposal_number: string
          room_hire_fee: number | null
          runsheet: Json | null
          sections_config: Json | null
          sent_at: string | null
          share_token: string | null
          signature_date: string | null
          signature_name: string | null
          start_time: string | null
          status: string
          stripe_checkout_session_id: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          terms_and_conditions: string | null
          title: string
          total: number | null
          total_amount: number | null
          updated_at: string
          valid_until: string | null
          venue_address: string | null
          venue_parking_notes: string | null
          venue_space_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          add_ons?: Json | null
          balance_due_days_before?: number | null
          beverage_package_id?: string | null
          client_company?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          cover_message?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          deposit_percent?: number | null
          deposit_schedule?: Json | null
          end_time?: string | null
          event_date?: string | null
          expires_at?: string | null
          function_id?: string | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: string
          invite_message?: string | null
          menu_template_id?: string | null
          minimum_spend?: number | null
          org_id: string
          party_size?: number | null
          proposal_number: string
          room_hire_fee?: number | null
          runsheet?: Json | null
          sections_config?: Json | null
          sent_at?: string | null
          share_token?: string | null
          signature_date?: string | null
          signature_name?: string | null
          start_time?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms_and_conditions?: string | null
          title?: string
          total?: number | null
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
          venue_address?: string | null
          venue_parking_notes?: string | null
          venue_space_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          add_ons?: Json | null
          balance_due_days_before?: number | null
          beverage_package_id?: string | null
          client_company?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          cover_message?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          deposit_percent?: number | null
          deposit_schedule?: Json | null
          end_time?: string | null
          event_date?: string | null
          expires_at?: string | null
          function_id?: string | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: string
          invite_message?: string | null
          menu_template_id?: string | null
          minimum_spend?: number | null
          org_id?: string
          party_size?: number | null
          proposal_number?: string
          room_hire_fee?: number | null
          runsheet?: Json | null
          sections_config?: Json | null
          sent_at?: string | null
          share_token?: string | null
          signature_date?: string | null
          signature_name?: string | null
          start_time?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms_and_conditions?: string | null
          title?: string
          total?: number | null
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
          venue_address?: string | null
          venue_parking_notes?: string | null
          venue_space_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "res_function_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "res_function_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "res_function_proposals_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "res_functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "res_function_proposals_venue_space_id_fkey"
            columns: ["venue_space_id"]
            isOneToOne: false
            referencedRelation: "res_venue_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      res_functions: {
        Row: {
          client_email: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          deposit_schedule: Json | null
          dietary_requirements: string | null
          end_time: string | null
          event_date: string
          event_type: string
          final_total: number | null
          id: string
          minimum_spend: number | null
          notes: string | null
          org_id: string
          party_size: number
          quoted_total: number | null
          room: string | null
          run_sheet: string | null
          start_time: string
          status: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
          venue_space_id: string | null
        }
        Insert: {
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          deposit_schedule?: Json | null
          dietary_requirements?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string
          final_total?: number | null
          id?: string
          minimum_spend?: number | null
          notes?: string | null
          org_id: string
          party_size: number
          quoted_total?: number | null
          room?: string | null
          run_sheet?: string | null
          start_time: string
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          venue_space_id?: string | null
        }
        Update: {
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          deposit_schedule?: Json | null
          dietary_requirements?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          final_total?: number | null
          id?: string
          minimum_spend?: number | null
          notes?: string | null
          org_id?: string
          party_size?: number
          quoted_total?: number | null
          room?: string | null
          run_sheet?: string | null
          start_time?: string
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          venue_space_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "res_functions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "res_function_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "res_functions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "res_functions_venue_space_id_fkey"
            columns: ["venue_space_id"]
            isOneToOne: false
            referencedRelation: "res_venue_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      res_guests: {
        Row: {
          anniversary_date: string | null
          avg_spend_per_visit: number
          created_at: string
          date_of_birth: string | null
          dietary_requirements: string | null
          email: string | null
          email_opt_in: boolean
          first_name: string
          first_visit_date: string | null
          guest_score: number
          id: string
          last_name: string
          last_visit_date: string | null
          no_show_count: number
          notes: string | null
          org_id: string
          phone: string | null
          preferences: Json
          referred_by_guest_id: string | null
          sms_opt_in: boolean
          source: string | null
          tags: Json
          total_spend: number
          total_visits: number
          updated_at: string
          vip_tier: string
        }
        Insert: {
          anniversary_date?: string | null
          avg_spend_per_visit?: number
          created_at?: string
          date_of_birth?: string | null
          dietary_requirements?: string | null
          email?: string | null
          email_opt_in?: boolean
          first_name: string
          first_visit_date?: string | null
          guest_score?: number
          id?: string
          last_name: string
          last_visit_date?: string | null
          no_show_count?: number
          notes?: string | null
          org_id: string
          phone?: string | null
          preferences?: Json
          referred_by_guest_id?: string | null
          sms_opt_in?: boolean
          source?: string | null
          tags?: Json
          total_spend?: number
          total_visits?: number
          updated_at?: string
          vip_tier?: string
        }
        Update: {
          anniversary_date?: string | null
          avg_spend_per_visit?: number
          created_at?: string
          date_of_birth?: string | null
          dietary_requirements?: string | null
          email?: string | null
          email_opt_in?: boolean
          first_name?: string
          first_visit_date?: string | null
          guest_score?: number
          id?: string
          last_name?: string
          last_visit_date?: string | null
          no_show_count?: number
          notes?: string | null
          org_id?: string
          phone?: string | null
          preferences?: Json
          referred_by_guest_id?: string | null
          sms_opt_in?: boolean
          source?: string | null
          tags?: Json
          total_spend?: number
          total_visits?: number
          updated_at?: string
          vip_tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "res_guests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "res_guests_referred_by_guest_id_fkey"
            columns: ["referred_by_guest_id"]
            isOneToOne: false
            referencedRelation: "res_guests"
            referencedColumns: ["id"]
          },
        ]
      }
      res_proposal_media: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          media_type: string
          proposal_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          media_type?: string
          proposal_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          media_type?: string
          proposal_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "res_proposal_media_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "res_function_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      res_proposal_menu_sections: {
        Row: {
          created_at: string
          description: string | null
          flat_price: number | null
          id: string
          items: Json | null
          per_head_price: number | null
          pricing_type: string
          proposal_id: string
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flat_price?: number | null
          id?: string
          items?: Json | null
          per_head_price?: number | null
          pricing_type?: string
          proposal_id: string
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flat_price?: number | null
          id?: string
          items?: Json | null
          per_head_price?: number | null
          pricing_type?: string
          proposal_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "res_proposal_menu_sections_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "res_function_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      res_reservations: {
        Row: {
          arrived_at: string | null
          channel: string
          completed_at: string | null
          confirmation_sent: boolean
          created_at: string
          created_by: string | null
          date: string
          deposit_amount: number | null
          deposit_paid: boolean
          deposit_required: boolean
          dietary_requirements: string | null
          end_time: string | null
          guest_id: string | null
          id: string
          notes: string | null
          occasion: string | null
          org_id: string
          party_size: number
          reminder_sent_24h: boolean
          reminder_sent_2h: boolean
          seated_at: string | null
          special_requests: string | null
          status: string
          stripe_payment_intent_id: string | null
          table_id: string | null
          time: string
          turn_time_minutes: number | null
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          channel?: string
          completed_at?: string | null
          confirmation_sent?: boolean
          created_at?: string
          created_by?: string | null
          date: string
          deposit_amount?: number | null
          deposit_paid?: boolean
          deposit_required?: boolean
          dietary_requirements?: string | null
          end_time?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          occasion?: string | null
          org_id: string
          party_size: number
          reminder_sent_24h?: boolean
          reminder_sent_2h?: boolean
          seated_at?: string | null
          special_requests?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          table_id?: string | null
          time: string
          turn_time_minutes?: number | null
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          channel?: string
          completed_at?: string | null
          confirmation_sent?: boolean
          created_at?: string
          created_by?: string | null
          date?: string
          deposit_amount?: number | null
          deposit_paid?: boolean
          deposit_required?: boolean
          dietary_requirements?: string | null
          end_time?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          occasion?: string | null
          org_id?: string
          party_size?: number
          reminder_sent_24h?: boolean
          reminder_sent_2h?: boolean
          seated_at?: string | null
          special_requests?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          table_id?: string | null
          time?: string
          turn_time_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "res_reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "res_guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "res_reservations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "res_reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "res_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      res_settings: {
        Row: {
          active_channels: string[]
          cancellation_policy: string
          created_at: string
          deposit_default_percent: number
          deposit_threshold_party_size: number
          id: string
          max_party_size_before_function: number
          operating_hours: Json
          org_id: string
          sms_templates: Json
          updated_at: string
        }
        Insert: {
          active_channels?: string[]
          cancellation_policy?: string
          created_at?: string
          deposit_default_percent?: number
          deposit_threshold_party_size?: number
          id?: string
          max_party_size_before_function?: number
          operating_hours?: Json
          org_id: string
          sms_templates?: Json
          updated_at?: string
        }
        Update: {
          active_channels?: string[]
          cancellation_policy?: string
          created_at?: string
          deposit_default_percent?: number
          deposit_threshold_party_size?: number
          id?: string
          max_party_size_before_function?: number
          operating_hours?: Json
          org_id?: string
          sms_templates?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "res_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      res_tables: {
        Row: {
          block_reason: string | null
          created_at: string
          group_id: string | null
          height: number
          id: string
          is_active: boolean
          is_blocked: boolean
          max_capacity: number
          min_capacity: number
          name: string
          org_id: string
          rotation: number
          shape: string
          sort_order: number
          updated_at: string
          width: number
          x_position: number | null
          y_position: number | null
          zone: string
        }
        Insert: {
          block_reason?: string | null
          created_at?: string
          group_id?: string | null
          height?: number
          id?: string
          is_active?: boolean
          is_blocked?: boolean
          max_capacity?: number
          min_capacity?: number
          name: string
          org_id: string
          rotation?: number
          shape?: string
          sort_order?: number
          updated_at?: string
          width?: number
          x_position?: number | null
          y_position?: number | null
          zone?: string
        }
        Update: {
          block_reason?: string | null
          created_at?: string
          group_id?: string | null
          height?: number
          id?: string
          is_active?: boolean
          is_blocked?: boolean
          max_capacity?: number
          min_capacity?: number
          name?: string
          org_id?: string
          rotation?: number
          shape?: string
          sort_order?: number
          updated_at?: string
          width?: number
          x_position?: number | null
          y_position?: number | null
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "res_tables_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      res_venue_spaces: {
        Row: {
          capacity_max: number | null
          capacity_min: number | null
          created_at: string
          description: string | null
          hire_type: string
          id: string
          is_active: boolean | null
          minimum_spend: number | null
          name: string
          org_id: string
          room_hire_fee: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          capacity_max?: number | null
          capacity_min?: number | null
          created_at?: string
          description?: string | null
          hire_type?: string
          id?: string
          is_active?: boolean | null
          minimum_spend?: number | null
          name: string
          org_id: string
          room_hire_fee?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          capacity_max?: number | null
          capacity_min?: number | null
          created_at?: string
          description?: string | null
          hire_type?: string
          id?: string
          is_active?: boolean | null
          minimum_spend?: number | null
          name?: string
          org_id?: string
          room_hire_fee?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      res_waitlist: {
        Row: {
          estimated_wait_minutes: number | null
          guest_name: string
          guest_phone: string | null
          id: string
          joined_at: string
          notified_at: string | null
          org_id: string
          party_size: number
          seated_at: string | null
          status: string
          table_id: string | null
        }
        Insert: {
          estimated_wait_minutes?: number | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          joined_at?: string
          notified_at?: string | null
          org_id: string
          party_size: number
          seated_at?: string | null
          status?: string
          table_id?: string | null
        }
        Update: {
          estimated_wait_minutes?: number | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          joined_at?: string
          notified_at?: string | null
          org_id?: string
          party_size?: number
          seated_at?: string | null
          status?: string
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "res_waitlist_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "res_waitlist_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "res_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      res_widget_config: {
        Row: {
          chat_agent_enabled: boolean
          created_at: string
          faq_answers: Json
          function_widget_enabled: boolean
          id: string
          is_active: boolean
          logo_url: string | null
          max_function_party_size: number
          max_online_party_size: number
          menu_sets: Json
          org_id: string
          org_slug: string
          primary_color: string
          slot_interval_minutes: number
          updated_at: string
          venue_name: string | null
          voice_agent_enabled: boolean
          welcome_message: string | null
        }
        Insert: {
          chat_agent_enabled?: boolean
          created_at?: string
          faq_answers?: Json
          function_widget_enabled?: boolean
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_function_party_size?: number
          max_online_party_size?: number
          menu_sets?: Json
          org_id: string
          org_slug: string
          primary_color?: string
          slot_interval_minutes?: number
          updated_at?: string
          venue_name?: string | null
          voice_agent_enabled?: boolean
          welcome_message?: string | null
        }
        Update: {
          chat_agent_enabled?: boolean
          created_at?: string
          faq_answers?: Json
          function_widget_enabled?: boolean
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_function_party_size?: number
          max_online_party_size?: number
          menu_sets?: Json
          org_id?: string
          org_slug?: string
          primary_color?: string
          slot_interval_minutes?: number
          updated_at?: string
          venue_name?: string | null
          voice_agent_enabled?: boolean
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "res_widget_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_shifts: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          end_time: string
          id: string
          notes: string | null
          org_id: string | null
          position: string | null
          start_time: string
          updated_at: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          end_time: string
          id?: string
          notes?: string | null
          org_id?: string | null
          position?: string | null
          start_time: string
          updated_at?: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          position?: string | null
          start_time?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          org_id: string
          shifts: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
          shifts?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          shifts?: Json
        }
        Relationships: [
          {
            foreignKeyName: "roster_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rosters: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          labour_budget: number | null
          org_id: string
          period_end: string
          period_start: string
          period_type: string | null
          published_at: string | null
          published_by: string | null
          section: string | null
          status: string | null
          template_id: string | null
          total_estimated_cost: number | null
          total_rostered_hours: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          labour_budget?: number | null
          org_id: string
          period_end: string
          period_start: string
          period_type?: string | null
          published_at?: string | null
          published_by?: string | null
          section?: string | null
          status?: string | null
          template_id?: string | null
          total_estimated_cost?: number | null
          total_rostered_hours?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          labour_budget?: number | null
          org_id?: string
          period_end?: string
          period_start?: string
          period_type?: string | null
          published_at?: string | null
          published_by?: string | null
          section?: string | null
          status?: string | null
          template_id?: string | null
          total_estimated_cost?: number | null
          total_rostered_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rosters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_timers: {
        Row: {
          alert_type: string
          category: string
          created_at: string
          created_by: string
          duration_seconds: number
          icon: string | null
          id: string
          label: string
          org_id: string
          station: string | null
          timer_type: string
          use_count: number
        }
        Insert: {
          alert_type?: string
          category?: string
          created_at?: string
          created_by: string
          duration_seconds: number
          icon?: string | null
          id?: string
          label: string
          org_id: string
          station?: string | null
          timer_type?: string
          use_count?: number
        }
        Update: {
          alert_type?: string
          category?: string
          created_at?: string
          created_by?: string
          duration_seconds?: number
          icon?: string | null
          id?: string
          label?: string
          org_id?: string
          station?: string | null
          timer_type?: string
          use_count?: number
        }
        Relationships: []
      }
      scenario_comparisons: {
        Row: {
          comparison_notes: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          org_id: string | null
          scenario_a_id: string | null
          scenario_b_id: string | null
          winner: string | null
        }
        Insert: {
          comparison_notes?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          org_id?: string | null
          scenario_a_id?: string | null
          scenario_b_id?: string | null
          winner?: string | null
        }
        Update: {
          comparison_notes?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          org_id?: string | null
          scenario_a_id?: string | null
          scenario_b_id?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_comparisons_scenario_a_id_fkey"
            columns: ["scenario_a_id"]
            isOneToOne: false
            referencedRelation: "simulation_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_comparisons_scenario_b_id_fkey"
            columns: ["scenario_b_id"]
            isOneToOne: false
            referencedRelation: "simulation_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      section_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string
          id: string
          org_id: string
          role: string
          section_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string
          id?: string
          org_id: string
          role?: string
          section_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          section_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "kitchen_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      section_stock_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          items: Json
          name: string
          org_id: string | null
          prep_tasks: Json
          section_id: string | null
          storage_locations: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          name: string
          org_id?: string | null
          prep_tasks?: Json
          section_id?: string | null
          storage_locations?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          name?: string
          org_id?: string | null
          prep_tasks?: Json
          section_id?: string | null
          storage_locations?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_stock_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_stock_templates_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "kitchen_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_events: {
        Row: {
          created_at: string
          id: string
          onboarding_step: string | null
          referral_code: string | null
          store_mode: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
          welcome_email_sent: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          onboarding_step?: string | null
          referral_code?: string | null
          store_mode?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
          welcome_email_sent?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          onboarding_step?: string | null
          referral_code?: string | null
          store_mode?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
          welcome_email_sent?: boolean | null
        }
        Relationships: []
      }
      simulation_results: {
        Row: {
          break_even_months: Json | null
          cash_flow_monthly: Json | null
          computed_at: string | null
          id: string
          insolvency_risk: Json | null
          org_id: string
          profit_distribution: Json | null
          risk_factors: Json | null
          run_number: number
          scenario_id: string
          sensitivity_ranking: Json | null
          solutions_applied: Json | null
          survival_probability: number | null
        }
        Insert: {
          break_even_months?: Json | null
          cash_flow_monthly?: Json | null
          computed_at?: string | null
          id?: string
          insolvency_risk?: Json | null
          org_id: string
          profit_distribution?: Json | null
          risk_factors?: Json | null
          run_number?: number
          scenario_id: string
          sensitivity_ranking?: Json | null
          solutions_applied?: Json | null
          survival_probability?: number | null
        }
        Update: {
          break_even_months?: Json | null
          cash_flow_monthly?: Json | null
          computed_at?: string | null
          id?: string
          insolvency_risk?: Json | null
          org_id?: string
          profit_distribution?: Json | null
          risk_factors?: Json | null
          run_number?: number
          scenario_id?: string
          sensitivity_ranking?: Json | null
          solutions_applied?: Json | null
          survival_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_results_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "simulation_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_scenarios: {
        Row: {
          correlations: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          iterations: number
          name: string
          notes: string | null
          org_id: string
          periods_months: number
          status: string
          type: string
          updated_at: string | null
          variables: Json
        }
        Insert: {
          correlations?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          iterations?: number
          name: string
          notes?: string | null
          org_id: string
          periods_months?: number
          status?: string
          type?: string
          updated_at?: string | null
          variables?: Json
        }
        Update: {
          correlations?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          iterations?: number
          name?: string
          notes?: string | null
          org_id?: string
          periods_months?: number
          status?: string
          type?: string
          updated_at?: string | null
          variables?: Json
        }
        Relationships: []
      }
      social_orders: {
        Row: {
          amount: number
          channel: string
          created_at: string
          id: string
          note: string | null
          order_date: string
          org_id: string
        }
        Insert: {
          amount: number
          channel: string
          created_at?: string
          id?: string
          note?: string | null
          order_date?: string
          org_id: string
        }
        Update: {
          amount?: number
          channel?: string
          created_at?: string
          id?: string
          note?: string | null
          order_date?: string
          org_id?: string
        }
        Relationships: []
      }
      solution_library: {
        Row: {
          category: string
          compliance_verified: boolean | null
          created_at: string | null
          description: string | null
          id: string
          impact_bev_cost_pct: number | null
          impact_food_cost_pct: number | null
          impact_labour_pct: number | null
          impact_overhead_dollar: number | null
          impact_revenue_pct: number | null
          implementation_difficulty: string | null
          is_active: boolean | null
          is_default: boolean | null
          name: string
          notes: string | null
          org_id: string | null
          target_variable: string
          time_to_effect_days: number | null
        }
        Insert: {
          category: string
          compliance_verified?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          impact_bev_cost_pct?: number | null
          impact_food_cost_pct?: number | null
          impact_labour_pct?: number | null
          impact_overhead_dollar?: number | null
          impact_revenue_pct?: number | null
          implementation_difficulty?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          notes?: string | null
          org_id?: string | null
          target_variable: string
          time_to_effect_days?: number | null
        }
        Update: {
          category?: string
          compliance_verified?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          impact_bev_cost_pct?: number | null
          impact_food_cost_pct?: number | null
          impact_labour_pct?: number | null
          impact_overhead_dollar?: number | null
          impact_revenue_pct?: number | null
          implementation_difficulty?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          notes?: string | null
          org_id?: string | null
          target_variable?: string
          time_to_effect_days?: number | null
        }
        Relationships: []
      }
      staff_availability: {
        Row: {
          available: boolean | null
          created_at: string
          day_of_week: number
          effective_from: string | null
          effective_to: string | null
          id: string
          max_hours: number | null
          notes: string | null
          org_id: string
          preferred_end: string | null
          preferred_start: string | null
          user_id: string
        }
        Insert: {
          available?: boolean | null
          created_at?: string
          day_of_week: number
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          max_hours?: number | null
          notes?: string | null
          org_id: string
          preferred_end?: string | null
          preferred_start?: string | null
          user_id: string
        }
        Update: {
          available?: boolean | null
          created_at?: string
          day_of_week?: number
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          max_hours?: number | null
          notes?: string | null
          org_id?: string
          preferred_end?: string | null
          preferred_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      staff_certifications: {
        Row: {
          cert_number: string | null
          cert_type: string
          created_at: string
          expiry_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          issuing_state: string | null
          notes: string | null
          org_id: string
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          cert_number?: string | null
          cert_type: string
          created_at?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuing_state?: string | null
          notes?: string | null
          org_id: string
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          cert_number?: string | null
          cert_type?: string
          created_at?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuing_state?: string | null
          notes?: string | null
          org_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_certifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_preferences: {
        Row: {
          created_at: string | null
          id: string
          notify_email: boolean | null
          notify_sms: boolean | null
          opt_in_extra_shifts: boolean | null
          org_id: string
          quiet_end: string | null
          quiet_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notify_email?: boolean | null
          notify_sms?: boolean | null
          opt_in_extra_shifts?: boolean | null
          org_id: string
          quiet_end?: string | null
          quiet_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notify_email?: boolean | null
          notify_sms?: boolean | null
          opt_in_extra_shifts?: boolean | null
          org_id?: string
          quiet_end?: string | null
          quiet_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string | null
          inventory_id: string | null
          movement_type: string
          notes: string | null
          org_id: string | null
          quantity_after: number | null
          quantity_before: number | null
          quantity_change: number
          recorded_by: string | null
          recorded_by_name: string | null
          source: string | null
          source_reference: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          inventory_id?: string | null
          movement_type: string
          notes?: string | null
          org_id?: string | null
          quantity_after?: number | null
          quantity_before?: number | null
          quantity_change: number
          recorded_by?: string | null
          recorded_by_name?: string | null
          source?: string | null
          source_reference?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          inventory_id?: string | null
          movement_type?: string
          notes?: string | null
          org_id?: string | null
          quantity_after?: number | null
          quantity_before?: number | null
          quantity_change?: number
          recorded_by?: string | null
          recorded_by_name?: string | null
          source?: string | null
          source_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stocktake_items: {
        Row: {
          counted_at: string | null
          counted_by: string | null
          counted_quantity: number | null
          created_at: string
          expected_quantity: number
          id: string
          ingredient_id: string | null
          ingredient_name: string
          inventory_id: string | null
          location: string | null
          notes: string | null
          stocktake_id: string
          unit: string
          variance: number | null
          variance_value: number | null
        }
        Insert: {
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity?: number | null
          created_at?: string
          expected_quantity?: number
          id?: string
          ingredient_id?: string | null
          ingredient_name: string
          inventory_id?: string | null
          location?: string | null
          notes?: string | null
          stocktake_id: string
          unit?: string
          variance?: number | null
          variance_value?: number | null
        }
        Update: {
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity?: number | null
          created_at?: string
          expected_quantity?: number
          id?: string
          ingredient_id?: string | null
          ingredient_name?: string
          inventory_id?: string | null
          location?: string | null
          notes?: string | null
          stocktake_id?: string
          unit?: string
          variance?: number | null
          variance_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stocktake_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_items_stocktake_id_fkey"
            columns: ["stocktake_id"]
            isOneToOne: false
            referencedRelation: "stocktakes"
            referencedColumns: ["id"]
          },
        ]
      }
      stocktakes: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          items_counted: number | null
          name: string
          notes: string | null
          org_id: string | null
          status: string
          stocktake_date: string
          stocktake_type: string
          total_items: number | null
          total_variance_value: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          items_counted?: number | null
          name: string
          notes?: string | null
          org_id?: string | null
          status?: string
          stocktake_date?: string
          stocktake_type?: string
          total_items?: number | null
          total_variance_value?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          items_counted?: number | null
          name?: string
          notes?: string | null
          org_id?: string | null
          status?: string
          stocktake_date?: string
          stocktake_type?: string
          total_items?: number | null
          total_variance_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocktakes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          account_number: string | null
          category: string
          created_at: string
          credit_status: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          org_id: string | null
          phone: string | null
          products: string | null
          rep_name: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_number?: string | null
          category?: string
          created_at?: string
          credit_status?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          products?: string | null
          rep_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_number?: string | null
          category?: string
          created_at?: string
          credit_status?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          products?: string | null
          rep_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          attachment_urls: string[] | null
          category: string
          created_at: string
          created_by: string
          created_by_name: string
          description: string
          id: string
          org_id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
        }
        Insert: {
          admin_response?: string | null
          attachment_urls?: string[] | null
          category?: string
          created_at?: string
          created_by: string
          created_by_name: string
          description: string
          id?: string
          org_id: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          admin_response?: string | null
          attachment_urls?: string[] | null
          category?: string
          created_at?: string
          created_by?: string
          created_by_name?: string
          description?: string
          id?: string
          org_id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_system_message: boolean | null
          task_id: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_system_message?: boolean | null
          task_id: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_system_message?: boolean | null
          task_id?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "kitchen_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
          venue_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          venue_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "org_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      team_posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          linked_prep_list_id: string | null
          org_id: string | null
          post_type: string
          updated_at: string
          user_avatar_url: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          linked_prep_list_id?: string | null
          org_id?: string | null
          post_type?: string
          updated_at?: string
          user_avatar_url?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          linked_prep_list_id?: string | null
          org_id?: string | null
          post_type?: string
          updated_at?: string
          user_avatar_url?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_posts_linked_prep_list_id_fkey"
            columns: ["linked_prep_list_id"]
            isOneToOne: false
            referencedRelation: "prep_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_posts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      temp_check_archives: {
        Row: {
          archived_at: string
          archived_by: string | null
          created_at: string
          fail_count: number | null
          id: string
          month: string
          org_id: string | null
          pass_count: number | null
          sheet_data: Json
          total_checks: number | null
          warning_count: number | null
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string
          fail_count?: number | null
          id?: string
          month: string
          org_id?: string | null
          pass_count?: number | null
          sheet_data?: Json
          total_checks?: number | null
          warning_count?: number | null
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string
          fail_count?: number | null
          id?: string
          month?: string
          org_id?: string | null
          pass_count?: number | null
          sheet_data?: Json
          total_checks?: number | null
          warning_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "temp_check_archives_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      temp_check_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          location_name: string
          location_type: string
          org_id: string | null
          shift: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          location_name: string
          location_type?: string
          org_id?: string | null
          shift?: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          location_name?: string
          location_type?: string
          org_id?: string | null
          shift?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "temp_check_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      test_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          failed: number
          id: string
          metadata: Json | null
          org_id: string | null
          passed: number
          results: Json
          run_by: string | null
          run_label: string | null
          run_type: string
          skipped: number
          started_at: string
          total_tests: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          failed?: number
          id?: string
          metadata?: Json | null
          org_id?: string | null
          passed?: number
          results?: Json
          run_by?: string | null
          run_label?: string | null
          run_type?: string
          skipped?: number
          started_at?: string
          total_tests?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          failed?: number
          id?: string
          metadata?: Json | null
          org_id?: string | null
          passed?: number
          results?: Json
          run_by?: string | null
          run_label?: string | null
          run_type?: string
          skipped?: number
          started_at?: string
          total_tests?: number
        }
        Relationships: []
      }
      timer_history: {
        Row: {
          actual_duration_seconds: number | null
          completed_at: string
          duration_seconds: number
          id: string
          label: string
          order_id: string | null
          org_id: string
          overdue_seconds: number
          recipe_id: string | null
          started_by: string | null
          station: string | null
          timer_id: string
          was_overdue: boolean
        }
        Insert: {
          actual_duration_seconds?: number | null
          completed_at?: string
          duration_seconds: number
          id?: string
          label: string
          order_id?: string | null
          org_id: string
          overdue_seconds?: number
          recipe_id?: string | null
          started_by?: string | null
          station?: string | null
          timer_id: string
          was_overdue?: boolean
        }
        Update: {
          actual_duration_seconds?: number | null
          completed_at?: string
          duration_seconds?: number
          id?: string
          label?: string
          order_id?: string | null
          org_id?: string
          overdue_seconds?: number
          recipe_id?: string | null
          started_by?: string | null
          station?: string | null
          timer_id?: string
          was_overdue?: boolean
        }
        Relationships: []
      }
      todo_items: {
        Row: {
          archived_at: string | null
          assigned_to_name: string | null
          category: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          org_id: string
          photo_note: string | null
          photo_url: string | null
          priority: string
          quantity: string | null
          section_id: string | null
          source_batch_code: string | null
          source_recipe_id: string | null
          source_type: string
          status: string
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assigned_to_name?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          org_id: string
          photo_note?: string | null
          photo_url?: string | null
          priority?: string
          quantity?: string | null
          section_id?: string | null
          source_batch_code?: string | null
          source_recipe_id?: string | null
          source_type?: string
          status?: string
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assigned_to_name?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          org_id?: string
          photo_note?: string | null
          photo_url?: string | null
          priority?: string
          quantity?: string | null
          section_id?: string | null
          source_batch_code?: string | null
          source_recipe_id?: string | null
          source_type?: string
          status?: string
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "kitchen_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_recurring_rules: {
        Row: {
          auto_assign_name: string | null
          auto_assign_to: string | null
          auto_delegate: boolean
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          org_id: string
          priority: string
          quantity: string | null
          recurrence_day_of_month: number | null
          recurrence_days: number[] | null
          recurrence_type: string
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          auto_assign_name?: string | null
          auto_assign_to?: string | null
          auto_delegate?: boolean
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          priority?: string
          quantity?: string | null
          recurrence_day_of_month?: number | null
          recurrence_days?: number[] | null
          recurrence_type?: string
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          auto_assign_name?: string | null
          auto_assign_to?: string | null
          auto_delegate?: boolean
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          priority?: string
          quantity?: string | null
          recurrence_day_of_month?: number | null
          recurrence_days?: number[] | null
          recurrence_type?: string
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_recurring_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          items: Json
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_completions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          org_id: string
          quiz_score: number | null
          sections_completed: Json
          training_type: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          org_id: string
          quiz_score?: number | null
          sections_completed?: Json
          training_type: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          org_id?: string
          quiz_score?: number | null
          sections_completed?: Json
          training_type?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_completions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_materials: {
        Row: {
          category: string
          content: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          file_url: string | null
          id: string
          org_id: string | null
          required_for: string[] | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          org_id?: string | null
          required_for?: string[] | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          org_id?: string | null
          required_for?: string[] | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_materials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_records: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          material_id: string
          notes: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          material_id: string
          notes?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          material_id?: string
          notes?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_records_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "training_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_seen_releases: {
        Row: {
          id: string
          release_id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          id?: string
          release_id: string
          seen_at?: string
          user_id: string
        }
        Update: {
          id?: string
          release_id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_seen_releases_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "feature_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_deals: {
        Row: {
          applicable_categories: string[] | null
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          end_date: string
          id: string
          is_active: boolean | null
          min_order_value: number | null
          start_date: string
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          applicable_categories?: string[] | null
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          end_date: string
          id?: string
          is_active?: boolean | null
          min_order_value?: number | null
          start_date?: string
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          applicable_categories?: string[] | null
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          min_order_value?: number | null
          start_date?: string
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_deals_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_messages: {
        Row: {
          chef_user_id: string
          created_at: string
          id: string
          message: string
          order_id: string | null
          read_at: string | null
          sender_id: string
          sender_type: string
          vendor_id: string
        }
        Insert: {
          chef_user_id: string
          created_at?: string
          id?: string
          message: string
          order_id?: string | null
          read_at?: string | null
          sender_id: string
          sender_type: string
          vendor_id: string
        }
        Update: {
          chef_user_id?: string
          created_at?: string
          id?: string
          message?: string
          order_id?: string | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_messages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_orders: {
        Row: {
          chef_user_id: string
          created_at: string
          delivery_address: string | null
          delivery_date: string | null
          delivery_fee: number | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          status: string | null
          subtotal: number
          total: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          chef_user_id: string
          created_at?: string
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_fee?: number | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          chef_user_id?: string
          created_at?: string
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_fee?: number | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_pricing: {
        Row: {
          category: string | null
          created_at: string
          id: string
          ingredient_name: string
          is_available: boolean | null
          lead_time_days: number | null
          max_order_quantity: number | null
          min_order_quantity: number | null
          notes: string | null
          price_per_unit: number
          unit: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          ingredient_name: string
          is_available?: boolean | null
          lead_time_days?: number | null
          max_order_quantity?: number | null
          min_order_quantity?: number | null
          notes?: string | null
          price_per_unit: number
          unit?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          ingredient_name?: string
          is_available?: boolean | null
          lead_time_days?: number | null
          max_order_quantity?: number | null
          min_order_quantity?: number | null
          notes?: string | null
          price_per_unit?: number
          unit?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_pricing_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          abn: string | null
          address: string | null
          business_name: string
          categories: string[] | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          delivery_areas: string[] | null
          id: string
          logo_url: string | null
          postcode: string | null
          status: string | null
          updated_at: string
          user_id: string
          vendor_type: string
        }
        Insert: {
          abn?: string | null
          address?: string | null
          business_name: string
          categories?: string[] | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          delivery_areas?: string[] | null
          id?: string
          logo_url?: string | null
          postcode?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          vendor_type?: string
        }
        Update: {
          abn?: string | null
          address?: string | null
          business_name?: string
          categories?: string[] | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          delivery_areas?: string[] | null
          id?: string
          logo_url?: string | null
          postcode?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          vendor_type?: string
        }
        Relationships: []
      }
      vendor_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["vendor_role"]
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["vendor_role"]
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["vendor_role"]
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_roles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_logs: {
        Row: {
          cost: number
          created_at: string
          id: string
          item_id: string | null
          item_name: string
          item_type: string
          logged_by: string
          logged_by_name: string
          module: string
          notes: string | null
          org_id: string
          quantity: number
          reason: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shift_date: string
          status: string
          unit: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          item_id?: string | null
          item_name: string
          item_type?: string
          logged_by: string
          logged_by_name?: string
          module: string
          notes?: string | null
          org_id: string
          quantity?: number
          reason?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_date?: string
          status?: string
          unit?: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          item_id?: string | null
          item_name?: string
          item_type?: string
          logged_by?: string
          logged_by_name?: string
          module?: string
          notes?: string | null
          org_id?: string
          quantity?: number
          reason?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_date?: string
          status?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_journal_queue: {
        Row: {
          created_at: string
          entries: Json
          error: string | null
          id: string
          journal_date: string
          org_id: string
          status: string
          updated_at: string
          xero_journal_id: string | null
        }
        Insert: {
          created_at?: string
          entries?: Json
          error?: string | null
          id?: string
          journal_date: string
          org_id: string
          status?: string
          updated_at?: string
          xero_journal_id?: string | null
        }
        Update: {
          created_at?: string
          entries?: Json
          error?: string | null
          id?: string
          journal_date?: string
          org_id?: string
          status?: string
          updated_at?: string
          xero_journal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xero_journal_queue_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      yield_tests: {
        Row: {
          category: string
          cost_per_portion: number | null
          cost_per_unit: number
          created_at: string
          gross_weight: number
          gross_weight_unit: string
          id: string
          item_name: string
          notes: string | null
          org_id: string | null
          portion_size: number | null
          portion_unit: string | null
          portions_count: number | null
          prepped_by: string | null
          prepped_by_user_id: string | null
          recipe_id: string | null
          target_yield_percent: number | null
          test_date: string
          total_cost: number | null
          updated_at: string
          usable_cost_per_unit: number | null
          usable_weight: number
          waste_weight: number
          yield_percent: number | null
        }
        Insert: {
          category?: string
          cost_per_portion?: number | null
          cost_per_unit?: number
          created_at?: string
          gross_weight?: number
          gross_weight_unit?: string
          id?: string
          item_name: string
          notes?: string | null
          org_id?: string | null
          portion_size?: number | null
          portion_unit?: string | null
          portions_count?: number | null
          prepped_by?: string | null
          prepped_by_user_id?: string | null
          recipe_id?: string | null
          target_yield_percent?: number | null
          test_date?: string
          total_cost?: number | null
          updated_at?: string
          usable_cost_per_unit?: number | null
          usable_weight?: number
          waste_weight?: number
          yield_percent?: number | null
        }
        Update: {
          category?: string
          cost_per_portion?: number | null
          cost_per_unit?: number
          created_at?: string
          gross_weight?: number
          gross_weight_unit?: string
          id?: string
          item_name?: string
          notes?: string | null
          org_id?: string | null
          portion_size?: number | null
          portion_unit?: string | null
          portions_count?: number | null
          prepped_by?: string | null
          prepped_by_user_id?: string | null
          recipe_id?: string | null
          target_yield_percent?: number | null
          test_date?: string
          total_cost?: number | null
          updated_at?: string
          usable_cost_per_unit?: number | null
          usable_weight?: number
          waste_weight?: number
          yield_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "yield_tests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yield_tests_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      referral_codes_public: {
        Row: {
          code: string | null
          is_active: boolean | null
        }
        Insert: {
          code?: string | null
          is_active?: boolean | null
        }
        Update: {
          code?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      res_settings_public: {
        Row: {
          operating_hours: Json | null
          org_id: string | null
        }
        Insert: {
          operating_hours?: Json | null
          org_id?: string | null
        }
        Update: {
          operating_hours?: Json | null
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "res_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_nuke_orgs: { Args: { p_org_ids: string[] }; Returns: number }
      archive_menu: { Args: { p_menu_id: string }; Returns: Json }
      batch_create_menu_recipes: {
        Args: { p_menu_id: string }
        Returns: number
      }
      batch_insert_menu_items: {
        Args: { p_items: Json; p_menu_id: string }
        Returns: number
      }
      create_and_activate_menu: {
        Args: { p_name: string; p_org_id: string }
        Returns: string
      }
      get_invite_by_token: {
        Args: { _token: string }
        Returns: {
          accepted_at: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_invite_details: {
        Args: { _token: string }
        Returns: {
          accepted_at: string
          email: string
          expires_at: string
          invite_id: string
          inviter_name: string
          org_cover_image_url: string
          org_id: string
          org_logo_url: string
          org_name: string
          org_welcome_message: string
          role: Database["public"]["Enums"]["app_role"]
          venue_name: string
        }[]
      }
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_primary_org_id: { Args: { _user_id: string }; Returns: string }
      get_user_sections: {
        Args: { _user_id: string }
        Returns: {
          role: string
          section_id: string
        }[]
      }
      get_vendor_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_bar_manager: { Args: { uid: string }; Returns: boolean }
      is_head_chef: { Args: { _user_id: string }; Returns: boolean }
      is_org_head_chef: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_section_leader: {
        Args: { _section_id: string; _user_id: string }
        Returns: boolean
      }
      is_vendor: { Args: { _user_id: string }; Returns: boolean }
      refresh_demand_insights: { Args: never; Returns: number }
      sync_inventory_from_ingredients: { Args: never; Returns: number }
      unarchive_menu: { Args: { p_menu_id: string }; Returns: Json }
      verify_pos_pin: {
        Args: { _org_id: string; _pin: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "head_chef"
        | "line_chef"
        | "admin"
        | "owner"
        | "bar_manager"
        | "asst_bar_manager"
        | "senior_bartender"
        | "bartender"
        | "barback"
        | "barista"
        | "sous_chef"
        | "kitchen_hand"
      vendor_role: "vendor_admin" | "vendor_staff"
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
      app_role: [
        "head_chef",
        "line_chef",
        "admin",
        "owner",
        "bar_manager",
        "asst_bar_manager",
        "senior_bartender",
        "bartender",
        "barback",
        "barista",
        "sous_chef",
        "kitchen_hand",
      ],
      vendor_role: ["vendor_admin", "vendor_staff"],
    },
  },
} as const
