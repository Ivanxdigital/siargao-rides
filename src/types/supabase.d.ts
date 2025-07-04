/**
 * This file is used to fix TypeScript errors that might happen during Supabase
 * operations by declaring that all database operations take string arguments.
 */


// Define a basic Database interface for type checking
export interface Database {
  public: {
    Tables: {
      [key: string]: unknown;
    };
    Views: {
      [key: string]: unknown;
    };
    Functions: {
      [key: string]: unknown;
    };
  };
}

declare module "@supabase/supabase-js" {
  interface SupabaseClient {
    from(table: string): {
      select(columns?: string): unknown;
      insert(values: unknown, options?: unknown): unknown;
      update(values: unknown, options?: unknown): unknown;
      delete(options?: unknown): unknown;
      eq(column: string, value: unknown): unknown;
      neq(column: string, value: unknown): unknown;
      gt(column: string, value: unknown): unknown;
      gte(column: string, value: unknown): unknown;
      lt(column: string, value: unknown): unknown;
      lte(column: string, value: unknown): unknown;
      is(column: string, value: unknown): unknown;
      in(column: string, values: unknown[]): unknown;
      contains(column: string, value: unknown): unknown;
      containedBy(column: string, value: unknown): unknown;
      textSearch(column: string, query: string, options?: unknown): unknown;
      filter(column: string, operator: string, value: unknown): unknown;
      match(query: unknown): unknown;
      single(): unknown;
      maybeSingle(): unknown;
      csv(): unknown;
      order(column: string, options?: unknown): unknown;
      range(from: number, to: number): unknown;
      limit(count: number): unknown;
      offset(count: number): unknown;
    };
  }
} 