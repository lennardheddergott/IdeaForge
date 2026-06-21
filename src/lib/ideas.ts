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
  status: 'draft' | 'generated'
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
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw new Error(`Idee konnte nicht gespeichert werden: ${error.message}`)
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
