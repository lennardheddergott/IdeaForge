import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout'

export function Impressum() {
  return (
    <LegalLayout title="Impressum" updated="5. August 2026">
      <LegalSection title="Angaben gemäß § 5 DDG">
        <p>
          Lennard Heddergott
          <br />
          Dosborn 16
          <br />
          37351 Dingelstädt
          <br />
          Deutschland
        </p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          E-Mail:{' '}
          <a
            href="mailto:ms.heddergott.lh01@gmail.com"
            className="text-accent-600 hover:text-accent-700"
          >
            ms.heddergott.lh01@gmail.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        <p>
          Lennard Heddergott
          <br />
          Anschrift wie oben
        </p>
      </LegalSection>

      <LegalSection title="Hinweis zum Projektstatus">
        <p>
          Faiviq ist ein sich in Entwicklung befindliches Angebot. Über die
          Plattform werden derzeit keine kostenpflichtigen Bestellungen oder
          Zahlungen abgewickelt; sie dient der KI-gestützten Konzepterstellung
          und der Vermittlung von Anfragen an Fertigungspartner.
        </p>
      </LegalSection>

      <LegalSection title="EU-Streitschlichtung">
        <p>
          Die Europäische Kommission stellt eine Plattform zur
          Online-Streitbeilegung (OS) bereit:{' '}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-600 hover:text-accent-700"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          . Unsere E-Mail-Adresse findest du oben in diesem Impressum.
        </p>
      </LegalSection>

      <LegalSection title="Verbraucherstreitbeilegung / Universalschlichtungsstelle">
        <p>
          Wir sind nicht bereit und nicht verpflichtet, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </LegalSection>

      <LegalSection title="Haftung für Inhalte">
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte
          auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
          §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet,
          übermittelte oder gespeicherte fremde Informationen zu überwachen oder
          nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
          hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung
          von Informationen nach den allgemeinen Gesetzen bleiben hiervon
          unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
          Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
          Bekanntwerden entsprechender Rechtsverletzungen werden wir diese
          Inhalte umgehend entfernen.
        </p>
      </LegalSection>

      <LegalSection title="Haftung für Links">
        <p>
          Unser Angebot enthält gegebenenfalls Links zu externen Websites
          Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können
          wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die
          Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
          Betreiber der Seiten verantwortlich. Bei Bekanntwerden von
          Rechtsverletzungen werden wir derartige Links umgehend entfernen.
        </p>
      </LegalSection>

      <LegalSection title="Urheberrecht">
        <p>
          Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen
          Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
          Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
          jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite
          sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
