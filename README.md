# IdeaForge

> Bring deine Idee in die Realität.

Eine Premium-SaaS-Plattform (MVP), die Menschen hilft, individuelle physische
Produkte zu entwerfen und herstellen zu lassen. Der Nutzer beschreibt seine
Idee in natürlicher Sprache – eine KI erstellt daraus ein Designkonzept,
Renderings, Maße, Materialempfehlungen und eine Preisabschätzung – und
verbindet ihn anschließend mit passenden Produktionspartnern.

**Customer Journey:** Idee → KI → Design → Produktionspartner → Fertigung → Lieferung

## Tech-Stack

- **React 19** + **TypeScript**
- **Vite** (Build & Dev-Server)
- **Tailwind CSS v4** (CSS-first Theme via `@theme`)
- **React Router v7**
- **Framer Motion** (Animationen & Übergänge)
- **Lucide Icons**

## Schnellstart

```bash
npm install      # Abhängigkeiten installieren
npm run dev      # Dev-Server unter http://localhost:5173
npm run build    # Produktions-Build (tsc + vite)
npm run preview  # Produktions-Build lokal testen
```

## Seiten

| Route            | Seite               | Inhalt                                                        |
| ---------------- | ------------------- | ------------------------------------------------------------- |
| `/`              | Landingpage         | Hero, Features, So funktioniert es, Testimonials, FAQ, CTA    |
| `/create`        | Idee erstellen      | Prompt, Bild-Upload, Stil, Material, Kategorie, Budget        |
| `/result`        | KI-Ergebnis         | Renderings, Beschreibung, Maße, Nachhaltigkeit, Preis         |
| `/manufacturers` | Produktionspartner  | Filterbare Hersteller-Karten mit Anfrage-Flow                 |
| `/dashboard`     | Dashboard           | Projekte, Status-Timeline, Fortschritt, Ideen, Anfragen       |
| `/profile`       | Profil              | Account, Favoriten, Projekte, Bestellungen, Einstellungen     |

## Projektstruktur

```
src/
├── components/
│   ├── layout/        # Navbar, Footer, Layout, Logo, ScrollToTop
│   ├── sections/      # Landing-Sektionen (Hero, Features, FAQ, …)
│   └── ui/            # Wiederverwendbare Primitives (Button, Card, …)
├── data/              # Realistische Dummy-Daten
├── lib/               # Hilfsfunktionen (cn, Währungsformatierung)
├── pages/             # Die sechs Seiten
├── App.tsx            # Routing
├── main.tsx           # Entry-Point
└── index.css          # Tailwind-Theme & Design-Tokens
```

## Hinweise zum MVP

Dies ist ein **klickbarer Prototyp ohne Backend**. KI-Renderings sind elegante,
aus CSS/Geometrie erzeugte Platzhalter (`RenderingPlaceholder`), Hersteller und
Projekte basieren auf realistischen Dummy-Daten. Die komplette Navigation und
alle Interaktionen (Filter, Auswahl, Generierungs-Animation, Anfragen) sind
funktionsfähig.
