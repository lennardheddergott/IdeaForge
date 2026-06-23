// ============================================================================
// Edge Function: generate-sketch
// ============================================================================
// Erzeugt aus einer gespeicherten Idee eine standardisierte technische
// Konzeptskizze mit OpenAI (gpt-image-2), legt sie im Storage-Bucket
// 'idea-sketches' ab und schreibt die öffentliche URL + den Status zurück
// in die Tabelle 'ideas'.
//
// Sicherheit:
//   - Der OpenAI-API-Schlüssel liegt ausschließlich als Edge-Function-Secret
//     (OPENAI_API_KEY) auf dem Server, NIE im Browser/Frontend.
//   - Der Aufrufer wird über seinen JWT authentifiziert; er darf nur seine
//     EIGENEN Ideen generieren lassen (user_id-Abgleich).
//   - Schreibzugriff auf Storage/DB erfolgt mit der Service-Role (umgeht RLS),
//     daher die strikte Eigentums-Prüfung oben.
//
// Aufruf aus dem Frontend:
//   supabase.functions.invoke('generate-sketch', { body: { ideaId } })
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { buildSketchPrompt } from './prompt.ts'

const SKETCH_BUCKET = 'idea-sketches'
const OPENAI_IMAGE_ENDPOINT = 'https://api.openai.com/v1/images/generations'

/** Kleine Helfer für JSON-Antworten inkl. CORS-Headern. */
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  // CORS-Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  // --- Konfiguration / Secrets aus Environment-Variablen --------------------
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!openaiKey) {
    // Konfigurationsfehler – nicht dem Nutzer anlasten, aber klar melden.
    return json(
      { error: 'Server ist nicht konfiguriert (OPENAI_API_KEY fehlt).' },
      500,
    )
  }
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Server ist nicht korrekt konfiguriert.' }, 500)
  }

  // --- Request-Body lesen ---------------------------------------------------
  let ideaId: string | undefined
  try {
    const body = await req.json()
    ideaId = body?.ideaId
  } catch {
    return json({ error: 'Ungültiger Request-Body (JSON erwartet).' }, 400)
  }
  if (!ideaId || typeof ideaId !== 'string') {
    return json({ error: 'Feld "ideaId" fehlt.' }, 400)
  }

  // --- Aufrufer authentifizieren (eigener JWT) ------------------------------
  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()
  if (userError || !user) {
    return json({ error: 'Nicht angemeldet.' }, 401)
  }

  // --- Service-Role-Client für Lese-/Schreibzugriff (umgeht RLS) ------------
  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Idee laden + Eigentum prüfen
  const { data: idea, error: ideaError } = await admin
    .from('ideas')
    .select('id, user_id, prompt, style, materials, category, status')
    .eq('id', ideaId)
    .single()

  if (ideaError || !idea) {
    return json({ error: 'Idee nicht gefunden.' }, 404)
  }
  if (idea.user_id !== user.id) {
    return json({ error: 'Kein Zugriff auf diese Idee.' }, 403)
  }

  // Ab hier markieren wir Fehler an der Idee selbst (status = 'failed'),
  // damit das Frontend die Ursache anzeigen kann.
  try {
    // Status auf 'pending' setzen (idempotent) und evtl. alten Fehler löschen.
    await admin
      .from('ideas')
      .update({ status: 'pending', error: null })
      .eq('id', ideaId)

    // --- 1) Standardisierten Prompt bauen -----------------------------------
    const prompt = buildSketchPrompt({
      prompt: idea.prompt,
      style: idea.style,
      materials: idea.materials,
      category: idea.category,
    })

    // --- 2) OpenAI-Bildgenerierung ------------------------------------------
    const model = Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-2'
    const size = Deno.env.get('OPENAI_IMAGE_SIZE') ?? '1024x1024'
    const quality = Deno.env.get('OPENAI_IMAGE_QUALITY') ?? 'medium'

    const openaiResp = await fetch(OPENAI_IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
    })

    if (!openaiResp.ok) {
      const detail = await openaiResp.text()
      throw new Error(
        `OpenAI-API-Fehler (${openaiResp.status}): ${detail.slice(0, 400)}`,
      )
    }

    const result = await openaiResp.json()
    const b64: string | undefined = result?.data?.[0]?.b64_json
    if (!b64) {
      throw new Error('OpenAI hat kein Bild zurückgegeben.')
    }

    // base64 → Bytes
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

    // --- 3) In den Storage-Bucket hochladen ---------------------------------
    const path = `${idea.user_id}/${ideaId}.png`
    const { error: uploadError } = await admin.storage
      .from(SKETCH_BUCKET)
      .upload(path, bytes, { contentType: 'image/png', upsert: true })
    if (uploadError) {
      throw new Error(`Storage-Upload fehlgeschlagen: ${uploadError.message}`)
    }

    const { data: pub } = admin.storage.from(SKETCH_BUCKET).getPublicUrl(path)
    const imageUrl = pub.publicUrl

    // --- 4) Ergebnis in die DB zurückschreiben ------------------------------
    const { error: updateError } = await admin
      .from('ideas')
      .update({ image_url: imageUrl, status: 'generated', error: null })
      .eq('id', ideaId)
    if (updateError) {
      throw new Error(`DB-Update fehlgeschlagen: ${updateError.message}`)
    }

    return json({ status: 'generated', image_url: imageUrl })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unbekannter Fehler.'
    // Fehler an der Idee vermerken (best effort – Fehler hier nicht erneut werfen).
    await admin
      .from('ideas')
      .update({ status: 'failed', error: message })
      .eq('id', ideaId)
    return json({ status: 'failed', error: message }, 500)
  }
})
