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
export type IdeaStatus = 'draft' | 'pending' | 'generated' | 'failed'

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
  /** Öffentliche URL der generierten Konzeptskizze (null, solange nicht fertig). */
  image_url: string | null
  /** Fehlerursache, falls status === 'failed'. */
  error: string | null
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
    image_url?: string
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
