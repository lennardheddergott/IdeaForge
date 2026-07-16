// ============================================================================
// Raumplanung (Pro-Funktion) — Datenschicht + KI-Service-Seam
// ============================================================================
// Ein Raumprojekt (room_projects) ist ein übergeordnetes Projekt. Jedes Möbel
// darin ist eine ganz normale `idea` (verknüpft über room_project_id) und
// durchläuft die BESTEHENDE Pipeline: KI-Spec + Konzeptblatt + Visualisierung
// (generate-sketch / requestSketch), Preis (estimate.ts) und Bestellung
// (createOrder). So gibt es KEINE zweite Produkt-/Preislogik.
//
// KI-Service-Seam:
//   • Einzelprodukte  → requestSketch() (bereits angebunden, echte KI).
//   • Raum-Render     → aktuell Entwicklungs-Fallback (zeigt das Originalfoto).
//     Sobald ein echter Raum-Render-Service existiert, wird ausschließlich
//     generateRoomVisualization() angebunden – UI/Datenmodell bleiben gleich.
// ============================================================================

import { supabase } from '@/lib/supabase'
import type { Idea } from '@/lib/ideas'

// processing = Möbel entstehen · rendering = Raumbild wird erzeugt · ready · failed
export type RoomProjectStatus = 'processing' | 'rendering' | 'ready' | 'failed'

/**
 * Normalisierte Bounding-Box (0..1) im Raumfoto = Klickfläche des Hotspots.
 * Wird NICHT mehr vom Nutzer gezeichnet, sondern nach dem Rendern automatisch
 * per KI-Detektion bestimmt (und später im „Position ändern"-Modus editierbar).
 */
export interface BBox {
  x: number
  y: number
  w: number
  h: number
  polygon?: number[][]
}

/** Ein strukturierter Möbelwunsch aus dem Eingabeformular. */
export interface FurnitureWish {
  art: string // Möbelart (Pflicht), z. B. "Schwebendes TV-Board"
  position?: string // gewünschte Position (Freitext, optional) – z. B. "rechte Wand"
  material?: string
  farbe?: string
  masse?: string
  zusatz?: string // zusätzliche Wünsche / Funktion
}

/** Eingabe zum Anlegen eines Raumprojekts. */
export interface RoomProjectInput {
  name: string
  roomType: string | null // Label oder id
  style: string | null // Label oder Freitext
  description: string | null
  photo: File
  wishes: FurnitureWish[]
}

/** Ein Raumprojekt (Tabelle room_projects) inkl. berechneter Anzeigefelder. */
export interface RoomProject {
  id: string
  user_id: string
  name: string
  room_type: string | null
  style: string | null
  description: string | null
  photo_path: string | null
  result_image_url: string | null
  status: RoomProjectStatus
  render_error?: string | null
  render_model?: string | null
  created_at: string
  // — berechnet, nicht in der DB —
  photoUrl?: string | null
  productCount?: number
  selectedCount?: number
}

/** Ergebnis des Raum-Renderings (vom RoomRenderService / Edge Function). */
export interface RoomRenderResult {
  resultImageUrl: string | null
  products: { productId: string; bbox: BBox | null }[]
  model: string | null
  prompt: string | null
  status: 'ready' | 'failed'
  error: string | null
}

/** Auswählbare Stile (mit Freitext-Option in der UI). */
export const ROOM_STYLES: { id: string; label: string }[] = [
  { id: 'minimalistisch', label: 'Minimalistisch' },
  { id: 'modern', label: 'Modern' },
  { id: 'japandi', label: 'Japandi' },
  { id: 'skandinavisch', label: 'Skandinavisch' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'klassisch', label: 'Klassisch' },
  { id: 'luxurioes', label: 'Luxuriös' },
]

/** Auswählbare Raumtypen. */
export const ROOM_TYPES: { id: string; label: string }[] = [
  { id: 'wohnzimmer', label: 'Wohnzimmer' },
  { id: 'schlafzimmer', label: 'Schlafzimmer' },
  { id: 'buero', label: 'Büro' },
  { id: 'esszimmer', label: 'Esszimmer' },
  { id: 'kinderzimmer', label: 'Kinderzimmer' },
  { id: 'ankleidezimmer', label: 'Ankleidezimmer' },
]

export const labelOfStyle = (v: string | null) =>
  ROOM_STYLES.find((s) => s.id === v)?.label ?? v ?? null
export const labelOfRoom = (v: string | null) =>
  ROOM_TYPES.find((s) => s.id === v)?.label ?? v ?? null

const BUCKET = 'idea-images'
const MAX_BYTES = 25 * 1024 * 1024 // 25 MB Original (wird vor dem Upload verkleinert)
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

/** Validiert das Raumfoto (Format + Größe). Wirft mit klarer Meldung. */
export function validateRoomPhoto(file: File): void {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Bitte lade ein Bild im Format JPG, PNG oder WebP hoch.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Die Datei ist zu groß (max. 25 MB). Bitte wähle ein kleineres Bild.')
  }
}

/**
 * Verkleinert ein Bild clientseitig auf max. `maxDim` px Kantenlänge und kodiert
 * es als JPEG. Das reduziert die Upload-Größe drastisch (verhindert „Load failed"
 * bei großen Handy-Fotos) und beschleunigt die gesamte Pipeline. Bei jedem Fehler
 * wird die Originaldatei zurückgegeben (kein Funktionsverlust).
 */
async function downscaleToJpeg(file: File, maxDim = 2048, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality))
    return blob && blob.size > 0 ? blob : file
  } catch {
    return file
  }
}

/**
 * Lädt das (verkleinerte) Raumfoto in den privaten Bucket hoch – mit einem
 * Retry und klarer Fehlermeldung. Gibt den Objekt-Pfad zurück.
 */
async function uploadRoomPhoto(userId: string, file: File): Promise<string> {
  const body = await downscaleToJpeg(file)
  const path = `${userId}/room/${crypto.randomUUID()}.jpg`
  let lastError = ''
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, body, { contentType: 'image/jpeg', upsert: true })
    if (!error) return path
    lastError = error.message
    console.error(`[room-upload] Versuch ${attempt} fehlgeschlagen:`, error.message)
  }
  throw new Error(
    `Foto-Upload fehlgeschlagen: ${lastError}. Bitte prüfe deine Internetverbindung und ` +
      'versuche es erneut (ggf. mit einem kleineren Bild).',
  )
}

/** Baut aus einem Möbelwunsch + Raumkontext einen präzisen Produkt-Prompt. */
export function buildProductPrompt(
  wish: FurnitureWish,
  styleLabel: string | null,
  roomLabel: string | null,
): string {
  let head = wish.art.trim()
  if (wish.material?.trim()) head += ` aus ${wish.material.trim()}`
  if (wish.farbe?.trim()) head += ` in ${wish.farbe.trim()}`

  const extra: string[] = []
  if (wish.masse?.trim()) extra.push(`Maße ca. ${wish.masse.trim()}`)
  if (wish.position?.trim()) extra.push(`Position im Raum: ${wish.position.trim()}`)
  if (styleLabel) extra.push(`Stil: ${styleLabel}`)
  if (roomLabel) extra.push(`für das ${roomLabel}`)
  if (wish.zusatz?.trim()) extra.push(wish.zusatz.trim())

  return extra.length ? `${head}. ${extra.join('. ')}.` : `${head}.`
}

async function signedPhotoUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

/**
 * Legt ein Raumprojekt an: lädt das Foto hoch, erstellt das Projekt und je einen
 * (noch unverarbeiteten) Möbel-Datensatz pro Wunsch. Die eigentliche KI-Erzeugung
 * der Produkte stößt die Ergebnisseite an (resilient bei Reload).
 */
export async function createRoomProject(input: RoomProjectInput): Promise<RoomProject> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')
  if (input.wishes.length === 0) throw new Error('Bitte füge mindestens ein Möbelstück hinzu.')

  validateRoomPhoto(input.photo)

  // 1) Foto verkleinern + hochladen (privat, pro Nutzer-Ordner; robust mit Retry).
  const photoPath = await uploadRoomPhoto(user.id, input.photo)

  // 2) Raumprojekt anlegen.
  const styleLabel = labelOfStyle(input.style)
  const roomLabel = labelOfRoom(input.roomType)
  const { data: project, error: projErr } = await supabase
    .from('room_projects')
    .insert({
      user_id: user.id,
      name: input.name.trim() || (roomLabel ? `${roomLabel}-Projekt` : 'Mein Raum'),
      room_type: input.roomType,
      style: input.style,
      description: input.description,
      photo_path: photoPath,
      status: 'processing',
    })
    .select()
    .single()
  if (projErr) throw new Error(`Raumprojekt konnte nicht angelegt werden: ${projErr.message}`)

  // 3) Je Wunsch ein Möbel-Datensatz (Idee) – status 'pending' für die KI.
  const rows = input.wishes.map((w) => ({
    user_id: user.id,
    prompt: buildProductPrompt(w, styleLabel, roomLabel),
    style: input.style,
    materials: [] as string[],
    category: null as string | null,
    status: 'pending',
    room_project_id: project.id,
    room_position: w.position ?? null,
    // room_bbox bleibt zunächst null → wird nach dem Rendern per KI-Detektion gesetzt.
    room_selected: true,
  }))
  const { error: prodErr } = await supabase.from('ideas').insert(rows)
  if (prodErr) throw new Error(`Möbel konnten nicht angelegt werden: ${prodErr.message}`)

  return project as RoomProject
}

/** Lädt die Möbel-Produkte (Ideen) eines Raumprojekts, älteste zuerst. */
export async function listRoomProducts(projectId: string): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select()
    .eq('room_project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`Raum-Produkte konnten nicht geladen werden: ${error.message}`)
  return (data ?? []) as Idea[]
}

/** Lädt ein einzelnes Raumprojekt inkl. signierter Foto-URL. */
export async function getRoomProject(id: string): Promise<RoomProject | null> {
  const { data, error } = await supabase
    .from('room_projects')
    .select()
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`Raumprojekt konnte nicht geladen werden: ${error.message}`)
  if (!data) return null
  const project = data as RoomProject
  project.photoUrl = await signedPhotoUrl(project.photo_path)
  return project
}

/** Lädt alle Raumprojekte des Nutzers inkl. Foto + Produktzahlen (Dashboard). */
export async function listRoomProjects(): Promise<RoomProject[]> {
  const { data, error } = await supabase
    .from('room_projects')
    .select()
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Raumprojekte konnten nicht geladen werden: ${error.message}`)
  const projects = (data ?? []) as RoomProject[]
  if (projects.length === 0) return []

  // Produktzahlen in EINER Abfrage sammeln.
  const { data: prods } = await supabase
    .from('ideas')
    .select('room_project_id, room_selected')
    .in(
      'room_project_id',
      projects.map((p) => p.id),
    )
  const counts = new Map<string, { total: number; selected: number }>()
  for (const p of prods ?? []) {
    const c = counts.get(p.room_project_id) ?? { total: 0, selected: 0 }
    c.total += 1
    if (p.room_selected) c.selected += 1
    counts.set(p.room_project_id, c)
  }

  return Promise.all(
    projects.map(async (p) => ({
      ...p,
      photoUrl: await signedPhotoUrl(p.photo_path),
      productCount: counts.get(p.id)?.total ?? 0,
      selectedCount: counts.get(p.id)?.selected ?? 0,
    })),
  )
}

/**
 * Startet das fotorealistische Raum-Rendering (Edge Function 'render-room').
 * Products-first: setzt die bereits entwickelten Möbel serverseitig via GPT Image
 * ins echte Raumfoto. Schreibt Ergebnis/Status in room_projects zurück.
 */
// Client-Timeout, damit die Oberfläche NIE unbegrenzt lädt (Bild + Detektion
// dauern typ. 60–150 s; danach klarer Fehler statt Endlos-Ladezustand).
const RENDER_TIMEOUT_MS = 180000

function renderFailed(error: string): RoomRenderResult {
  return { resultImageUrl: null, products: [], model: null, prompt: null, status: 'failed', error }
}

interface ErrorBody {
  httpStatus: number | null
  raw: string
  parsed: Record<string, unknown> | null
}

/**
 * Liest den ECHTEN Response-Body eines FunctionsHttpError aus (`error.context`
 * ist die Response). Robust: erst Text lesen (Body ist nur einmal lesbar), dann
 * als JSON parsen. So gehen weder JSON noch reiner Text verloren.
 */
async function readErrorBody(err: unknown): Promise<ErrorBody> {
  const ctx = (err as { context?: unknown } | null)?.context
  if (!ctx || typeof (ctx as Response).text !== 'function') {
    return { httpStatus: null, raw: '', parsed: null }
  }
  const res = ctx as Response
  const httpStatus = typeof res.status === 'number' ? res.status : null
  let raw: string
  try {
    raw = await res.text()
  } catch {
    return { httpStatus, raw: '', parsed: null }
  }
  let parsed: Record<string, unknown> | null
  try {
    parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null
  } catch {
    parsed = null
  }
  return { httpStatus, raw, parsed }
}

/** Wählt die aussagekräftigste serverseitige Meldung (error → message → details → Rohtext). */
function pickServerMessage(body: ErrorBody): string | null {
  const p = body.parsed
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  return (
    str(p?.error) ??
    str(p?.message) ??
    str(p?.details) ??
    (body.raw ? body.raw.slice(0, 600) : null)
  )
}

export async function renderRoom(projectId: string): Promise<RoomRenderResult> {
  console.log('[render-room] Ablauf gestartet', { projectId })
  if (!projectId) {
    console.error('[render-room] Abbruch: projectId fehlt')
    return renderFailed('Interner Fehler: projectId fehlt.')
  }
  try {
    console.log('[render-room] Function wird jetzt aufgerufen: invoke("render-room")')
    const invocation = supabase.functions.invoke<RoomRenderResult>('render-room', {
      body: { projectId },
    })
    const timeout = new Promise<never>((resolve, reject) => {
      void resolve
      setTimeout(() => reject(new Error('__render_timeout__')), RENDER_TIMEOUT_MS)
    })
    const { data, error } = await Promise.race([invocation, timeout])

    if (error) {
      // Echten Response-Body der Edge Function auslesen (statt generischer Meldung).
      const body = await readErrorBody(error)
      console.error('[render-room] Function-Fehler (non-2xx)', {
        httpStatus: body.httpStatus,
        error: body.parsed?.error ?? null,
        message: body.parsed?.message ?? null,
        details: body.parsed?.details ?? null,
        body: body.raw,
        supabaseMessage: error.message,
      })
      const serverMsg = pickServerMessage(body)
      const statusPrefix = body.httpStatus ? `HTTP ${body.httpStatus}: ` : ''
      return renderFailed(
        serverMsg
          ? `${statusPrefix}${serverMsg}`
          : error.message || 'Aufruf der Render-Function fehlgeschlagen.',
      )
    }

    console.log('[render-room] Function-Antwort', { data })
    if (!data) return renderFailed('Keine Antwort vom Render-Service.')
    return data
  } catch (e) {
    const timedOut = e instanceof Error && e.message === '__render_timeout__'
    // Auch bei Fetch-/Relay-Fehlern versuchen, einen Body zu lesen.
    const body = await readErrorBody(e)
    console.error('[render-room] Fehler beim Aufruf', {
      timedOut,
      httpStatus: body.httpStatus,
      body: body.raw,
      message: e instanceof Error ? e.message : String(e),
    })
    const msg = timedOut
      ? 'Zeitüberschreitung: Das Raumbild konnte nicht in der erwarteten Zeit erzeugt werden.'
      : (pickServerMessage(body) ??
        (e instanceof Error ? e.message : 'Unbekannter Fehler beim Raum-Rendering.'))
    return renderFailed(msg)
  }
}

/**
 * Persistiert einen Render-Fehlversuch (Status + Ursache) – auch wenn die Edge
 * Function gar nicht erreicht wurde. So bleibt die Oberfläche nicht im
 * „rendering"-Zustand hängen, sondern zeigt den Fehler mit „Erneut versuchen".
 */
export async function markRoomFailed(projectId: string, error: string): Promise<void> {
  const { error: dbError } = await supabase
    .from('room_projects')
    .update({ status: 'failed', render_error: error })
    .eq('id', projectId)
  if (dbError) console.error('[render-room] Fehlerstatus konnte nicht gespeichert werden', dbError)
}

/** Setzt die Auswahl eines Raum-Produkts (für die Bestellung). */
export async function setProductSelected(ideaId: string, selected: boolean): Promise<void> {
  const { error } = await supabase
    .from('ideas')
    .update({ room_selected: selected })
    .eq('id', ideaId)
  if (error) throw new Error(`Auswahl konnte nicht gespeichert werden: ${error.message}`)
}

/** Aktualisiert den Status eines Raumprojekts (processing → rendering → ready / failed). */
export async function setRoomProjectStatus(
  id: string,
  status: RoomProjectStatus,
): Promise<void> {
  const { error } = await supabase.from('room_projects').update({ status }).eq('id', id)
  if (error) throw new Error(`Status konnte nicht gesetzt werden: ${error.message}`)
}
