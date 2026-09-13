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
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          username: string;
          real_name: string | null;
          avatar_url: string | null;
          sdrogo_points: number;
          total_cannucce_donated: number;
          unlocked_badges?: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          username: string;
          real_name?: string | null;
          avatar_url?: string | null;
          sdrogo_points?: number;
          total_cannucce_donated?: number;
          unlocked_badges?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          username?: string;
          real_name?: string | null;
          avatar_url?: string | null;
          sdrogo_points?: number;
          total_cannucce_donated?: number;
          unlocked_badges?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      watch_sessions: {
        Row: {
          id: string;
          user_id: string;
          match_id: number;
          watch_seconds: number;
          required_seconds: number;
          is_completed: boolean;
          credits_awarded: boolean;
          completed_at: string | null;
          last_active_at?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: number;
          watch_seconds?: number;
          required_seconds?: number;
          is_completed?: boolean;
          credits_awarded?: boolean;
          completed_at?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: number;
          watch_seconds?: number;
          required_seconds?: number;
          is_completed?: boolean;
          credits_awarded?: boolean;
          completed_at?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bets: {
        Row: {
          id: string;
          user_id: string;
          match_id: number;
          winner_pick: string;
          hio_king_pick: string;
          asino_pick: string;
          score_range_pick: string;
          staked_points: number;
          status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled';
          payout: number;
          placed_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: number;
          winner_pick: string;
          hio_king_pick: string;
          asino_pick: string;
          score_range_pick: string;
          staked_points: number;
          status?: 'pending' | 'won' | 'lost' | 'void' | 'cancelled';
          payout?: number;
          placed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: number;
          winner_pick?: string;
          hio_king_pick?: string;
          asino_pick?: string;
          score_range_pick?: string;
          staked_points?: number;
          status?: 'pending' | 'won' | 'lost' | 'void' | 'cancelled';
          payout?: number;
          placed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      donations: {
        Row: {
          id: string;
          user_id: string;
          donor_name: string;
          cannucce_amount: number;
          tier_title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          donor_name: string;
          cannucce_amount: number;
          tier_title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          donor_name?: string;
          cannucce_amount?: number;
          tier_title?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      gay_cards: {
        Row: {
          id: string;
          user_id: string;
          card_number: string;
          name: string;
          surname: string;
          custom_title: string;
          favorite_player: string;
          membership_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_number: string;
          name: string;
          surname: string;
          custom_title?: string;
          favorite_player: string;
          membership_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_number?: string;
          name?: string;
          surname?: string;
          custom_title?: string;
          favorite_player?: string;
          membership_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      place_user_bet: {
        Args: {
          p_match_id: number;
          p_winner_pick: string;
          p_hio_king_pick: string;
          p_asino_pick: string;
          p_score_range_pick: string;
          p_staked_points: number;
        };
        Returns: {
          success: boolean;
          bet_id: string;
          match_id: number;
          staked_points: number;
          previous_points: number;
          remaining_points: number;
          message: string;
        };
      };
      complete_watch_session: {
        Args: {
          p_match_id: number;
          p_watch_seconds: number;
        };
        Returns: {
          success: boolean;
          match_id: number;
          is_completed: boolean;
          credits_awarded: boolean;
          already_rewarded: boolean;
          points_added: number;
          current_watch_seconds?: number;
          required_watch_seconds?: number;
          total_points: number;
          message: string;
        };
      };
      donate_cannucce_to_gabbiness: {
        Args: {
          p_donor_name: string;
          p_cannucce_amount: number;
        };
        Returns: {
          success: boolean;
          donation_id: string;
          donor_name: string;
          cannucce_amount: number;
          tier_title: string;
          remaining_points: number;
          total_donated: number;
          message: string;
        };
      };
      upsert_user_gay_card: {
        Args: {
          p_card_number: string;
          p_name: string;
          p_surname: string;
          p_custom_title: string;
          p_favorite_player: string;
        };
        Returns: {
          success: boolean;
          card_id: string;
          card_number: string;
          message: string;
        };
      };
    };
  };
}
