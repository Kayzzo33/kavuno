export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "staff" | "admin";
export type CommercialMode = "in_stock" | "pre_order" | "interest_lead";
export type CampaignStatus = "draft" | "active" | "completed" | "cancelled";
export type FilamentMaterial =
  | "pla"
  | "petg"
  | "abs"
  | "asa"
  | "tpu"
  | "pc"
  | "nylon"
  | "other";
export type OrderStatus =
  | "pending_payment"
  | "payment_approved"
  | "in_production"
  | "ready_for_dispatch"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type PaymentStatus =
  | "pending"
  | "in_process"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";
export type PaymentMethod = "pix" | "credit_card" | "bank_slip" | "other";
export type SpoolStatus = "sealed" | "in_use" | "empty" | "discarded" | "lost";
export type ProductionStatus =
  | "queued"
  | "slicing"
  | "printing"
  | "post_processing"
  | "quality_check"
  | "completed"
  | "failed";
export type InventoryMovementType =
  | "purchase_in"
  | "sale_out"
  | "adjustment_in"
  | "adjustment_out"
  | "loss_discard"
  | "return_in";

export type SpoolMovementType =
  | "production_consumption"
  | "waste_discard"
  | "manual_adjustment"
  | "initial_weight"
  | "weigh_in";

export type ProductionCostType =
  | "filament"
  | "packaging"
  | "labor"
  | "energy"
  | "machine_time"
  | "other";

export type FinancialTransactionType = "income" | "expense" | "refund" | "transfer";
export type FinancialTransactionStatus = "pending" | "cleared" | "cancelled" | "refunded";
export type AccountPayableStatus = "pending" | "paid" | "cancelled" | "overdue";
export type AccountReceivableStatus = "pending" | "received" | "cancelled" | "disputed";
export type ReconciliationStatus = "open" | "reconciled" | "flagged";

export type AnalyticsEventName =
  | "product_view"
  | "search"
  | "search_no_results"
  | "filter_applied"
  | "variant_select"
  | "banner_view"
  | "banner_click"
  | "cart_add"
  | "cart_remove"
  | "checkout_start"
  | "coupon_applied"
  | "lead_created"
  | "order_created"
  | "payment_confirmed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          cpf_cnpj: string | null;
          phone: string | null;
          role: UserRole;
          marketing_consent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          cpf_cnpj?: string | null;
          phone?: string | null;
          role?: UserRole;
          marketing_consent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          cpf_cnpj?: string | null;
          phone?: string | null;
          role?: UserRole;
          marketing_consent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_addresses: {
        Row: {
          id: string;
          profile_id: string;
          recipient_name: string;
          street: string;
          number: string;
          complement: string | null;
          neighborhood: string;
          city: string;
          state: string;
          postal_code: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          recipient_name: string;
          street: string;
          number: string;
          complement?: string | null;
          neighborhood: string;
          city: string;
          state: string;
          postal_code: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          recipient_name?: string;
          street?: string;
          number?: string;
          complement?: string | null;
          neighborhood?: string;
          city?: string;
          state?: string;
          postal_code?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_addresses_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      campaigns: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          commercial_mode: CommercialMode;
          status: CampaignStatus;
          target_min_units: number;
          max_units_limit: number | null;
          current_units_pledged: number;
          starts_at: string | null;
          ends_at: string | null;
          estimated_production_days: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          commercial_mode: CommercialMode;
          status?: CampaignStatus;
          target_min_units?: number;
          max_units_limit?: number | null;
          current_units_pledged?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          estimated_production_days?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          commercial_mode?: CommercialMode;
          status?: CampaignStatus;
          target_min_units?: number;
          max_units_limit?: number | null;
          current_units_pledged?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          estimated_production_days?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          campaign_id: string | null;
          name: string;
          slug: string;
          short_description: string | null;
          full_description: string | null;
          commercial_mode: CommercialMode;
          base_price: number;
          promotional_price: number | null;
          is_active: boolean;
          is_featured: boolean;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          campaign_id?: string | null;
          name: string;
          slug: string;
          short_description?: string | null;
          full_description?: string | null;
          commercial_mode?: CommercialMode;
          base_price: number;
          promotional_price?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          campaign_id?: string | null;
          name?: string;
          slug?: string;
          short_description?: string | null;
          full_description?: string | null;
          commercial_mode?: CommercialMode;
          base_price?: number;
          promotional_price?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          }
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          variant_name: string;
          filament_material: FilamentMaterial;
          color_name: string;
          color_hex: string | null;
          price_adjustment: number;
          estimated_filament_weight_g: number;
          estimated_print_time_minutes: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          variant_name: string;
          filament_material?: FilamentMaterial;
          color_name: string;
          color_hex?: string | null;
          price_adjustment?: number;
          estimated_filament_weight_g?: number;
          estimated_print_time_minutes?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          variant_name?: string;
          filament_material?: FilamentMaterial;
          color_name?: string;
          color_hex?: string | null;
          price_adjustment?: number;
          estimated_filament_weight_g?: number;
          estimated_print_time_minutes?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          image_url: string;
          alt_text: string | null;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          image_url: string;
          alt_text?: string | null;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          image_url?: string;
          alt_text?: string | null;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_variant_id_fkey";
            columns: ["variant_id"];
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
      };
      interest_leads: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          campaign_id: string | null;
          full_name: string;
          email: string;
          whatsapp_phone: string | null;
          notes: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          campaign_id?: string | null;
          full_name: string;
          email: string;
          whatsapp_phone?: string | null;
          notes?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          campaign_id?: string | null;
          full_name?: string;
          email?: string;
          whatsapp_phone?: string | null;
          notes?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interest_leads_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interest_leads_variant_id_fkey";
            columns: ["variant_id"];
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interest_leads_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_profile_id: string | null;
          action: string;
          table_name: string;
          record_id: string;
          previous_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_profile_id?: string | null;
          action: string;
          table_name: string;
          record_id: string;
          previous_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_profile_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string;
          previous_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: "percentage" | "fixed_amount" | "free_shipping";
          discount_value: number;
          min_order_amount: number;
          max_discount_amount: number | null;
          max_uses: number | null;
          current_uses: number;
          starts_at: string;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: "percentage" | "fixed_amount" | "free_shipping";
          discount_value: number;
          min_order_amount?: number;
          max_discount_amount?: number | null;
          max_uses?: number | null;
          current_uses?: number;
          starts_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          discount_type?: "percentage" | "fixed_amount" | "free_shipping";
          discount_value?: number;
          min_order_amount?: number;
          max_discount_amount?: number | null;
          max_uses?: number | null;
          current_uses?: number;
          starts_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          variant_id: string;
          quantity_available: number;
          quantity_reserved: number;
          min_safety_stock: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          quantity_available?: number;
          quantity_reserved?: number;
          min_safety_stock?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          quantity_available?: number;
          quantity_reserved?: number;
          min_safety_stock?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_variant_id_fkey";
            columns: ["variant_id"];
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory_movements: {
        Row: {
          id: string;
          variant_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          reference_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          reference_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          movement_type?: InventoryMovementType;
          quantity?: number;
          reference_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_variant_id_fkey";
            columns: ["variant_id"];
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          idempotency_key: string | null;
          profile_id: string | null;
          guest_email: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          status: OrderStatus;
          subtotal: number;
          shipping_cost: number;
          discount_amount: number;
          total_amount: number;
          coupon_id: string | null;
          coupon_code_snapshot: string | null;
          carrier_name: string | null;
          delivery_service: string | null;
          estimated_delivery_days: number | null;
          tracking_code: string | null;
          shipping_street: string;
          shipping_number: string;
          shipping_complement: string | null;
          shipping_neighborhood: string;
          shipping_city: string;
          shipping_state: string;
          shipping_postal_code: string;
          customer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          idempotency_key?: string | null;
          profile_id?: string | null;
          guest_email?: string | null;
          guest_name?: string | null;
          guest_phone?: string | null;
          status?: OrderStatus;
          subtotal: number;
          shipping_cost?: number;
          discount_amount?: number;
          total_amount: number;
          coupon_id?: string | null;
          coupon_code_snapshot?: string | null;
          carrier_name?: string | null;
          delivery_service?: string | null;
          estimated_delivery_days?: number | null;
          tracking_code?: string | null;
          shipping_street: string;
          shipping_number: string;
          shipping_complement?: string | null;
          shipping_neighborhood: string;
          shipping_city: string;
          shipping_state: string;
          shipping_postal_code: string;
          customer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          idempotency_key?: string | null;
          profile_id?: string | null;
          guest_email?: string | null;
          guest_name?: string | null;
          guest_phone?: string | null;
          status?: OrderStatus;
          subtotal?: number;
          shipping_cost?: number;
          discount_amount?: number;
          total_amount?: number;
          coupon_id?: string | null;
          coupon_code_snapshot?: string | null;
          carrier_name?: string | null;
          delivery_service?: string | null;
          estimated_delivery_days?: number | null;
          tracking_code?: string | null;
          shipping_street?: string;
          shipping_number?: string;
          shipping_complement?: string | null;
          shipping_neighborhood?: string;
          shipping_city?: string;
          shipping_state?: string;
          shipping_postal_code?: string;
          customer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          commercial_mode: CommercialMode;
          product_name_snapshot: string;
          variant_name_snapshot: string;
          sku_snapshot: string;
          unit_price: number;
          quantity: number;
          total_price: number;
          campaign_id: string | null;
          estimated_production_days: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          commercial_mode: CommercialMode;
          product_name_snapshot: string;
          variant_name_snapshot: string;
          sku_snapshot: string;
          unit_price: number;
          quantity: number;
          total_price: number;
          campaign_id?: string | null;
          estimated_production_days?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          commercial_mode?: CommercialMode;
          product_name_snapshot?: string;
          variant_name_snapshot?: string;
          sku_snapshot?: string;
          unit_price?: number;
          quantity?: number;
          total_price?: number;
          campaign_id?: string | null;
          estimated_production_days?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          payment_method: PaymentMethod;
          status: PaymentStatus;
          amount: number;
          gateway: string;
          external_payment_id: string | null;
          idempotency_key: string | null;
          qr_code: string | null;
          qr_code_base64: string | null;
          ticket_url: string | null;
          installments: number;
          payment_response: Json | null;
          paid_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          payment_method: PaymentMethod;
          status?: PaymentStatus;
          amount: number;
          gateway?: string;
          external_payment_id?: string | null;
          idempotency_key?: string | null;
          qr_code?: string | null;
          qr_code_base64?: string | null;
          ticket_url?: string | null;
          installments?: number;
          payment_response?: Json | null;
          paid_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          payment_method?: PaymentMethod;
          status?: PaymentStatus;
          amount?: number;
          gateway?: string;
          external_payment_id?: string | null;
          idempotency_key?: string | null;
          qr_code?: string | null;
          qr_code_base64?: string | null;
          ticket_url?: string | null;
          installments?: number;
          payment_response?: Json | null;
          paid_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_webhook_logs: {
        Row: {
          id: string;
          gateway: string;
          event_type: string;
          external_event_id: string | null;
          signature_header: string | null;
          payload: Json;
          processed: boolean;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gateway?: string;
          event_type: string;
          external_event_id?: string | null;
          signature_header?: string | null;
          payload: Json;
          processed?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          gateway?: string;
          event_type?: string;
          external_event_id?: string | null;
          signature_header?: string | null;
          payload?: Json;
          processed?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      order_history: {
        Row: {
          id: string;
          order_id: string;
          previous_status: OrderStatus | null;
          new_status: OrderStatus;
          actor_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          previous_status?: OrderStatus | null;
          new_status: OrderStatus;
          actor_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          previous_status?: OrderStatus | null;
          new_status?: OrderStatus;
          actor_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      filament_spools: {
        Row: {
          id: string;
          label: string;
          batch_number: string | null;
          material: FilamentMaterial;
          color_name: string;
          color_hex: string | null;
          manufacturer: string | null;
          purchase_cost: number;
          allocated_shipping_cost: number;
          total_acquisition_cost: number;
          gross_weight_g: number;
          tare_weight_g: number;
          initial_net_weight_g: number;
          current_weight_g: number;
          cost_per_gram: number;
          status: SpoolStatus;
          supplier_invoice: string | null;
          notes: string | null;
          purchased_at: string | null;
          opened_at: string | null;
          finished_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          batch_number?: string | null;
          material?: FilamentMaterial;
          color_name: string;
          color_hex?: string | null;
          manufacturer?: string | null;
          purchase_cost: number;
          allocated_shipping_cost?: number;
          gross_weight_g: number;
          tare_weight_g?: number;
          current_weight_g: number;
          status?: SpoolStatus;
          supplier_invoice?: string | null;
          notes?: string | null;
          purchased_at?: string | null;
          opened_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          batch_number?: string | null;
          material?: FilamentMaterial;
          color_name?: string;
          color_hex?: string | null;
          manufacturer?: string | null;
          purchase_cost?: number;
          allocated_shipping_cost?: number;
          gross_weight_g?: number;
          tare_weight_g?: number;
          current_weight_g?: number;
          status?: SpoolStatus;
          supplier_invoice?: string | null;
          notes?: string | null;
          purchased_at?: string | null;
          opened_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      filament_spool_movements: {
        Row: {
          id: string;
          spool_id: string;
          movement_type: SpoolMovementType;
          quantity_g: number;
          weight_before_g: number;
          weight_after_g: number;
          production_order_id: string | null;
          reference_note: string | null;
          actor_profile_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          spool_id: string;
          movement_type: SpoolMovementType;
          quantity_g: number;
          weight_before_g: number;
          weight_after_g: number;
          production_order_id?: string | null;
          reference_note?: string | null;
          actor_profile_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          spool_id?: string;
          movement_type?: SpoolMovementType;
          quantity_g?: number;
          weight_before_g?: number;
          weight_after_g?: number;
          production_order_id?: string | null;
          reference_note?: string | null;
          actor_profile_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "filament_spool_movements_spool_id_fkey";
            columns: ["spool_id"];
            isOneToOne: false;
            referencedRelation: "filament_spools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "filament_spool_movements_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      production_orders: {
        Row: {
          id: string;
          order_number: string;
          product_id: string;
          variant_id: string;
          sales_order_id: string | null;
          planned_quantity: number;
          produced_quantity: number;
          rejected_quantity: number;
          estimated_filament_g: number;
          actual_filament_g: number;
          waste_filament_g: number;
          estimated_machine_minutes: number;
          actual_machine_minutes: number;
          labor_minutes: number;
          status: ProductionStatus;
          queued_at: string;
          started_at: string | null;
          completed_at: string | null;
          reprint_count: number;
          failure_notes: string | null;
          notes: string | null;
          adjustment_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          product_id: string;
          variant_id: string;
          sales_order_id?: string | null;
          planned_quantity: number;
          produced_quantity?: number;
          rejected_quantity?: number;
          estimated_filament_g?: number;
          actual_filament_g?: number;
          waste_filament_g?: number;
          estimated_machine_minutes?: number;
          actual_machine_minutes?: number;
          labor_minutes?: number;
          status?: ProductionStatus;
          queued_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          reprint_count?: number;
          failure_notes?: string | null;
          notes?: string | null;
          adjustment_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          product_id?: string;
          variant_id?: string;
          sales_order_id?: string | null;
          planned_quantity?: number;
          produced_quantity?: number;
          rejected_quantity?: number;
          estimated_filament_g?: number;
          actual_filament_g?: number;
          waste_filament_g?: number;
          estimated_machine_minutes?: number;
          actual_machine_minutes?: number;
          labor_minutes?: number;
          status?: ProductionStatus;
          queued_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          reprint_count?: number;
          failure_notes?: string | null;
          notes?: string | null;
          adjustment_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "production_orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_orders_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_orders_sales_order_id_fkey";
            columns: ["sales_order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      production_order_spools: {
        Row: {
          id: string;
          production_order_id: string;
          spool_id: string;
          consumed_g: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          production_order_id: string;
          spool_id: string;
          consumed_g?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          production_order_id?: string;
          spool_id?: string;
          consumed_g?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "production_order_spools_production_order_id_fkey";
            columns: ["production_order_id"];
            isOneToOne: false;
            referencedRelation: "production_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_order_spools_spool_id_fkey";
            columns: ["spool_id"];
            isOneToOne: false;
            referencedRelation: "filament_spools";
            referencedColumns: ["id"];
          }
        ];
      };
      production_order_costs: {
        Row: {
          id: string;
          production_order_id: string;
          cost_type: ProductionCostType;
          description: string | null;
          estimated_amount: number;
          actual_amount: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          production_order_id: string;
          cost_type: ProductionCostType;
          description?: string | null;
          estimated_amount?: number;
          actual_amount?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          production_order_id?: string;
          cost_type?: ProductionCostType;
          description?: string | null;
          estimated_amount?: number;
          actual_amount?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "production_order_costs_production_order_id_fkey";
            columns: ["production_order_id"];
            isOneToOne: false;
            referencedRelation: "production_orders";
            referencedColumns: ["id"];
          }
        ];
      };

      // --- MIGRATION 05: FINANCE MODULE TABLES ---
      financial_settings: {
        Row: {
          id: string;
          singleton_key: string;
          electricity_kwh_rate: number | null;
          electricity_provider_name: string | null;
          labor_hourly_rate: number | null;
          default_gateway_pix_fee_pct: number;
          default_gateway_card_fee_pct: number;
          default_gateway_fixed_fee: number;
          default_packaging_cost: number;
          target_markup_multiplier: number;
          notes: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          singleton_key?: string;
          electricity_kwh_rate?: number | null;
          electricity_provider_name?: string | null;
          labor_hourly_rate?: number | null;
          default_gateway_pix_fee_pct?: number;
          default_gateway_card_fee_pct?: number;
          default_gateway_fixed_fee?: number;
          default_packaging_cost?: number;
          target_markup_multiplier?: number;
          notes?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          singleton_key?: string;
          electricity_kwh_rate?: number | null;
          electricity_provider_name?: string | null;
          labor_hourly_rate?: number | null;
          default_gateway_pix_fee_pct?: number;
          default_gateway_card_fee_pct?: number;
          default_gateway_fixed_fee?: number;
          default_packaging_cost?: number;
          target_markup_multiplier?: number;
          notes?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      expense_categories: {
        Row: {
          id: string;
          code: string;
          name: string;
          dre_classification: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          dre_classification: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          dre_classification?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      financial_assets: {
        Row: {
          id: string;
          asset_tag: string;
          name: string;
          brand: string | null;
          model: string | null;
          purchase_cost: number;
          shipping_cost: number;
          total_acquisition_cost: number;
          useful_life_hours: number;
          depreciation_rate_per_hour: number;
          nominal_power_watts: number;
          status: string;
          purchased_at: string | null;
          supplier_invoice: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asset_tag: string;
          name: string;
          brand?: string | null;
          model?: string | null;
          purchase_cost: number;
          shipping_cost?: number;
          useful_life_hours: number;
          nominal_power_watts?: number;
          status?: string;
          purchased_at?: string | null;
          supplier_invoice?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          asset_tag?: string;
          name?: string;
          brand?: string | null;
          model?: string | null;
          purchase_cost?: number;
          shipping_cost?: number;
          useful_life_hours?: number;
          nominal_power_watts?: number;
          status?: string;
          purchased_at?: string | null;
          supplier_invoice?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      financial_reconciliations: {
        Row: {
          id: string;
          period_start: string;
          period_end: string;
          gateway: string;
          total_orders_amount: number;
          total_gateway_fees: number;
          total_net_cleared: number;
          total_refunds: number;
          discrepancy_amount: number;
          status: ReconciliationStatus;
          actor_profile_id: string | null;
          notes: string | null;
          reconciled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          period_start: string;
          period_end: string;
          gateway?: string;
          total_orders_amount?: number;
          total_gateway_fees?: number;
          total_net_cleared?: number;
          total_refunds?: number;
          discrepancy_amount?: number;
          status?: ReconciliationStatus;
          actor_profile_id?: string | null;
          notes?: string | null;
          reconciled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          period_start?: string;
          period_end?: string;
          gateway?: string;
          total_orders_amount?: number;
          total_gateway_fees?: number;
          total_net_cleared?: number;
          total_refunds?: number;
          discrepancy_amount?: number;
          status?: ReconciliationStatus;
          actor_profile_id?: string | null;
          notes?: string | null;
          reconciled_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financial_reconciliations_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      financial_transactions: {
        Row: {
          id: string;
          idempotency_key: string;
          transaction_type: FinancialTransactionType;
          category_id: string | null;
          gross_amount: number;
          fee_amount: number;
          net_amount: number;
          accrual_date: string;
          cleared_at: string | null;
          status: FinancialTransactionStatus;
          source_type: string;
          source_id: string | null;
          reconciliation_id: string | null;
          description: string;
          payment_method: PaymentMethod | null;
          notes: string | null;
          actor_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          idempotency_key: string;
          transaction_type: FinancialTransactionType;
          category_id?: string | null;
          gross_amount: number;
          fee_amount?: number;
          net_amount: number;
          accrual_date: string;
          cleared_at?: string | null;
          status?: FinancialTransactionStatus;
          source_type: string;
          source_id?: string | null;
          reconciliation_id?: string | null;
          description: string;
          payment_method?: PaymentMethod | null;
          notes?: string | null;
          actor_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          idempotency_key?: string;
          transaction_type?: FinancialTransactionType;
          category_id?: string | null;
          gross_amount?: number;
          fee_amount?: number;
          net_amount?: number;
          accrual_date?: string;
          cleared_at?: string | null;
          status?: FinancialTransactionStatus;
          source_type?: string;
          source_id?: string | null;
          reconciliation_id?: string | null;
          description?: string;
          payment_method?: PaymentMethod | null;
          notes?: string | null;
          actor_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "expense_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_transactions_reconciliation_id_fkey";
            columns: ["reconciliation_id"];
            isOneToOne: false;
            referencedRelation: "financial_reconciliations";
            referencedColumns: ["id"];
          }
        ];
      };

      accounts_payable: {
        Row: {
          id: string;
          category_id: string | null;
          description: string;
          due_date: string;
          original_amount: number;
          paid_amount: number;
          discount_amount: number;
          penalty_amount: number;
          status: AccountPayableStatus;
          paid_at: string | null;
          recipient_name: string | null;
          invoice_number: string | null;
          source_type: string | null;
          source_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          description: string;
          due_date: string;
          original_amount: number;
          paid_amount?: number;
          discount_amount?: number;
          penalty_amount?: number;
          status?: AccountPayableStatus;
          paid_at?: string | null;
          recipient_name?: string | null;
          invoice_number?: string | null;
          source_type?: string | null;
          source_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          description?: string;
          due_date?: string;
          original_amount?: number;
          paid_amount?: number;
          discount_amount?: number;
          penalty_amount?: number;
          status?: AccountPayableStatus;
          paid_at?: string | null;
          recipient_name?: string | null;
          invoice_number?: string | null;
          source_type?: string | null;
          source_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_payable_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "expense_categories";
            referencedColumns: ["id"];
          }
        ];
      };

      accounts_receivable: {
        Row: {
          id: string;
          order_id: string | null;
          payment_id: string | null;
          description: string;
          expected_clearance_date: string;
          gross_amount: number;
          estimated_fee: number;
          net_expected_amount: number;
          received_net_amount: number;
          status: AccountReceivableStatus;
          cleared_at: string | null;
          gateway_settlement_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          payment_id?: string | null;
          description: string;
          expected_clearance_date: string;
          gross_amount: number;
          estimated_fee?: number;
          received_net_amount?: number;
          status?: AccountReceivableStatus;
          cleared_at?: string | null;
          gateway_settlement_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          payment_id?: string | null;
          description?: string;
          expected_clearance_date?: string;
          gross_amount?: number;
          estimated_fee?: number;
          received_net_amount?: number;
          status?: AccountReceivableStatus;
          cleared_at?: string | null;
          gateway_settlement_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accounts_receivable_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          }
        ];
      };

      product_cost_snapshots: {
        Row: {
          id: string;
          variant_id: string;
          production_order_id: string | null;
          calculation_type: "estimated_catalog" | "actual_production";
          filament_cost: number;
          electricity_cost: number;
          machine_depreciation_cost: number;
          packaging_cost: number;
          labor_cost: number;
          other_direct_cost: number;
          total_unit_cost: number;
          unit_sale_price: number;
          gross_margin_amount: number;
          gross_margin_percent: number;
          is_telemetry_missing: boolean;
          missing_parameters_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          production_order_id?: string | null;
          calculation_type: "estimated_catalog" | "actual_production";
          filament_cost?: number;
          electricity_cost?: number;
          machine_depreciation_cost?: number;
          packaging_cost?: number;
          labor_cost?: number;
          other_direct_cost?: number;
          unit_sale_price: number;
          gross_margin_amount: number;
          gross_margin_percent: number;
          is_telemetry_missing?: boolean;
          missing_parameters_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          production_order_id?: string | null;
          calculation_type?: "estimated_catalog" | "actual_production";
          filament_cost?: number;
          electricity_cost?: number;
          machine_depreciation_cost?: number;
          packaging_cost?: number;
          labor_cost?: number;
          other_direct_cost?: number;
          unit_sale_price?: number;
          gross_margin_amount?: number;
          gross_margin_percent?: number;
          is_telemetry_missing?: boolean;
          missing_parameters_notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_cost_snapshots_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_cost_snapshots_production_order_id_fkey";
            columns: ["production_order_id"];
            isOneToOne: false;
            referencedRelation: "production_orders";
            referencedColumns: ["id"];
          }
        ];
      };

      // --- MIGRATION 06: ANALYTICS & OBSERVABILITY ---
      analytics_events: {
        Row: {
          id: string;
          session_id: string;
          event_name: AnalyticsEventName;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          ip_hash: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          event_name: AnalyticsEventName;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip_hash?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          event_name?: AnalyticsEventName;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip_hash?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      register_spool_movement: {
        Args: {
          p_spool_id: string;
          p_movement_type: SpoolMovementType;
          p_quantity_g: number;
          p_production_order_id?: string | null;
          p_reference_note?: string | null;
          p_actor_profile_id?: string | null;
        };
        Returns: Database["public"]["Tables"]["filament_spool_movements"]["Row"];
      };
      generate_production_order_number: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      log_analytics_event: {
        Args: {
          p_session_id: string;
          p_event_name: AnalyticsEventName;
          p_entity_type?: string;
          p_entity_id?: string | null;
          p_metadata?: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      commercial_mode: CommercialMode;
      campaign_status: CampaignStatus;
      filament_material: FilamentMaterial;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      spool_status: SpoolStatus;
      production_status: ProductionStatus;
      inventory_movement_type: InventoryMovementType;
      spool_movement_type: SpoolMovementType;
      production_cost_type: ProductionCostType;
      financial_transaction_type: FinancialTransactionType;
      financial_transaction_status: FinancialTransactionStatus;
      account_payable_status: AccountPayableStatus;
      account_receivable_status: AccountReceivableStatus;
      reconciliation_status: ReconciliationStatus;
      analytics_event_name: AnalyticsEventName;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
