# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Dramatischer Dark-Mode im Hollywood-Glamour-Stil: tiefes Bordeaux-Schwarz als Samtvorhang, warmes Gold für Scheinwerfer-Akzente, große Bildbühnen mit weichen Schatten. Typografie mit eleganten Serifen-Überschriften (Playfair Display) und klarem Sans-Body – Red-Carpet trifft exklusive Boutique.

## Colors

- `--color-bg`: **#0F0A0A**
- `--color-bg_card`: **#1A1214**
- `--color-bg_input`: **#1F1517**
- `--color-fg`: **#F5F0F0**
- `--color-fg_muted`: **#9E8E8E**
- `--color-accent`: **#B22234**
- `--color-accent_hover`: **#CD2E40**
- `--color-accent_active`: **#8B1A28**
- `--color-gold`: **#C9A84C**
- `--color-gold_light`: **#DFC278**
- `--color-border`: **#2A1E20**
- `--color-border_focus`: **#C9A84C**
- `--color-error`: **#E05555**
- `--color-success`: **#5FA87A**

## Typography

- `font_family`: 'Inter', system-ui, -apple-system, sans-serif
- `font_family_heading`: 'Playfair Display', Georgia, 'Times New Roman', serif
- `heading_weight`: 700
- `body_weight`: 400
- `size_scale`: xs: 0.75rem; sm: 0.875rem; base: 1rem; lg: 1.125rem; xl: 1.375rem; 2xl: 1.75rem; 3xl: 2.25rem; hero: 3rem

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 20px
- `--space-5`: 24px
- `--space-6`: 32px
- `--space-7`: 40px
- `--space-8`: 48px
- `--space-9`: 64px

## Border-Radii

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 16px
- `--radius-pill`: 9999px

## Components

### Button (Primary)

Hintergrund: accent (#B22234), Text: #F5F0F0, padding: 12px 28px, radius: md (8px), font-weight: 600, font-family: body, letter-spacing: 0.03em, min-height: 48px, transition: all 0.25s ease. Hover: accent_hover (#CD2E40), box-shadow: 0 4px 20px rgba(178,34,52,0.45). Active: accent_active (#8B1A28), transform: scale(0.97). Disabled: opacity 0.45, cursor not-allowed, kein Hover-Effekt. Gold-Variante: bg=gold (#C9A84C), text=bg (#0F0A0A), hover=gold_light (#DFC278), shadow auf Gold-Ton.

### Button (Ghost)

Hintergrund: transparent, Text: gold (#C9A84C), border: 1px solid gold (#C9A84C), padding: 10px 26px, radius: md (8px), min-height: 48px. Hover: bg=gold mit 10% Opazität (rgba(201,168,76,0.12)), border wird gold_light. Disabled: opacity 0.4.

### Card (Kleidungsstück)

Hintergrund: bg_card (#1A1214), border: 1px solid border (#2A1E20), radius: lg (16px), overflow: hidden, transition: all 0.3s ease. Hover: border-color: gold (#C9A84C), box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.3) – samtiger Gold-Glow, transform: translateY(-2px). Bildbereich: 100% Breite, Aspect-Ratio 4:3, object-fit cover, Hintergrund: #0D0808 als Platzhalter.

### Input (Formularfeld)

Hintergrund: bg_input (#1F1517), Textfarbe: fg (#F5F0F0), border: 1px solid border (#2A1E20), radius: md (8px), padding: 12px 16px, font-family: body, font-size: base (1rem), min-height: 48px, transition: border 0.2s, outline: none. Focus: border-color: gold (#C9A84C), box-shadow: 0 0 0 3px rgba(201,168,76,0.15). Placeholder: fg_muted (#9E8E8E). Error: border-color error (#E05555).

### Modal (Overlay & Dialog)

Overlay: rgba(0,0,0,0.75) mit backdrop-filter blur(4px). Dialog: Hintergrund: bg_card (#1A1214), border: 1px solid border (#2A1E20), radius: lg (16px), padding: 32px, max-width: 560px, box-shadow: 0 24px 80px rgba(0,0,0,0.7), animation: fadeInScale 0.25s ease-out. Header: font-family heading, font-size 2xl, color gold, margin-bottom 24px.

### Navbar (Top-Bar)

Hintergrund: bg (#0F0A0A) mit 90% Deckkraft + backdrop-filter blur(12px), border-bottom: 1px solid border (#2A1E20), height: 64px, padding: 0 32px, position sticky top-0, z-index 50. Logo/Brand: font-family heading, color gold (#C9A84C), font-size xl, letter-spacing 0.05em. Nav-Links: font-family body, color fg_muted, hover: color gold, transition 0.2s, padding 8px 16px, radius sm. Aktiver Link: color gold, goldener Unterstrich (2px, radius pill).

### Outfit-Creator (Bühnenbereich)

Zentraler Bereich mit Bühnen-Charakter: Hintergrund radialer Verlauf von rgba(201,168,76,0.06) zu transparent, border: 1px dashed gold (#C9A84C) mit 40% Opazität, radius: lg (16px), padding: 40px 32px, min-height: 420px. Leerer Zustand: zentrierter Platzhalter-Text ('Ziehe Kleidungsstücke auf die Bühne') in fg_muted, umrahmt von dezenten goldenen Eck-Akzenten (4 kleine Rauten an den Ecken via CSS). Gefüllter Zustand: Kleidungsstück-Thumbnails nebeneinander, jeweils mit gold-Rahmen bei Hover, sanftem Glow. Speichern-Button prominent unterhalb.

### Tag/Badge (Kategorie-Label)

Hintergrund: rgba(201,168,76,0.12), Text: gold (#C9A84C), padding: 4px 12px, radius: pill (9999px), font-size: xs, font-weight: 500, letter-spacing: 0.04em, text-transform: uppercase.

### Toast/Notification

Hintergrund: bg_card (#1A1214), border-left: 4px solid gold (#C9A84C), padding: 16px 20px, radius: md (8px), box-shadow: 0 8px 24px rgba(0,0,0,0.6), font-size: sm, max-width: 400px, animation: slideInRight 0.35s ease-out. Success-Variante: border-left success (#5FA87A). Error-Variante: border-left error (#E05555).

## Layout Principles

- Container: max-width 1200px, zentriert mit padding 24px (Desktop) / 16px (Tablet)
- Breakpoints: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px). Fokus auf Desktop + Tablet, Mobile ist sekundär.
- Grid für Garderobe: CSS Grid, auto-fill, minmax(240px, 1fr), gap 20px (Desktop) / 16px (Tablet)
- Outfit-Creator: Zweispaltig auf Desktop (links Bühne 60%, rechts Kategorie-Filter 35%), einspaltig gestapelt auf Tablet.
- Seiten-Layout: Navbar (sticky top, 64px) → Seiteninhalt (padding-top 32px, padding-bottom 64px) → kein Footer (minimalistisch).
- Abstände zwischen Sektionen: 48px (Desktop) / 32px (Tablet)
- Übergänge: Alle interaktiven Elemente nutzen transition 0.2s–0.3s ease; Seitenwechsel mit leichter Fade-Animation (0.2s).
- Bild-Thumbnails: Immer mit object-fit: cover, leicht abgerundet (radius md), Schatten: 0 4px 16px rgba(0,0,0,0.4).
- Touch-Targets: Alle klickbaren Elemente mindestens 44×44px (gemäß WCAG), Buttons und Inputs 48px hoch.
- Scroll-Verhalten: Smooth-Scrolling, Garderobe und Outfit-Listen haben scrollbar mit dezentem Scrollbar-Styling (dunkel, dünn).
