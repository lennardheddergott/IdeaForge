// Gemeinsame CORS-Header, damit der Browser die Edge Function via
// supabase.functions.invoke(...) aufrufen darf (inkl. Preflight/OPTIONS).
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
