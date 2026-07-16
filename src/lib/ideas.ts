import { supabase } from '@/lib/supabase'

/** Eingabe aus dem CreateIdea-Formular. */
export interface IdeaInput {
  prompt: string
  style: string | null
  materials: string[] // Materialpräferenzen (options.ts → materials.id)
  category: string | null
  budget: string | null // optional (options.ts → budgets.id)
  images: File[] // Inspirationsbilder, optional
}

/** Lebenszyklus der KI-Bildgenerierung (vgl. schema.sql). */
export type IdeaStatus =
  | 'draft'
  | 'pending'
  | 'generated'
  | 'failed'
  | 'rejected' // themenfremde Eingabe (kein Möbelstück)

/** Strukturierte Produktspezifikation (von der Edge Function erzeugt). */
export interface ProductSpec {
  ist_moebel: boolean
  ablehnung?: string
  titel: string
  kategorie: string
  kurzbeschreibung: string
  masse: {
    breite_cm?: number | null
    hoehe_cm?: number | null
    tiefe_cm?: number | null
    weitere?: { label: string; wert: string }[]
  }
  materialien: { bauteil: string; material: string }[]
  farben: string[]
  bauteile: string[]
  anzahl_bauteile: number
  konstruktion: string
  besondere_details: string[]
  komplexitaet: 'niedrig' | 'mittel' | 'hoch'
  fertigungsaufwand_stunden: number
  preis: { min: number; max: number; waehrung: string; hinweis: string }

  // ── Phase 2: strukturierte Analyse für die Varianten-Ableitung ──
  // Alle optional (Abwärtskompatibilität mit vor Phase 2 erzeugten Ideen).
  /** Möbelart, z. B. "TV-Board", "Esstisch", "Schreibtisch". */
  produktart?: string
  /**
   * Material-Absicht des Nutzers:
   *  wood_look  = Holz-/Eichenoptik erlaubt (z. B. "Eichenoptik")
   *  real_wood  = echtes Holz gewünscht, aber unklar ("Eiche")
   *  solid_wood = ausdrücklich Massivholz ("massive Eiche", "Massivholz")
   */
  material_absicht?: 'wood_look' | 'real_wood' | 'solid_wood' | 'metal' | 'glass' | 'mixed'
  /** true nur, wenn der Nutzer ausdrücklich Massivholz/echtes Holz verlangt. */
  material_muss_echt?: boolean
  /** Primäre Holzart (z. B. 'eiche', 'nussbaum') – optional; sonst aus Text erkannt. */
  holzart?: string
  /** budget = "günstig/nicht zu teuer", premium = "hochwertig/edel". */
  preis_absicht?: 'budget' | 'flexible' | 'premium'
  features?: string[]
  anzahl_tueren?: number
  anzahl_schubladen?: number
  /** Vom Kunden gewählte Umsetzungsvariante (im Auftrags-Snapshot). */
  selected_variant?: {
    tier: string
    title: string
    material: string
    /** Untere/obere Grenze der Preisspanne aus der Herstellerkalkulation. */
    price_from: number
    price_to?: number
  } | null
}

/** Eine in der DB gespeicherte Idee. */
export interface Idea {
  id: string
  user_id: string
  prompt: string
  style: string | null
  materials: string[]
  category: string | null
  budget: string | null
  image_paths: string[]
  status: IdeaStatus
  /** Alt/Abwärtskompatibilität: gespiegelt = concept_sheet_url. */
  image_url: string | null
  /** Öffentliche URL des technischen Konzeptblatts (null, solange nicht fertig). */
  concept_sheet_url: string | null
  /** Öffentliche URL der fotorealistischen Produktvorschau (null, solange nicht fertig). */
  preview_image_url: string | null
  /** Fehlerursache (status 'failed') bzw. freundliche Ablehnung (status 'rejected'). */
  error: string | null
  /** Strukturierte KI-Spezifikation (Quelle für Preis & Anzeige); null bis fertig. */
  concept: ProductSpec | null
  /** Versionierung: Wurzel-Idee der Versionskette (null = selbst Version 1). */
  root_idea_id: string | null
  /** Fortlaufende Versionsnummer innerhalb der Kette (1 = erste Erstellung). */
  version_number: number
  /** Beschreibung der Änderung, die zu dieser Version geführt hat (null bei V1). */
  change_note: string | null
  /** Verknüpftes Raumprojekt (null = normale Einzelidee). */
  room_project_id: string | null
  /** Position des Möbels im Raum (Freitext, nur bei Raum-Produkten). */
  room_position: string | null
  /**
   * Vom Nutzer markierte Zielregion im Raumfoto (normalisiert 0..1). Dient als
   * Platzierungshinweis fürs Rendering UND als unsichtbare Klickfläche (Hotspot).
   */
  room_bbox: { x: number; y: number; w: number; h: number; polygon?: number[][] } | null
  /** Vom Kunden für die Bestellung ausgewählt (nur bei Raum-Produkten relevant). */
  room_selected: boolean
  created_at: string
}

const BUCKET = 'idea-images'

/**
 * Lädt die Inspirationsbilder in den Storage-Bucket hoch (Pfad <user_id>/<…>)
 * und gibt die Objekt-Pfade zurück.
 */
async function uploadImages(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const ext = file.name.split('.').pop() ?? 'bin'
    // Eindeutiger, kollisionsfreier Pfad pro Datei (ohne Date/Math.random).
    const path = `${userId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file)
    if (error) throw new Error(`Bild-Upload fehlgeschlagen: ${error.message}`)
    paths.push(path)
  }
  return paths
}

/** Speichert eine neue Idee des aktuell eingeloggten Nutzers. */
export async function createIdea(input: IdeaInput): Promise<Idea> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const image_paths =
    input.images.length > 0 ? await uploadImages(user.id, input.images) : []

  const { data, error } = await supabase
    .from('ideas')
    .insert({
      user_id: user.id,
      prompt: input.prompt,
      style: input.style,
      materials: input.materials,
      category: input.category,
      budget: input.budget,
      image_paths,
      // 'pending' = gespeichert, KI-Konzeptskizze wird gleich erzeugt.
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw new Error(`Idee konnte nicht gespeichert werden: ${error.message}`)
  return data as Idea
}

/**
 * Stößt die KI-Bildgenerierung für eine Idee an (Edge Function 'generate-sketch').
 * Die Function erzeugt die Konzeptskizze, legt sie im Storage ab und schreibt
 * image_url + status zurück in die DB. Gibt die aktualisierte Idee zurück.
 */
export async function requestSketch(ideaId: string): Promise<Idea> {
  const { data, error } = await supabase.functions.invoke<{
    status: IdeaStatus
    concept_sheet_url?: string
    preview_image_url?: string
    message?: string
    error?: string
  }>('generate-sketch', { body: { ideaId } })

  // Netzwerk-/HTTP-Fehler beim Aufruf der Function selbst.
  if (error) {
    throw new Error(
      `Bildgenerierung konnte nicht gestartet werden: ${error.message}`,
    )
  }
  // Die Function meldet einen fachlichen Fehler (z. B. OpenAI-Fehler).
  if (data?.status === 'failed') {
    throw new Error(data.error ?? 'Bildgenerierung fehlgeschlagen.')
  }
  // 'rejected' (themenfremd) ist KEIN Fehler – die aktualisierte Idee
  // (status 'rejected' + freundliche Meldung in error) wird normal geladen.

  return getIdea(ideaId)
}

/** Lädt eine einzelne Idee des aktuell eingeloggten Nutzers. */
export async function getIdea(id: string): Promise<Idea> {
  const { data, error } = await supabase
    .from('ideas')
    .select()
    .eq('id', id)
    .single()

  if (error) throw new Error(`Idee konnte nicht geladen werden: ${error.message}`)
  return data as Idea
}

/** Lädt alle Ideen des aktuell eingeloggten Nutzers (neueste zuerst). */
export async function listIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select()
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Ideen konnten nicht geladen werden: ${error.message}`)
  return (data ?? []) as Idea[]
}

/** Wurzel-Idee einer Versionskette. */
function rootIdOf(idea: Idea): string {
  return idea.root_idea_id ?? idea.id
}

/**
 * Lädt alle Versionen einer Idee (Version 1 … n) in aufsteigender Reihenfolge.
 * Jede Version ist eine eigenständige, vollständig generierte Idee (mit eigenem
 * Renderbild, Konzeptblatt und Spec) – dadurch bleiben Bild & Konzeptblatt je
 * Version immer synchron.
 */
export async function listVersions(idea: Idea): Promise<Idea[]> {
  const rootId = rootIdOf(idea)
  const { data, error } = await supabase
    .from('ideas')
    .select()
    .or(`id.eq.${rootId},root_idea_id.eq.${rootId}`)
    .order('version_number', { ascending: true })

  if (error) throw new Error(`Versionen konnten nicht geladen werden: ${error.message}`)
  return (data ?? []) as Idea[]
}

/**
 * Erstellt aus einer bestehenden Version eine NEUE Version (Version +1) mit einem
 * Änderungswunsch. Die bisherige Version bleibt unverändert erhalten. Die neue
 * Idee wird mit status 'pending' angelegt; der Aufrufer muss anschließend
 * requestSketch(neueId) aufrufen, damit Renderbild, Konzeptblatt und Spec
 * gemeinsam (synchron) neu erzeugt werden.
 */
export async function createVersion(
  from: Idea,
  changeText: string,
  sketchFiles: File[] = [],
): Promise<Idea> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const rootId = rootIdOf(from)

  // Höchste bisherige Versionsnummer der Kette ermitteln.
  const { data: siblings, error: sibErr } = await supabase
    .from('ideas')
    .select('version_number')
    .or(`id.eq.${rootId},root_idea_id.eq.${rootId}`)
  if (sibErr) throw new Error(`Versionen konnten nicht geladen werden: ${sibErr.message}`)
  const maxNum = Math.max(
    1,
    ...(siblings ?? []).map((s) => (s as { version_number?: number }).version_number ?? 1),
  )

  const sketchPaths =
    sketchFiles.length > 0 ? await uploadImages(user.id, sketchFiles) : []

  // Änderungswunsch an die bisherige Beschreibung anhängen (kumulativer Entwurf).
  const newPrompt = `${from.prompt}\n\nÄnderung: ${changeText}`

  const { data, error } = await supabase
    .from('ideas')
    .insert({
      user_id: user.id,
      prompt: newPrompt,
      style: from.style,
      materials: from.materials,
      category: from.category,
      budget: from.budget,
      image_paths: sketchPaths,
      status: 'pending',
      root_idea_id: rootId,
      version_number: maxNum + 1,
      change_note: changeText,
    })
    .select()
    .single()

  if (error) throw new Error(`Neue Version konnte nicht erstellt werden: ${error.message}`)
  return data as Idea
}
