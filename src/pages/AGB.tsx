import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout'

export function AGB() {
  return (
    <LegalLayout
      title="Allgemeine Geschäftsbedingungen"
      updated="5. August 2026"
      intro={
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der
          Plattform Faiviq. Mit der Registrierung und Nutzung erklärst du dich
          mit diesen Bedingungen einverstanden.
        </p>
      }
    >
      <LegalSection title="1. Anbieter & Geltungsbereich">
        <p>
          Anbieter der Plattform ist Lennard Heddergott, Dosborn 16, 37351
          Dingelstädt (nachfolgend „wir"). Diese AGB gelten für sämtliche über
          Faiviq bereitgestellten Funktionen. Abweichende Bedingungen des
          Nutzers finden keine Anwendung, sofern wir ihrer Geltung nicht
          ausdrücklich zustimmen.
        </p>
      </LegalSection>

      <LegalSection title="2. Leistungsbeschreibung">
        <p>
          Faiviq ermöglicht es, Produktideen (insbesondere für individuelle
          Möbelstücke) in natürlicher Sprache zu beschreiben. Auf dieser
          Grundlage erzeugt die Anwendung KI-gestützt ein Designkonzept, Maße,
          Materialempfehlungen sowie eine unverbindliche Preisabschätzung und
          kann Anfragen an geeignete Fertigungspartner vermitteln.
        </p>
        <p>
          Über die Plattform werden derzeit keine kostenpflichtigen
          Bestellungen oder Zahlungen abgewickelt. Sollten künftig
          kostenpflichtige Funktionen eingeführt werden, gelten hierfür
          ergänzende Bedingungen einschließlich der gesetzlich vorgeschriebenen
          Verbraucherinformationen und – soweit einschlägig – eines
          Widerrufsrechts.
        </p>
      </LegalSection>

      <LegalSection title="3. Registrierung & Konto">
        <p>
          Für die Nutzung der Kernfunktionen ist ein Nutzerkonto erforderlich.
          Du bist verpflichtet, wahrheitsgemäße Angaben zu machen, deine
          Zugangsdaten geheim zu halten und uns bei Missbrauchsverdacht zu
          informieren. Das Konto ist nicht übertragbar. Die Registrierung setzt
          voraus, dass du unbeschränkt geschäftsfähig bist.
        </p>
      </LegalSection>

      <LegalSection title="4. Pflichten der Nutzer">
        <p>Bei der Nutzung von Faiviq ist es insbesondere untersagt,</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>rechtswidrige, beleidigende oder rechteverletzende Inhalte einzugeben oder hochzuladen,</li>
          <li>Rechte Dritter (z. B. Urheber-, Marken- oder Persönlichkeitsrechte) zu verletzen,</li>
          <li>die Plattform automatisiert missbräuchlich oder zur Störung des Betriebs zu nutzen,</li>
          <li>Sicherheitsmechanismen zu umgehen oder die Anwendung zu manipulieren.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Inhalte & Nutzungsrechte">
        <p>
          Du behältst die Rechte an den von dir eingegebenen Texten und
          hochgeladenen Bildern. Du räumst uns das für den Betrieb erforderliche,
          einfache Recht ein, diese Inhalte zu speichern und zu verarbeiten, um
          die angeforderten Funktionen (u. a. Konzept- und Bilderzeugung sowie
          die Vermittlung an Fertigungspartner) bereitzustellen. Du sicherst zu,
          dass du zur Nutzung der eingegebenen Inhalte berechtigt bist.
        </p>
      </LegalSection>

      <LegalSection title="6. KI-generierte Ergebnisse">
        <p>
          Konzepte, Maße, Materialangaben, Visualisierungen und Preisangaben
          werden automatisiert erzeugt und sind unverbindliche Vorschläge bzw.
          Schätzungen. Sie ersetzen keine fachliche Beratung, statische Prüfung
          oder verbindliche Kalkulation. Für die Richtigkeit, Vollständigkeit
          oder Eignung der Ergebnisse für einen bestimmten Zweck übernehmen wir
          keine Gewähr. Maßgeblich für eine tatsächliche Fertigung ist stets die
          Abstimmung mit dem jeweiligen Fertigungspartner.
        </p>
      </LegalSection>

      <LegalSection title="7. Vermittlung an Fertigungspartner">
        <p>
          Faiviq vermittelt Anfragen an Fertigungspartner. Ein etwaiger Vertrag
          über die Herstellung eines Produkts kommt unmittelbar zwischen dir und
          dem jeweiligen Fertigungspartner zustande. Wir sind an einem solchen
          Vertrag nicht beteiligt und übernehmen keine Haftung für dessen
          Erfüllung, Qualität, Fristen oder Preise.
        </p>
      </LegalSection>

      <LegalSection title="8. Verfügbarkeit">
        <p>
          Wir bemühen uns um einen möglichst unterbrechungsfreien Betrieb, können
          eine ständige Verfügbarkeit jedoch nicht garantieren. Wartungsarbeiten,
          Weiterentwicklungen oder Störungen können zu vorübergehenden
          Einschränkungen führen. Ein Anspruch auf Bereitstellung bestimmter
          Funktionen besteht nicht.
        </p>
      </LegalSection>

      <LegalSection title="9. Haftung">
        <p>
          Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei
          Verletzung von Leben, Körper oder Gesundheit. Bei einfacher
          Fahrlässigkeit haften wir nur bei Verletzung einer wesentlichen
          Vertragspflicht (Kardinalpflicht) und begrenzt auf den
          vertragstypischen, vorhersehbaren Schaden. Im Übrigen ist die Haftung
          ausgeschlossen. Eine zwingende gesetzliche Haftung (etwa nach dem
          Produkthaftungsgesetz) bleibt unberührt.
        </p>
      </LegalSection>

      <LegalSection title="10. Laufzeit & Kündigung">
        <p>
          Das Nutzungsverhältnis kann von beiden Seiten jederzeit beendet werden.
          Du kannst dein Konto jederzeit löschen lassen (siehe
          Datenschutzerklärung). Wir behalten uns vor, Konten bei erheblichen
          oder wiederholten Verstößen gegen diese AGB zu sperren oder zu löschen.
        </p>
      </LegalSection>

      <LegalSection title="11. Änderungen dieser AGB">
        <p>
          Wir können diese AGB anpassen, sofern dies aus triftigen Gründen (z. B.
          neue Funktionen oder geänderte Rechtslage) erforderlich ist. Über
          wesentliche Änderungen informieren wir in geeigneter Weise. Es gilt die
          jeweils auf dieser Seite veröffentlichte Fassung.
        </p>
      </LegalSection>

      <LegalSection title="12. Schlussbestimmungen">
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
          UN-Kaufrechts; zwingende verbraucherschützende Vorschriften des
          Landes deines gewöhnlichen Aufenthalts bleiben unberührt. Sollten
          einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit
          der übrigen Bestimmungen unberührt.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
