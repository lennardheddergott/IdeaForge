// ============================================================================
// Edge Function: render-room
// ============================================================================
// Erzeugt aus einem hochgeladenen Raumfoto + den BEREITS entwickelten Möbeln
// (Products-first) ein NEUES fotorealistisches Raumbild und lokalisiert die
// Möbel anschließend automatisch (Vision) für die unsichtbaren Hotspots.
//
// Sicherheit: OpenAI-Key nur als Edge-Secret (OPENAI_API_KEY), nie im Browser.
// Fehlerbehandlung: GLOBALES try/catch um den gesamten Handler → es wird IMMER
// ein JSON-Body zurückgegeben (nie ein leerer/Plain-Text-Response), damit das
// Frontend die echte Ursache anzeigen kann. Alle Fehler werden geloggt.
//
// Aufruf: supabase.functions.invoke('render-room', { body: { projectId } })
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { buildRoomPrompt } from './prompt.ts'

const IMAGE_BUCKET = 'idea-images' // privates Originalfoto
const RESULT_BUCKET = 'idea-sketches' // öffentliches Ergebnisbild
const OPENAI_EDITS_ENDPOINT = 'https://api.openai.com/v1/images/edits'
const OPENAI_CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' }

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Referenzbild konnte nicht geladen werden (${r.status}).`)
  return new Uint8Array(await r.arrayBuffer())
}

interface BBox {
  x: number
  y: number
  w: number
  h: number
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** Lokalisiert die Möbel im fertigen Raumbild (Vision) → normalisierte Boxen. */
async function detectFurniture(
  apiKey: string,
  imageUrl: string,
  items: { index: number; name: string }[],
): Promise<{ index: number; bbox: BBox | null }[]> {
  const model = Deno.env.get('OPENAI_VISION_MODEL') ?? 'gpt-4o'
  const list = items.map((it) => `${it.index}: ${it.name}`).join('\n')
  const instruction =
    `In diesem Innenraumbild sind folgende Möbelstücke zu sehen (Index: Name):\n${list}\n\n` +
    'Gib für jedes Möbelstück eine normalisierte Bounding-Box zurück, die es möglichst eng ' +
    'umschließt. Koordinaten 0..1, Ursprung oben links: x,y = obere linke Ecke, w,h = Breite/Höhe. ' +
    'Antworte AUSSCHLIESSLICH als JSON: {"boxes":[{"index":0,"x":0.0,"y":0.0,"w":0.0,"h":0.0}]}. ' +
    'Lass ein Möbelstück weg, wenn es nicht eindeutig sichtbar ist.'

  console.log('[render-room] Vision-Detektion → Anfrage', { model, items: items.length })
  const resp = await fetch(OPENAI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Du lokalisierst Objekte in Bildern und antwortest nur mit JSON.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: instruction },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  })
  console.log('[render-room] Vision-Detektion → Antwort', { httpStatus: resp.status, ok: resp.ok })
  if (!resp.ok) {
    const t = await resp.text()
    console.error('[render-room] Vision-Detektion Fehlerbody', t.slice(0, 600))
    throw new Error(`Detektion fehlgeschlagen (${resp.status}).`)
  }
  const data = await resp.json()
  const content: string = data?.choices?.[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(content)
  const boxes: Record<string, number>[] = Array.isArray(parsed?.boxes) ? parsed.boxes : []

  return items.map((it) => {
    const b = boxes.find((x) => Number(x.index) === it.index)
    const ok =
      b &&
      [b.x, b.y, b.w, b.h].every((v) => typeof v === 'number' && isFinite(v)) &&
      b.w > 0 &&
      b.h > 0
    return {
      index: it.index,
      bbox: ok ? { x: clamp01(b!.x), y: clamp01(b!.y), w: clamp01(b!.w), h: clamp01(b!.h) } : null,
    }
  })
}

Deno.serve(async (req: Request) => {
  // CORS-Preflight zuerst (kann nicht fehlschlagen).
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // GLOBALES try/catch: es wird IMMER ein JSON-Body zurückgegeben.
  try {
    console.log('[render-room] Handler gestartet', { method: req.method })

    if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!openaiKey) {
      console.error('[render-room] OPENAI_API_KEY fehlt')
      return json({ error: 'Server nicht konfiguriert (OPENAI_API_KEY fehlt).' }, 500)
    }
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('[render-room] Supabase-Env unvollständig', {
        hasUrl: !!supabaseUrl,
        hasServiceRole: !!serviceRoleKey,
        hasAnon: !!anonKey,
      })
      return json({ error: 'Server nicht korrekt konfiguriert.' }, 500)
    }

    let projectId: string | undefined
    try {
      projectId = (await req.json())?.projectId
    } catch {
      return json({ error: 'Ungültiger Request-Body (JSON erwartet).' }, 400)
    }
    if (!projectId || typeof projectId !== 'string')
      return json({ error: 'Feld "projectId" fehlt.' }, 400)
    console.log('[render-room] projectId', projectId)

    // Aufrufer authentifizieren.
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) {
      console.error('[render-room] Auth fehlgeschlagen', userError?.message)
      return json({ error: 'Nicht angemeldet.' }, 401)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    // Projekt laden + Eigentum prüfen.
    const { data: project, error: projErr } = await admin
      .from('room_projects')
      .select('id, user_id, style, photo_path')
      .eq('id', projectId)
      .single()
    if (projErr || !project) {
      console.error('[render-room] Projekt nicht gefunden', projErr?.message)
      return json({ error: 'Raumprojekt nicht gefunden.' }, 404)
    }
    if (project.user_id !== user.id) return json({ error: 'Kein Zugriff.' }, 403)

    const model = Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-1'

    try {
      // Status 'rendering' setzen – MIT Fehlerprüfung (deckt fehlende Migration
      // 0012 / Constraint-Verletzung eindeutig auf, statt sie zu verschlucken).
      const { error: statusErr } = await admin
        .from('room_projects')
        .update({ status: 'rendering', render_error: null })
        .eq('id', projectId)
      if (statusErr) {
        throw new Error(
          `Status 'rendering' konnte nicht gesetzt werden (Migration 0012 angewendet?): ${statusErr.message}`,
        )
      }

      // Produkte laden (nur fertige mit Visualisierung).
      const { data: products, error: prodErr } = await admin
        .from('ideas')
        .select(
          'id, prompt, concept, room_position, room_bbox, preview_image_url, concept_sheet_url, image_url, status',
        )
        .eq('room_project_id', projectId)
        .order('created_at', { ascending: true })
      if (prodErr) throw new Error(`Produkte konnten nicht geladen werden: ${prodErr.message}`)

      // Referenzbild eines Produkts: bevorzugt die fotorealistische Vorschau,
      // sonst Konzeptblatt bzw. altes Einzelfeld. So ist ein 'generated'-Produkt
      // auch dann verwendbar, wenn nur eines der Bildfelder gefüllt ist.
      const refImage = (p: Record<string, unknown>): string | null =>
        (p.preview_image_url as string) ??
        (p.concept_sheet_url as string) ??
        (p.image_url as string) ??
        null

      // Detail-Diagnose je Produkt (zeigt genau, warum etwas ausgeschlossen wird).
      console.log('[render-room] Produkte', {
        gesamt: products?.length ?? 0,
        details: (products ?? []).map((p: Record<string, unknown>) => ({
          id: p.id,
          status: p.status,
          hasPreview: !!p.preview_image_url,
          hasConcept: !!p.concept_sheet_url,
          hasImage: !!p.image_url,
        })),
      })

      const usable = (products ?? []).filter(
        (p: Record<string, unknown>) => p.status === 'generated' && refImage(p),
      )
      console.log('[render-room] Verwendbare Produkte', { verwendbar: usable.length })
      if (usable.length === 0) {
        const statuses = (products ?? []).map((p: Record<string, unknown>) => p.status).join(', ')
        throw new Error(
          `Keine fertigen Möbel für die Raumvisualisierung vorhanden. ` +
            `Jedes Möbel muss zuerst erfolgreich als Einzelprodukt erzeugt sein ` +
            `(status 'generated' mit Vorschaubild). Aktuelle Status: [${statuses || 'keine'}].`,
        )
      }
      if (!project.photo_path) throw new Error('Kein Raumfoto vorhanden.')

      // Originalfoto herunterladen.
      const dl = await admin.storage.from(IMAGE_BUCKET).download(project.photo_path)
      if (dl.error || !dl.data) throw new Error('Raumfoto konnte nicht geladen werden.')
      const roomBytes = new Uint8Array(await dl.data.arrayBuffer())

      // Referenz-Einzelvisualisierungen laden (bevorzugt Vorschau, sonst Konzeptblatt).
      const refs = await Promise.all(
        usable.map((p: Record<string, unknown>) => fetchBytes(refImage(p) as string)),
      )

      const nameOf = (p: Record<string, unknown>) => {
        const concept = (p.concept ?? {}) as Record<string, unknown>
        return (concept.titel as string) ?? (p.prompt as string)
      }

      const prompt = buildRoomPrompt({
        style: project.style ?? null,
        products: usable.map((p: Record<string, unknown>) => {
          const concept = (p.concept ?? {}) as Record<string, unknown>
          const materialien = (concept.materialien ?? []) as { material?: string }[]
          const farben = (concept.farben ?? []) as string[]
          return {
            name: nameOf(p),
            material: materialien[0]?.material ?? null,
            farbe: farben[0] ?? null,
            position: (p.room_position as string) ?? null,
          }
        }),
      })

      // OpenAI Images /edits: Raumfoto als Basis + Produktreferenzen.
      const size = Deno.env.get('OPENAI_ROOM_SIZE') ?? '1536x1024'
      const quality = Deno.env.get('OPENAI_IMAGE_QUALITY') ?? 'high'
      const form = new FormData()
      form.append('model', model)
      form.append('prompt', prompt)
      form.append('size', size)
      form.append('quality', quality)
      form.append('n', '1')
      form.append('image[]', new File([roomBytes], 'room.jpg', { type: 'image/jpeg' }))
      refs.forEach((bytes, i) =>
        form.append('image[]', new File([bytes], `product-${i}.png`, { type: 'image/png' })),
      )

      console.log('[render-room] OpenAI /edits → Anfrage', {
        model,
        size,
        quality,
        referenzen: refs.length,
        promptLen: prompt.length,
      })
      const resp = await fetch(OPENAI_EDITS_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: form,
      })
      console.log('[render-room] OpenAI /edits → Antwort', { httpStatus: resp.status, ok: resp.ok })
      if (!resp.ok) {
        const detail = await resp.text()
        console.error('[render-room] OpenAI /edits Fehlerbody', detail.slice(0, 1000))
        throw new Error(`OpenAI-Fehler (${resp.status}): ${detail.slice(0, 600)}`)
      }
      const result = await resp.json()
      const b64: string | undefined = result?.data?.[0]?.b64_json
      if (!b64) throw new Error('OpenAI hat kein Bild zurückgegeben.')
      const outBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

      // Ergebnis hochladen.
      const path = `${project.user_id}/room-${projectId}.png`
      const up = await admin.storage
        .from(RESULT_BUCKET)
        .upload(path, outBytes, { contentType: 'image/png', upsert: true })
      if (up.error) throw new Error(`Upload fehlgeschlagen: ${up.error.message}`)
      const { data: pub } = admin.storage.from(RESULT_BUCKET).getPublicUrl(path)
      const resultImageUrl = pub.publicUrl

      // Automatische Möbel-Detektion → Hotspot-Boxen (NICHT fatal).
      const placements: { productId: string; bbox: BBox | null }[] = usable.map(
        (p: Record<string, unknown>) => ({ productId: p.id as string, bbox: null }),
      )
      try {
        const detected = await detectFurniture(
          openaiKey,
          resultImageUrl,
          usable.map((p: Record<string, unknown>, i: number) => ({ index: i, name: nameOf(p) })),
        )
        for (const d of detected) {
          if (!d.bbox) continue
          placements[d.index].bbox = d.bbox
          await admin.from('ideas').update({ room_bbox: d.bbox }).eq('id', usable[d.index].id as string)
        }
      } catch (detErr) {
        console.error('[render-room] Detektion fehlgeschlagen (nicht fatal)', detErr)
      }

      const { error: finalErr } = await admin
        .from('room_projects')
        .update({
          result_image_url: resultImageUrl,
          status: 'ready',
          render_model: model,
          render_prompt: prompt,
          render_error: null,
        })
        .eq('id', projectId)
      if (finalErr) throw new Error(`Ergebnis konnte nicht gespeichert werden: ${finalErr.message}`)

      console.log('[render-room] Fertig', { resultImageUrl })
      return json({ resultImageUrl, products: placements, model, prompt, status: 'ready', error: null })
    } catch (e) {
      // Fachlicher Fehler im Render-Ablauf → an der DB vermerken + JSON zurück.
      const message = e instanceof Error ? e.message : 'Unbekannter Fehler.'
      console.error('[render-room] Fehler im Render-Ablauf', message, e)
      try {
        await admin
          .from('room_projects')
          .update({ status: 'failed', render_error: message, render_model: model })
          .eq('id', projectId)
      } catch (updErr) {
        console.error('[render-room] Konnte failed-Status nicht speichern', updErr)
      }
      return json(
        { resultImageUrl: null, products: [], model, prompt: null, status: 'failed', error: message },
        500,
      )
    }
  } catch (error) {
    // Letzte Sicherheitsstufe: JEDER unerwartete Fehler → IMMER JSON mit Stack.
    console.error('[render-room] Unbehandelter Fehler', error)
    const err = error as Error
    return new Response(
      JSON.stringify({
        error: true,
        message: err?.message ?? String(error),
        stack: err?.stack ?? null,
      }),
      { status: 500, headers: JSON_HEADERS },
    )
  }
})
