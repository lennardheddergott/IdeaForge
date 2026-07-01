import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderOpen,
  Package,
  Plus,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { Toast } from '@/components/ui/Toast'
import { cn, formatDate, formatEUR } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { getMyProfile } from '@/lib/profile'
import { listMyProjects, type Project } from '@/lib/projects'

export function Dashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  // Letzter bekannter Status je Projekt – um Statuswechsel zu erkennen.
  const prevStatus = useRef<Map<string, string>>(new Map())

  // Anzeigename aus dem Profil (Fallback: E-Mail).
  useEffect(() => {
    let cancelled = false
    getMyProfile()
      .then((p) => {
        if (!cancelled) setName(p?.full_name ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Echte Projekte laden und alle 8 s automatisch aktualisieren (Live-Status).
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      try {
        const data = await listMyProjects()
        if (cancelled) return
        const prev = prevStatus.current
        if (prev.size > 0) {
          for (const p of data) {
            const before = prev.get(p.id)
            if (before && before !== p.status.key) {
              setToast(`„${p.title}“ · ${p.status.label}`)
              break
            }
          }
        }
        prevStatus.current = new Map(data.map((p) => [p.id, p.status.key]))
        setProjects(data)
      } catch {
        if (!cancelled) setProjects((cur) => cur ?? [])
      } finally {
        if (!cancelled) timer = setTimeout(load, 8000)
      }
    }
    load()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  const stats = useMemo(() => {
    const list = projects ?? []
    return [
      { label: 'Projekte', value: list.length, icon: FolderOpen },
      {
        label: 'In Produktion',
        value: list.filter((p) => p.status.key === 'in_production').length,
        icon: Clock,
      },
      {
        label: 'Abgeschlossen',
        value: list.filter((p) => p.status.key === 'completed').length,
        icon: CheckCircle2,
      },
    ]
  }, [projects])

  const greeting = name ?? user?.email ?? ''

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-cream to-white" />

      <Container className="py-14 sm:py-16">
        {/* header */}
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {greeting && (
                <p className="text-sm text-ink-400">Willkommen zurück, {greeting}</p>
              )}
              <h1 className="mt-1 text-3xl font-semibold text-ink-950 sm:text-4xl">
                Meine Projekte
              </h1>
            </div>
            <Button to="/create" className="group">
              <Plus size={18} /> Neue Idee
            </Button>
          </div>
        </Reveal>

        {/* stats (nur wenn es Projekte gibt) */}
        {projects && projects.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.05}>
                <Card className="p-5" hover>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-white">
                    <s.icon size={16} />
                  </span>
                  <p className="mt-4 text-3xl font-semibold text-ink-950">{s.value}</p>
                  <p className="mt-0.5 text-sm text-ink-400">{s.label}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        )}

        {/* Projektübersicht */}
        <Reveal>
          <Card className="mt-8 p-7">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
              <Package size={18} className="text-accent-600" /> Projektübersicht
            </h2>

            {projects === null ? (
              <p className="mt-6 text-sm text-ink-400">Lädt …</p>
            ) : projects.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {projects.map((p) => (
                  <ProjectRow key={p.id} project={p} />
                ))}
              </div>
            )}
          </Card>
        </Reveal>
      </Container>

      <Toast message={toast} tone="info" onClose={() => setToast(null)} />
    </div>
  )
}

/* ───────────── Teilkomponenten ───────────── */

function EmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-accent-600 shadow-soft">
        <Package size={26} />
      </span>
      <div>
        <p className="text-lg font-semibold text-ink-950">
          Du hast noch keine Projekte erstellt.
        </p>
        <p className="mt-1 text-sm text-ink-500">
          Beschreibe dein Wunschmöbel – die KI erstellt Visualisierung,
          Konzeptblatt und Preisabschätzung.
        </p>
      </div>
      <Button to="/create" size="lg" className="group">
        <Plus size={18} /> Erste Idee erstellen
        <ArrowRight
          size={18}
          className="transition-transform duration-300 group-hover:translate-x-0.5"
        />
      </Button>
    </div>
  )
}

function ProjectRow({ project: p }: { project: Project }) {
  return (
    <Link
      to={`/result/${p.id}`}
      className="group flex gap-4 rounded-2xl border border-ink-100 p-4 transition-colors hover:border-ink-200 hover:bg-ink-50/40"
    >
      <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-50 sm:block">
        {p.previewUrl ? (
          <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ink-300">
            <Package size={22} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-ink-950">{p.title}</h3>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
              p.status.color,
            )}
          >
            {p.status.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-400">
          {p.category} · {formatDate(p.createdAt)}
          {p.price ? ` · ca. ${formatEUR(p.price.min)}–${formatEUR(p.price.max)}` : ''}
        </p>
        <p className="mt-2 line-clamp-1 text-sm text-ink-500">{p.description}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-600 group-hover:text-accent-700">
          Details ansehen
          <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  )
}
