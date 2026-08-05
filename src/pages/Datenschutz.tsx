import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout'

export function Datenschutz() {
  return (
    <LegalLayout
      title="Datenschutzerklärung"
      updated="5. August 2026"
      intro={
        <p>
          Der Schutz deiner personenbezogenen Daten ist uns wichtig. Nachfolgend
          informieren wir dich gemäß der Datenschutz-Grundverordnung (DSGVO)
          über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten
          bei der Nutzung von Faiviq.
        </p>
      }
    >
      <LegalSection title="1. Verantwortlicher">
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:
        </p>
        <p>
          Lennard Heddergott
          <br />
          Dosborn 16
          <br />
          37351 Dingelstädt, Deutschland
          <br />
          E-Mail:{' '}
          <a
            href="mailto:ms.heddergott.lh01@gmail.com"
            className="text-accent-600 hover:text-accent-700"
          >
            ms.heddergott.lh01@gmail.com
          </a>
        </p>
        <p>
          Ein Datenschutzbeauftragter ist gesetzlich nicht bestellt, da die
          Voraussetzungen hierfür nicht vorliegen. Bei Fragen zum Datenschutz
          wende dich bitte an die oben genannte E-Mail-Adresse.
        </p>
      </LegalSection>

      <LegalSection title="2. Rechtsgrundlagen der Verarbeitung">
        <p>
          Wir verarbeiten personenbezogene Daten auf Grundlage folgender
          Vorschriften: Art. 6 Abs. 1 lit. b DSGVO (Erfüllung eines Vertrags
          bzw. vorvertragliche Maßnahmen, z. B. Konto und Nutzung der
          Plattform), Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), Art. 6 Abs. 1
          lit. c DSGVO (rechtliche Verpflichtung) sowie Art. 6 Abs. 1 lit. f
          DSGVO (berechtigtes Interesse, z. B. an einem sicheren und
          funktionsfähigen Betrieb).
        </p>
      </LegalSection>

      <LegalSection title="3. Deine Rechte">
        <p>Dir stehen als betroffene Person folgende Rechte zu:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Auskunft über die verarbeiteten Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung („Recht auf Vergessenwerden", Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          <li>
            Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft
            (Art. 7 Abs. 3 DSGVO)
          </li>
        </ul>
        <p>
          Zudem hast du das Recht, dich bei einer Datenschutz-Aufsichtsbehörde
          zu beschweren (Art. 77 DSGVO). Für uns zuständig ist der Thüringer
          Landesbeauftragte für den Datenschutz und die Informationsfreiheit
          (TLfDI), Häßlerstraße 8, 99096 Erfurt.
        </p>
      </LegalSection>

      <LegalSection title="4. Aufruf der Website & Hosting">
        <p>
          Diese Anwendung wird bei der Vercel Inc. (340 S Lemon Ave #4133,
          Walnut, CA 91789, USA) gehostet. Beim Aufruf der Website werden
          technisch notwendige Verbindungsdaten (u. a. IP-Adresse,
          Zeitpunkt der Anfrage, aufgerufene Ressource, Browsertyp) verarbeitet,
          um die Auslieferung und Sicherheit der Seite zu gewährleisten.
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
          an einem stabilen und sicheren Betrieb). Mit Vercel besteht ein
          Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.
        </p>
      </LegalSection>

      <LegalSection title="5. Registrierung & Nutzerkonto">
        <p>
          Für die Nutzung der Kernfunktionen ist ein Konto erforderlich. Bei der
          Registrierung verarbeiten wir deine E-Mail-Adresse, ein Passwort (nur
          verschlüsselt gespeichert), deinen angegebenen Namen sowie deine Rolle
          (Kunde oder Hersteller). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b
          DSGVO. Die Authentifizierung und Kontoverwaltung erfolgt über unseren
          Dienstleister Supabase (siehe Ziffer 8). Deine Login-Sitzung wird zu
          diesem Zweck lokal in deinem Browser gespeichert (siehe Ziffer 10).
        </p>
      </LegalSection>

      <LegalSection title="6. Erstellung von Ideen, Konzepten & Bild-Uploads">
        <p>
          Wenn du eine Produktidee beschreibst, verarbeiten wir die von dir
          eingegebenen Texte (Prompts) sowie optional von dir hochgeladene
          Bilder. Aus diesen Angaben erzeugt die Anwendung ein Designkonzept,
          Maße, Materialempfehlungen und eine Preisabschätzung. Diese Daten
          werden deinem Konto zugeordnet gespeichert, damit du deine Projekte
          und Versionen wiederfinden kannst. Rechtsgrundlage ist Art. 6 Abs. 1
          lit. b DSGVO.
        </p>
      </LegalSection>

      <LegalSection title="7. KI-gestützte Verarbeitung (OpenAI)">
        <p>
          Zur Analyse deiner Beschreibung und zur Erzeugung von Konzepten und
          Vorschau­bildern übermitteln wir die von dir eingegebenen Texte und
          gegebenenfalls hochgeladenen Bilder an die OpenAI, L.L.C. (1960 Bryant
          Street, San Francisco, CA 94110, USA). Die Verarbeitung erfolgt
          ausschließlich zur Bereitstellung der von dir angeforderten Funktion.
          Nach den API-Nutzungsbedingungen von OpenAI werden über die API
          übermittelte Daten nicht zum Training der Modelle verwendet.
        </p>
        <p>
          Bitte gib in den Beschreibungen keine sensiblen personenbezogenen
          Daten an, die für die Gestaltung eines Möbelstücks nicht erforderlich
          sind. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Zur
          Übermittlung in die USA siehe Ziffer 11.
        </p>
      </LegalSection>

      <LegalSection title="8. Datenbank & Speicherung (Supabase)">
        <p>
          Konten, Profile, Ideen, Konzepte, hochgeladene sowie generierte Bilder
          und Bestell-/Anfragedaten werden in unserer Datenbank und im
          Datei­speicher bei der Supabase Inc. (970 Toa Payoh North #07-04,
          Singapur 318992, mit Rechenzentren je nach gewählter Region)
          gespeichert. Supabase verarbeitet diese Daten ausschließlich in
          unserem Auftrag; es besteht ein Auftragsverarbeitungsvertrag nach
          Art. 28 DSGVO. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b und lit. f
          DSGVO.
        </p>
      </LegalSection>

      <LegalSection title="9. Anfragen an Fertigungspartner">
        <p>
          Wenn du eine Umsetzung anfragst, werden die für die Anfrage
          erforderlichen Projektdaten (z. B. Konzept, Maße, Materialien,
          gewählte Variante) an den ausgewählten Fertigungspartner übermittelt,
          damit dieser die Anfrage bearbeiten kann. Rechtsgrundlage ist Art. 6
          Abs. 1 lit. b DSGVO.
        </p>
      </LegalSection>

      <LegalSection title="10. Cookies & lokale Speicherung">
        <p>
          Faiviq verwendet keine Tracking- oder Marketing-Cookies und keine
          Analyse-Werkzeuge. Zum Betrieb werden ausschließlich technisch
          notwendige Speichertechnologien eingesetzt: Deine Anmelde-Sitzung wird
          im <code>localStorage</code> deines Browsers gehalten, damit du
          angemeldet bleibst; ein begonnener Ideentext kann vorübergehend im{' '}
          <code>sessionStorage</code> zwischengespeichert werden. Diese
          Speicherung ist für die von dir angeforderten Funktionen unbedingt
          erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG) und bedarf daher keiner
          Einwilligung. Details findest du im{' '}
          <a href="/cookies" className="text-accent-600 hover:text-accent-700">
            Cookie-Hinweis
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Datenübermittlung in Drittländer">
        <p>
          Einige der eingesetzten Dienstleister (u. a. Vercel und OpenAI, ggf.
          Supabase je nach Region) können Daten in den USA verarbeiten. Die
          Übermittlung erfolgt auf Grundlage der Standardvertragsklauseln der
          Europäischen Kommission (Art. 46 DSGVO) und – soweit die Anbieter
          zertifiziert sind – des EU-U.S. Data Privacy Framework, um ein
          angemessenes Datenschutzniveau sicherzustellen.
        </p>
      </LegalSection>

      <LegalSection title="12. Kontaktaufnahme">
        <p>
          Wenn du uns per E-Mail kontaktierst, verarbeiten wir deine Angaben zur
          Bearbeitung der Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw.
          lit. f DSGVO. Die Daten werden gelöscht, sobald sie für die Erreichung
          des Zwecks nicht mehr erforderlich sind.
        </p>
      </LegalSection>

      <LegalSection title="13. Speicherdauer & Löschung">
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie es für die
          genannten Zwecke erforderlich ist oder gesetzliche
          Aufbewahrungspflichten bestehen. Du kannst dein Konto und die damit
          verbundenen Daten jederzeit löschen lassen, indem du uns unter der
          oben genannten E-Mail-Adresse kontaktierst.
        </p>
      </LegalSection>

      <LegalSection title="14. Datensicherheit">
        <p>
          Die Übertragung erfolgt verschlüsselt über TLS (HTTPS). Der Zugriff auf
          gespeicherte Daten ist durch Zugriffsbeschränkungen (u. a. Row Level
          Security in der Datenbank) abgesichert.
        </p>
      </LegalSection>

      <LegalSection title="15. Aktualität & Änderungen">
        <p>
          Wir passen diese Datenschutzerklärung an, sobald Änderungen der
          Funktionen oder der Rechtslage dies erforderlich machen. Es gilt die
          jeweils auf dieser Seite veröffentlichte Fassung.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
