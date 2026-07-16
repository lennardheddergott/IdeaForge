import { Box, FileText, Layers, Package, Ruler, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatEUR } from '@/lib/utils'
import type { Order } from '@/lib/orders'

/**
 * Geteilte Detail-Anzeige eines Auftrags: Visualisierung + Konzeptblatt sowie
 * die strukturierten Spec-Daten (Beschreibung, Preis, Material, Maße, Details).
 * Wird von der Kunden- UND der Hersteller-Detailseite genutzt.
 *
 * `audience` steuert nur den Wortlaut der verbindlichen Fertigungsgrundlage:
 * Für den Kunden mit Prüf-Aufforderung, für den Hersteller rein informativ.
 */
export function OrderArtifacts({
  order,
  audience = 'customer',
}: {
  order: Order
  audience?: 'customer' | 'manufacturer'
}) {
  const spec = order.concept
  const preview = order.preview_image_url
  const sheet = order.concept_sheet_url

  const masse: { label: string; value: string }[] = []
  if (spec?.masse.breite_cm) masse.push({ label: 'Breite', value: `${spec.masse.breite_cm} cm` })
  if (spec?.masse.hoehe_cm) masse.push({ label: 'Höhe', value: `${spec.masse.hoehe_cm} cm` })
  if (spec?.masse.tiefe_cm) masse.push({ label: 'Tiefe', value: `${spec.masse.tiefe_cm} cm` })
  for (const w of spec?.masse.weitere ?? []) masse.push({ label: w.label, value: w.wert })

  return (
    <div className="flex flex-col gap-8">
      {/* Bilder */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Figure
          src={preview}
          caption="Visualisierung"
          note="Die Visualisierung dient der Veranschaulichung und vermittelt einen möglichst realistischen Eindruck des fertigen Produkts."
        />
        <Figure
          src={sheet}
          caption="Verbindliches Konzeptblatt"
          note="Dieses Konzeptblatt bildet die verbindliche Grundlage für die Herstellung deines Produkts."
        />
      </div>

      {/* Verbindliche Fertigungsgrundlage – dezente Info-Box im Website-Stil */}
      <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-accent-600 shadow-soft">
            <FileText size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-950">Verbindliche Fertigungsgrundlage</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              {audience === 'manufacturer'
                ? 'Die Fertigung erfolgt ausschließlich auf Grundlage des verbindlichen Konzeptblatts. Die Visualisierung dient rein informativen Zwecken.'
                : 'Die Herstellung erfolgt ausschließlich anhand des technischen Konzeptblatts. Die Visualisierung dient zur besseren Vorstellung des Produkts. Bitte prüfe das Konzeptblatt sorgfältig, bevor du deinen Auftrag freigibst.'}
            </p>
          </div>
        </div>
      </div>

      {/* Beschreibung */}
      <Card className="p-7">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
          <Box size={18} className="text-accent-600" /> Kundenbeschreibung
        </h2>
        <p className="mt-3 text-pretty leading-relaxed text-ink-600">
          {order.description}
        </p>
        {spec?.kurzbeschreibung && (
          <p className="mt-3 border-t border-ink-100 pt-3 text-sm leading-relaxed text-ink-500">
            {spec.kurzbeschreibung}
          </p>
        )}
      </Card>

      {/* Geschätzter Preis – aus der tatsächlichen Herstellerkalkulation (beim
          Bestellen festgehalten). KEINE separate KI-/Fallback-Schätzung mehr. */}
      {spec?.selected_variant && spec.selected_variant.price_from > 0 && (
        <Card className="p-7">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
            <Sparkles size={18} className="text-accent-600" /> Geschätzter Preis
          </h2>
          <p className="mt-3 text-3xl font-semibold text-ink-950">
            {spec.selected_variant.price_to
              ? `${formatEUR(spec.selected_variant.price_from)} – ${formatEUR(spec.selected_variant.price_to)}`
              : `ab ${formatEUR(spec.selected_variant.price_from)}`}
          </p>
          <p className="mt-1 text-sm text-ink-400">
            Variante · {spec.selected_variant.title}
          </p>
          <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
            Auf Basis der tatsächlichen Herstellerkalkulation – identische
            Berechnungsgrundlage wie in der Herstelleransicht.
          </p>
        </Card>
      )}

      {/* Material + Maße */}
      {spec && (spec.materialien.length > 0 || masse.length > 0) && (
        <div className="grid gap-8 lg:grid-cols-2">
          {spec.materialien.length > 0 && (
            <Card className="h-full p-7">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
                <Layers size={18} className="text-accent-600" /> Materialien
              </h2>
              <dl className="mt-4 divide-y divide-ink-100">
                {spec.materialien.map((m) => (
                  <div key={m.bauteil} className="flex items-center justify-between py-2.5">
                    <dt className="text-sm text-ink-500">{m.bauteil}</dt>
                    <dd className="text-sm font-medium text-ink-900">{m.material}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {masse.length > 0 && (
            <Card className="h-full p-7">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
                <Ruler size={18} className="text-accent-600" /> Maße
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {masse.map((dim) => (
                  <div
                    key={dim.label}
                    className="rounded-xl border border-ink-100 bg-ink-50/50 p-4"
                  >
                    <p className="text-xs text-ink-400">{dim.label}</p>
                    <p className="mt-1 text-lg font-semibold text-ink-950">{dim.value}</p>
                  </div>
                ))}
              </div>
              {spec.anzahl_bauteile > 0 && (
                <p className="mt-4 flex items-center gap-2 text-sm text-ink-500">
                  <Package size={15} /> {spec.anzahl_bauteile} Bauteile ·{' '}
                  Komplexität {spec.komplexitaet}
                </p>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Konstruktion & Details */}
      {spec && (spec.konstruktion || spec.besondere_details.length > 0) && (
        <Card className="p-7">
          <h2 className="text-lg font-semibold text-ink-950">Konstruktion &amp; Details</h2>
          {spec.konstruktion && (
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{spec.konstruktion}</p>
          )}
          {spec.besondere_details.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {spec.besondere_details.map((d) => (
                <li
                  key={d}
                  className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600"
                >
                  {d}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}

/** Ein klickbares Bild mit Bildunterschrift + dezentem Hinweis; Platzhalter ohne URL. */
function Figure({
  src,
  caption,
  note,
}: {
  src: string | null
  caption: string
  note?: string
}) {
  return (
    <figure className="flex flex-col gap-2">
      {src ? (
        <a href={src} target="_blank" rel="noopener noreferrer" className="group block">
          <img
            src={src}
            alt={caption}
            className="aspect-[4/3] w-full rounded-2xl border border-ink-100 bg-white object-contain p-2 shadow-soft transition-shadow group-hover:shadow-lift"
          />
        </a>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-ink-100 bg-ink-50 text-ink-300">
          <Package size={28} />
        </div>
      )}
      <figcaption className="text-center text-xs font-medium text-ink-500">{caption}</figcaption>
      {note && (
        <p className="mx-auto max-w-[42ch] text-center text-[11px] leading-relaxed text-ink-400">
          {note}
        </p>
      )}
    </figure>
  )
}
