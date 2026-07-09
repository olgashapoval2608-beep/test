# VioRide

A premium, minimal ride-hailing app concept set in Lviv, Ukraine. Static HTML/CSS/JS, no build step, no paid APIs.

**Live app:** deployed via Vercel · **Map data:** OpenStreetMap + CARTO (via Leaflet), free, no API key.

## Design decisions

- **One persistent map, one bottom sheet.** Rather than building three separate screens, Screens 1–3 are views inside a single sheet that morphs height and cross-fades content (`showSheetView()`), while the same Leaflet map instance stays mounted underneath. This matches how real ride-hailing apps behave (the map never unmounts) and avoids the cost/complexity of multiple map instances.
- **Real navigation, not fake links.** The side drawer, profile screen, add-stop sheet, payment sheet, and driver-message composer all push real `history` state, so the hardware/browser back button and Escape key close whatever is open — not just an on-screen close button.
- **No committed routing engine.** Directions come from a hand-drawn quadratic-curve polyline between two real coordinates, not a routing API. This was an explicit tradeoff to avoid a paid service or an unreliable public demo endpoint; the curve is described as a "route preview," never as turn-by-turn navigation.
- **Desktop presentation, mobile is the real product.** Above 640px width the app renders inside a phone mockup with a fake status bar/Dynamic Island/home indicator, purely for presenting the work. Below that width all of that chrome disappears and the app fills the real viewport, using the *actual* device status bar and `env(safe-area-inset-*)`.

## Color system

CSS custom properties in `styles.css`, purple used only as an accent — never as a UI background:

| Token | Value | Use |
|---|---|---|
| `--accent` | `#6C63FF` | Primary brand purple — CTAs, selected states, links |
| `--accent-hover` / `--accent-dark` | `#5A50F2` / `#4B43D1` | Hover / pressed states |
| `--accent-soft` | `#EEEAFE` | Selected-state backgrounds, badges |
| `--ink` | `#1D1D27` | Primary text, primary buttons |
| `--muted` / `--muted-2` | `#70707D` / `#9B9BA8` | Secondary / tertiary text |
| `--surface` / `--canvas` | `#FFFFFF` / `#FAFAFC` | Cards / app background |
| `--line` | `#E8E8F2` | Borders, dividers |
| `--danger` | `#EF4444` | Cancel ride, destructive actions |

## Typography

Inter (400/500/600/700/800) throughout. Scale: 11px (labels) · 12–13px (captions/metadata) · 14–15px (body/row titles) · 16–17px (field text, sheet titles) · 19px (profile name). Weight carries hierarchy more than size — 600–700 for anything actionable or primary.

## Component system

Reusable, token-driven CSS components (no framework): `.fab` (floating round buttons), `.sheet` / `.sheet__view` (bottom sheet + view-swap), `.route-card` / `.route-summary` (origin–destination rail), `.recent-row` (shared by recent places, search suggestions, add-stop suggestions, payment options), `.ride-card`, `.driver-card`, `.timeline`, `.btn-primary` / `.btn-round`, `.modal-scrim` + `.drawer` / `.addstop-sheet` / `.profile-panel` / `.payment-sheet` (three shared overlay patterns: side drawer, bottom sheet, full-screen push). Every component pulls spacing, color, radius, shadow, and motion values from the same token set. Responsive Flexbox and Grid layouts mirror Auto Layout principles: components own their internal spacing and adapt to the available mobile viewport.

## Main user flow

1. **Home** — map centered on Rynok Square. Search "Where to?", pick a recent place, tap the map to pin a custom destination, or add a stop.
2. Selecting a destination draws a route preview + destination pin and reveals **Continue**.
3. **Choose a ride** — Economy / Comfort / XL with ETA and GBP pricing, payment method (opens a sheet), working `VIO20` promo pricing, an optional driver note, then **Confirm ride**.
4. **Driver en route** — live-ish ETA, progress timeline, driver + car card (real photo), selected fare/payment summary, Call feedback, a working message composer, and a dedicated **Cancel ride** confirmation sheet that resets the trip back to Home.

## Stack

Plain HTML/CSS/JS, [Leaflet](https://leafletjs.com/) + OpenStreetMap/CARTO tiles, Google Fonts (Inter). No bundler, no dependencies to install — `npx serve` (or any static server) is enough to run it locally. Installable as a PWA (`manifest.json`, app icons, `apple-mobile-web-app-capable`).
