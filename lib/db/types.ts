/*
 * Database types for the Hemingway schema (supabase/migrations).
 *
 * Hand-written to match the migrations exactly, in the shape `supabase gen types`
 * would produce, so /lib/db query functions are fully typed. When a live Supabase
 * project exists, this can be regenerated with:
 *   supabase gen types typescript --local > lib/db/types.ts
 *
 * pgvector columns are represented as `string` (the default supabase-js form,
 * e.g. "[0.1,0.2,...]").
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Vertical = "fnb" | "hospitality" | "real_estate" | "d2c" | "other";
export type PublicationTier = "national" | "regional" | "trade" | "blog";
export type EmailStatus = "unverified" | "pattern_guess" | "verified" | "bounced";
export type SendingDomainStatus = "not_setup" | "warming" | "ready" | "degraded";
export type CampaignStatus = "draft" | "matching" | "pitching" | "active" | "closed";
export type PitchStatus =
  | "drafted"
  | "edited"
  | "approved"
  | "pushed"
  | "replied"
  | "placed"
  | "declined"
  | "bounced";
export type MonitorSource = "expert_platform" | "brand_mention" | "journo_request";
export type MonitorEventStatus = "new" | "drafted" | "responded" | "won" | "ignored";
export type PlacementType = "feature" | "quote" | "listicle" | "directory" | "mention";
export type MetricsSource = "dataforseo" | "mock";

export type Database = {
  public: {
    Tables: {
      publications: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          website: string;
          vertical: Vertical;
          tier: PublicationTier;
          scrape_config: Json;
          last_scraped_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          website: string;
          vertical: Vertical;
          tier: PublicationTier;
          scrape_config?: Json;
          last_scraped_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["publications"]["Insert"]>;
        Relationships: [];
      };
      journalists: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          publication_id: string;
          name: string;
          role: string | null;
          email: string | null;
          email_status: EmailStatus;
          email_verified_at: string | null;
          beat_summary: string | null;
          receptivity_notes: string | null;
          quotes_founders: boolean;
          uses_data_studies: boolean;
          profile_embedding: string | null;
          last_profiled_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          publication_id: string;
          name: string;
          role?: string | null;
          email?: string | null;
          email_status?: EmailStatus;
          email_verified_at?: string | null;
          beat_summary?: string | null;
          receptivity_notes?: string | null;
          quotes_founders?: boolean;
          uses_data_studies?: boolean;
          profile_embedding?: string | null;
          last_profiled_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["journalists"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "journalists_publication_id_fkey";
            columns: ["publication_id"];
            referencedRelation: "publications";
            referencedColumns: ["id"];
          },
        ];
      };
      articles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          journalist_id: string;
          title: string;
          url: string;
          published_at: string | null;
          summary: string | null;
          embedding: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          journalist_id: string;
          title: string;
          url: string;
          published_at?: string | null;
          summary?: string | null;
          embedding?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "articles_journalist_id_fkey";
            columns: ["journalist_id"];
            referencedRelation: "journalists";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          website: string | null;
          vertical: Vertical;
          sending_domain: string | null;
          sending_domain_status: SendingDomainStatus;
          knowledge_base: string | null;
          active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          website?: string | null;
          vertical: Vertical;
          sending_domain?: string | null;
          sending_domain_status?: SendingDomainStatus;
          knowledge_base?: string | null;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          client_id: string;
          name: string;
          story_angle: string | null;
          data_study_title: string | null;
          data_study_summary: string | null;
          data_study_url: string | null;
          status: CampaignStatus;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          client_id: string;
          name: string;
          story_angle?: string | null;
          data_study_title?: string | null;
          data_study_summary?: string | null;
          data_study_url?: string | null;
          status?: CampaignStatus;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      pitches: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          campaign_id: string;
          journalist_id: string;
          subject: string | null;
          body: string | null;
          status: PitchStatus;
          match_score: number | null;
          approved_by: string | null;
          approved_at: string | null;
          pushed_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          campaign_id: string;
          journalist_id: string;
          subject?: string | null;
          body?: string | null;
          status?: PitchStatus;
          match_score?: number | null;
          approved_by?: string | null;
          approved_at?: string | null;
          pushed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pitches"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "pitches_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pitches_journalist_id_fkey";
            columns: ["journalist_id"];
            referencedRelation: "journalists";
            referencedColumns: ["id"];
          },
        ];
      };
      monitor_events: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          client_id: string;
          source: MonitorSource;
          title: string;
          url: string | null;
          summary: string | null;
          deadline_at: string | null;
          status: MonitorEventStatus;
          draft_response: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          client_id: string;
          source: MonitorSource;
          title: string;
          url?: string | null;
          summary?: string | null;
          deadline_at?: string | null;
          status?: MonitorEventStatus;
          draft_response?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["monitor_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "monitor_events_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      placements: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          client_id: string;
          campaign_id: string | null;
          pitch_id: string | null;
          monitor_event_id: string | null;
          publication_name: string | null;
          url: string | null;
          headline: string | null;
          published_at: string | null;
          placement_type: PlacementType;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          client_id: string;
          campaign_id?: string | null;
          pitch_id?: string | null;
          monitor_event_id?: string | null;
          publication_name?: string | null;
          url?: string | null;
          headline?: string | null;
          published_at?: string | null;
          placement_type: PlacementType;
        };
        Update: Partial<Database["public"]["Tables"]["placements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "placements_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "placements_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "placements_pitch_id_fkey";
            columns: ["pitch_id"];
            referencedRelation: "pitches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "placements_monitor_event_id_fkey";
            columns: ["monitor_event_id"];
            referencedRelation: "monitor_events";
            referencedColumns: ["id"];
          },
        ];
      };
      metrics_snapshots: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          client_id: string;
          snapshot_date: string;
          backlinks_count: number;
          referring_domains: number;
          ai_mentions_count: number;
          ai_mentions_breakdown: Json;
          source: MetricsSource;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          client_id: string;
          snapshot_date: string;
          backlinks_count?: number;
          referring_domains?: number;
          ai_mentions_count?: number;
          ai_mentions_breakdown?: Json;
          source?: MetricsSource;
        };
        Update: Partial<Database["public"]["Tables"]["metrics_snapshots"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "metrics_snapshots_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      match_journalists: {
        Args: {
          query_embedding: string;
          match_count?: number;
          filter_vertical?: Vertical | null;
          min_score?: number;
          profile_weight?: number;
        };
        Returns: {
          journalist_id: string;
          score: number;
          profile_similarity: number;
          article_similarity: number | null;
        }[];
      };
    };
    Enums: {
      vertical: Vertical;
      publication_tier: PublicationTier;
      email_status: EmailStatus;
      sending_domain_status: SendingDomainStatus;
      campaign_status: CampaignStatus;
      pitch_status: PitchStatus;
      monitor_source: MonitorSource;
      monitor_event_status: MonitorEventStatus;
      placement_type: PlacementType;
      metrics_source: MetricsSource;
    };
    CompositeTypes: Record<never, never>;
  };
};

// Convenience row/insert aliases used across /lib/db and the app.
type PublicTables = Database["public"]["Tables"];
export type Publication = PublicTables["publications"]["Row"];
export type Journalist = PublicTables["journalists"]["Row"];
export type Article = PublicTables["articles"]["Row"];
export type Client = PublicTables["clients"]["Row"];
export type Campaign = PublicTables["campaigns"]["Row"];
export type Pitch = PublicTables["pitches"]["Row"];
export type MonitorEvent = PublicTables["monitor_events"]["Row"];
export type Placement = PublicTables["placements"]["Row"];
export type MetricsSnapshot = PublicTables["metrics_snapshots"]["Row"];

export type PublicationInsert = PublicTables["publications"]["Insert"];
export type JournalistInsert = PublicTables["journalists"]["Insert"];
export type ArticleInsert = PublicTables["articles"]["Insert"];
export type ClientInsert = PublicTables["clients"]["Insert"];
export type CampaignInsert = PublicTables["campaigns"]["Insert"];
export type PitchInsert = PublicTables["pitches"]["Insert"];
export type MonitorEventInsert = PublicTables["monitor_events"]["Insert"];
export type PlacementInsert = PublicTables["placements"]["Insert"];
export type MetricsSnapshotInsert = PublicTables["metrics_snapshots"]["Insert"];

export type JournalistMatch =
  Database["public"]["Functions"]["match_journalists"]["Returns"][number];
