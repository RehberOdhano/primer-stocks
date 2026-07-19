/**
 * Hand-written to match supabase/migrations/0001_init.sql. Once the project
 * is linked to a live Supabase instance, replace this with the generated
 * output of `supabase gen types typescript --linked` and delete this note.
 *
 * `Relationships`/`Views`/`Functions` are required (even empty) for
 * @supabase/postgrest-js's generic type inference to resolve `select()`
 * results correctly instead of falling back to `never`.
 */

export type Market = "US" | "PSX";
export type PriceSource = "finnhub" | "psx_portal";
export type TransactionSide = "buy" | "sell";

export interface Database {
  public: {
    Tables: {
      tickers: {
        Row: {
          id: string;
          symbol: string;
          name: string;
          market: Market;
          sector: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          name: string;
          market: Market;
          sector?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tickers"]["Insert"]>;
        Relationships: [];
      };
      price_snapshots: {
        Row: {
          id: string;
          ticker_id: string;
          snapshot_date: string;
          open: number | null;
          close: number;
          previous_close: number | null;
          volume: number | null;
          pe_ratio: number | null;
          market_cap: number | null;
          week52_high: number | null;
          week52_low: number | null;
          dividend_yield: number | null;
          eps: number | null;
          source: PriceSource;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticker_id: string;
          snapshot_date: string;
          open?: number | null;
          close: number;
          previous_close?: number | null;
          volume?: number | null;
          pe_ratio?: number | null;
          market_cap?: number | null;
          week52_high?: number | null;
          week52_low?: number | null;
          dividend_yield?: number | null;
          eps?: number | null;
          source: PriceSource;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["price_snapshots"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "price_snapshots_ticker_id_fkey";
            columns: ["ticker_id"];
            referencedRelation: "tickers";
            referencedColumns: ["id"];
          },
        ];
      };
      terms: {
        Row: {
          id: string;
          key: string;
          title: string;
          explainer: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          title: string;
          explainer: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["terms"]["Insert"]>;
        Relationships: [];
      };
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          cash_balance_usd: number;
          cash_balance_pkr: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cash_balance_usd?: number;
          cash_balance_pkr?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["portfolios"]["Insert"]>;
        Relationships: [];
      };
      portfolio_value_snapshots: {
        Row: {
          id: string;
          portfolio_id: string;
          snapshot_date: string;
          cash_usd: number;
          cash_pkr: number;
          holdings_value_usd: number;
          holdings_value_pkr: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          snapshot_date: string;
          cash_usd: number;
          cash_pkr: number;
          holdings_value_usd: number;
          holdings_value_pkr: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["portfolio_value_snapshots"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "portfolio_value_snapshots_portfolio_id_fkey";
            columns: ["portfolio_id"];
            referencedRelation: "portfolios";
            referencedColumns: ["id"];
          },
        ];
      };
      holdings: {
        Row: {
          id: string;
          portfolio_id: string;
          ticker_id: string;
          quantity: number;
          avg_cost: number;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          ticker_id: string;
          quantity?: number;
          avg_cost?: number;
        };
        Update: Partial<Database["public"]["Tables"]["holdings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "holdings_portfolio_id_fkey";
            columns: ["portfolio_id"];
            referencedRelation: "portfolios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "holdings_ticker_id_fkey";
            columns: ["ticker_id"];
            referencedRelation: "tickers";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          portfolio_id: string;
          ticker_id: string;
          side: TransactionSide;
          quantity: number;
          price: number;
          executed_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          ticker_id: string;
          side: TransactionSide;
          quantity: number;
          price: number;
          executed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "transactions_portfolio_id_fkey";
            columns: ["portfolio_id"];
            referencedRelation: "portfolios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_ticker_id_fkey";
            columns: ["ticker_id"];
            referencedRelation: "tickers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      execute_trade: {
        Args: {
          p_symbol: string;
          p_side: TransactionSide;
          p_quantity: number;
        };
        Returns: undefined;
      };
    };
  };
}
