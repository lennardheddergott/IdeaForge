// ============================================================================
// Edge Function: generate-sketch
// ============================================================================
// Erzeugt aus einer gespeicherten Idee ZWEI Bilder mit OpenAI (gpt-image-1):
//   1) ein standardisiertes technisches Konzeptblatt (concept_sheet_url)
//   2) eine fotorealistische Produktvorschau (preview_image_url)
// Beide werden im Storage-Bucket 'idea-sketches' abgelegt; die öffentlichen
// URLs + der Status werden in die Tabelle 'ideas' zurückgeschrieben.
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
import { buildSketchPrompt, buildPreviewPrompt } from './prompt.ts'
import { generateSpec, REJECTION_MESSAGE } from './spec.ts'

const SKETCH_BUCKET = 'idea-sketches'
const OPENAI_IMAGE_ENDPOINT = 'https://api.openai.com/v1/images/generations'

/** Kleine Helfer für JSON-Antworten inkl. CORS-Headern. */
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Erzeugt ein Bild bei OpenAI und gibt die rohen PNG-Bytes zurück. */
async function generateImageBytes(opts: {
  apiKey: string
  model: string
  size: string
  quality: string
  prompt: string
  label: string
}): Promise<Uint8Array> {
  console.log(`[generate-sketch] OpenAI /images/generations → Anfrage (${opts.label})`, {
    model: opts.model,
    size: opts.size,
    quality: opts.quality,
    promptLen: opts.prompt.length,
  })
  const resp = await fetch(OPENAI_IMAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      prompt: opts.prompt,
      size: opts.size,
      quality: opts.quality,
      n: 1,
    }),
  })
  console.log(`[generate-sketch] OpenAI /images/generations → Antwort (${opts.label})`, {
    httpStatus: resp.status,
    ok: resp.ok,
  })

  if (!resp.ok) {
    const detail = await resp.text()
    console.error(
      `[generate-sketch] OpenAI Bild-VOLLSTÄNDIGE Fehlerantwort (${opts.label}) [HTTP ${resp.status}]:`,
      detail,
    )
    throw new Error(`OpenAI-Bildfehler (${resp.status}): ${detail.slice(0, 800)}`)
  }

  const result = await resp.json()
  const b64: string | undefined = result?.data?.[0]?.b64_json
  if (!b64) {
    console.error(
      `[generate-sketch] OpenAI-Antwort ohne Bilddaten (${opts.label}) – vollständig:`,
      JSON.stringify(result),
    )
    throw new Error(`OpenAI hat kein Bild zurückgegeben. Antwort: ${JSON.stringify(result).slice(0, 800)}`)
  }
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

/** Lädt PNG-Bytes in den Storage-Bucket und gibt die öffentliche URL zurück. */
async function uploadPng(
  admin: ReturnType<typeof createClient>,
  path: string,
  bytes: Uint8Array,
): Promise<string> {
  const { error } = await admin.storage
    .from(SKETCH_BUCKET)
    .upload(path, bytes, { contentType: 'image/png', upsert: true })
  if (error) {
    throw new Error(`Storage-Upload fehlgeschlagen: ${error.message}`)
  }
  const { data } = admin.storage.from(SKETCH_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

Deno.serve(async (req: Request) => {
  // CORS-Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // GLOBALES try/catch: es wird IMMER ein JSON-Body zurückgegeben (nie ein
  // leerer/Plain-Text-Response), damit das Frontend die echte Ursache sieht.
  try {
    console.log('[generate-sketch] Handler gestartet', { method: req.method })
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

    // --- 1) Analyse: Möbel-Klassifikation + strukturierte Spec --------------
    //   Dies ist die EINZIGE Quelle für Visualisierung, Konzeptblatt & Preis.
    const textModel = Deno.env.get('OPENAI_TEXT_MODEL') ?? 'gpt-4o-mini'
    console.log('[generate-sketch] Spec-Analyse startet', { ideaId, textModel })
    const spec = await generateSpec({
      apiKey: openaiKey,
      model: textModel,
      idea: {
        prompt: idea.prompt,
        style: idea.style,
        materials: idea.materials,
        category: idea.category,
      },
    })
    console.log('[generate-sketch] Spec fertig', {
      ist_moebel: spec.ist_moebel,
      titel: spec.titel,
    })

    // --- 1a) Themenfremde Eingabe → ablehnen, KEINE Bildgenerierung ---------
    if (!spec.ist_moebel) {
      const message = spec.ablehnung || REJECTION_MESSAGE
      await admin
        .from('ideas')
        .update({
          status: 'rejected',
          error: message,
          concept: null,
          concept_sheet_url: null,
          preview_image_url: null,
          image_url: null,
        })
        .eq('id', ideaId)
      return json({ status: 'rejected', message })
    }

    // --- 2) Beide Prompts aus DERSELBEN Spec bauen --------------------------
    const conceptPrompt = buildSketchPrompt(spec) // technisches Konzeptblatt (DE)
    const previewPrompt = buildPreviewPrompt(spec) // fotorealistische Vorschau

    // --- 3) Beide Bilder bei OpenAI erzeugen (parallel → konsistent & schnell)
    // Standard-Bildmodell: 'gpt-image-1' (existierendes OpenAI-Modell). Ein
    // ungültiger Default würde den Bild-Call scheitern lassen → status 'failed'.
    const model = Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-1'
    const size = Deno.env.get('OPENAI_IMAGE_SIZE') ?? '1024x1024'
    const quality = Deno.env.get('OPENAI_IMAGE_QUALITY') ?? 'medium'

    console.log('[generate-sketch] Bilderzeugung startet', { model, size, quality })
    const [conceptBytes, previewBytes] = await Promise.all([
      generateImageBytes({ apiKey: openaiKey, model, size, quality, prompt: conceptPrompt, label: 'Konzeptblatt' }),
      generateImageBytes({ apiKey: openaiKey, model, size, quality, prompt: previewPrompt, label: 'Vorschau' }),
    ])
    console.log('[generate-sketch] Bilder erzeugt')

    // --- 4) Beide Bilder getrennt in den Storage-Bucket hochladen -----------
    const [conceptUrl, previewUrl] = await Promise.all([
      uploadPng(admin, `${idea.user_id}/${ideaId}-concept.png`, conceptBytes),
      uploadPng(admin, `${idea.user_id}/${ideaId}-preview.png`, previewBytes),
    ])

    // --- 5) Spec + URLs in die DB zurückschreiben ---------------------------
    const { error: updateError } = await admin
      .from('ideas')
      .update({
        concept: spec, // strukturierte Spec (Quelle für Preis & Anzeige)
        concept_sheet_url: conceptUrl,
        preview_image_url: previewUrl,
        image_url: conceptUrl, // Abwärtskompatibilität (altes Einzelfeld)
        status: 'generated',
        error: null,
      })
      .eq('id', ideaId)
    if (updateError) {
      throw new Error(`DB-Update fehlgeschlagen: ${updateError.message}`)
    }

    console.log('[generate-sketch] Fertig: status=generated', { ideaId })
    return json({
      status: 'generated',
      concept_sheet_url: conceptUrl,
      preview_image_url: previewUrl,
    })
  } catch (e) {
    const err = e as Error
    const message = err?.message ?? 'Unbekannter Fehler.'
    // ===== VOLLSTÄNDIGE Diagnose DIREKT vor status='failed' =====
    console.error('[generate-sketch] ============ EXCEPTION vor status=failed ============')
    console.error('[generate-sketch] name   :', err?.name)
    console.error('[generate-sketch] message:', message)
    console.error('[generate-sketch] stack  :', err?.stack)
    console.error('[generate-sketch] exception (raw):', e)
    try {
      console.error('[generate-sketch] exception (JSON):', JSON.stringify(e, Object.getOwnPropertyNames(err ?? {})))
    } catch {
      /* nicht serialisierbar */
    }
    console.error('[generate-sketch] =====================================================')
    // Fehler an der Idee vermerken (best effort – Fehler hier nicht erneut werfen).
    await admin
      .from('ideas')
      .update({ status: 'failed', error: message })
      .eq('id', ideaId)
    return json(
      { status: 'failed', error: message, name: err?.name ?? null, stack: err?.stack ?? null },
      500,
    )
  }
  } catch (error) {
    // Letzte Sicherheitsstufe: JEDER unerwartete Fehler → IMMER JSON mit Stack.
    console.error('[generate-sketch] Unbehandelter Fehler', error)
    const err = error as Error
    return json(
      { error: true, message: err?.message ?? String(error), stack: err?.stack ?? null },
      500,
    )
  }
})
