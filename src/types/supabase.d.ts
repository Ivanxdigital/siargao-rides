/**
 * This file is used to fix TypeScript errors that might happen during Supabase
 * operations by declaring that all database operations take string arguments.
 */

import { SupabaseClient } from "@supabase/supabase-js";

declare module "@supabase/supabase-js" {
  interface SupabaseClient {
    from(table: string): {
      select(columns?: string): any;
      insert(values: any, options?: any): any;
      update(values: any, options?: any): any;
      delete(options?: any): any;
      eq(column: string, value: any): any;
      neq(column: string, value: any): any;
      gt(column: string, value: any): any;
      gte(column: string, value: any): any;
      lt(column: string, value: any): any;
      lte(column: string, value: any): any;
      is(column: string, value: any): any;
      in(column: string, values: any[]): any;
      contains(column: string, value: any): any;
      containedBy(column: string, value: any): any;
      textSearch(column: string, query: string, options?: any): any;
      filter(column: string, operator: string, value: any): any;
      match(query: any): any;
      single(): any;
      maybeSingle(): any;
      csv(): any;
      order(column: string, options?: any): any;
      range(from: number, to: number): any;
      limit(count: number): any;
      offset(count: number): any;
    };
  }
} 