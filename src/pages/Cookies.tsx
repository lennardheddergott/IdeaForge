import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout'

export function Cookies() {
  return (
    <LegalLayout
      title="Cookie-Hinweis"
      updated="5. August 2026"
      intro={
        <p>
          Faiviq kommt ohne Tracking aus. Wir setzen keine Marketing- oder
          Analyse-Cookies und keine Werkzeuge zur Nutzerverfolgung ein. Zum
          Betrieb werden ausschließlich technisch notwendige
          Speichertechnologien in deinem Browser verwendet.
        </p>
      }
    >
      <LegalSection title="Warum kein Einwilligungs-Banner?">
        <p>
          Die eingesetzte Speicherung ist für die von dir angeforderten
          Funktionen (Anmeldung und Bedienung der Anwendung) unbedingt
          erforderlich. Nach § 25 Abs. 2 Nr. 2 TDDDG ist hierfür keine
          Einwilligung notwendig. Sollten wir künftig nicht notwendige Dienste
          (z. B. Analyse) einsetzen, holen wir zuvor deine ausdrückliche
          Einwilligung ein.
        </p>
      </LegalSection>

      <LegalSection title="Eingesetzte Speichertechnologien">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-ink-500">
                <th className="py-2 pr-4 font-medium">Name / Art</th>
                <th className="py-2 pr-4 font-medium">Zweck</th>
                <th className="py-2 font-medium">Speicherdauer</th>
              </tr>
            </thead>
            <tbody className="text-ink-600">
              <tr className="border-b border-ink-100 align-top">
                <td className="py-3 pr-4">
                  <code>sb-…-auth-token</code>
                  <br />
                  <span className="text-ink-400">(localStorage, Supabase)</span>
                </td>
                <td className="py-3 pr-4">
                  Hält deine Anmelde-Sitzung, damit du eingeloggt bleibst.
                </td>
                <td className="py-3">Bis zum Abmelden bzw. Ablauf der Sitzung.</td>
              </tr>
              <tr className="align-top">
                <td className="py-3 pr-4">
                  <code>ideaforge:draft</code>
                  <br />
                  <span className="text-ink-400">(sessionStorage)</span>
                </td>
                <td className="py-3 pr-4">
                  Speichert einen begonnenen Ideentext vorübergehend, falls vor
                  dem Fortfahren eine Anmeldung nötig ist.
                </td>
                <td className="py-3">Bis der Browser-Tab geschlossen wird.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="Kontrolle & Löschung">
        <p>
          Du kannst die lokal gespeicherten Daten jederzeit über die
          Einstellungen deines Browsers einsehen und löschen. Beachte, dass eine
          Löschung der Anmelde-Sitzung dazu führt, dass du erneut angemeldet
          werden musst. Weitere Informationen zur Verarbeitung findest du in
          unserer{' '}
          <a href="/datenschutz" className="text-accent-600 hover:text-accent-700">
            Datenschutzerklärung
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
