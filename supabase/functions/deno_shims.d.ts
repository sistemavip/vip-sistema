/**
 * This file provides shims for Deno-specific globals and URL imports
 * to satisfy the TypeScript compiler in the IDE.
 */

declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): any;
}

declare module "https://esm.sh/@supabase/supabase-js@2.38.4" {
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): any;
}

declare module "https://deno.land/x/xhr@0.1.0/mod.ts" {
  const content: any;
  export default content;
}
