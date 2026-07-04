# Hemingway design foundation

The committable form of `docs/ui-style.md`. This pass is tokens + a rendered
style guide only. No Next.js scaffold, no dependencies, no shadcn yet.

- `tokens.css` is the source of truth: every color, surface, accent state,
  semantic status hue, radius, focus ring, type scale, and spacing step.
- `style-guide.html` renders the whole system for visual sign-off, inside a
  facsimile of the app shell. It mirrors the same token values so the preview
  is faithful. Open it directly or view the published Artifact.

## How this lands later

When the app is scaffolded, `tokens.css` moves into `app/globals.css` and the
custom properties map to Tailwind theme values and shadcn CSS variables. The
real app loads Geist through `next/font`; the style guide uses a system stack
because the Artifact CSP blocks font CDNs. Nothing about the token names or
values changes in that move.

## Rules this encodes

- Dark only. Light mode is intentionally not built (`docs/ui-style.md`).
- One accent (`--accent`, Strategi orange). It is reserved for primary actions,
  active nav, focus rings, key chart series, and the `approved` / `won` pills.
  Everything else uses a semantic status hue, which is not the accent.
- 1px hairline borders over shadows. `--radius-lg` (8px) is the ceiling; pills
  are fully rounded.
- Digits use `tabular-nums`. Timestamps render relative with absolute on hover.

## Status pill mapping

Every enum state from `docs/data-model.md` maps to one hue. Accent (orange) is
reserved for two states only, marked with a star.

| Enum | State | Hue token |
|---|---|---|
| `email_status` | unverified | neutral |
| | pattern_guess | warning |
| | verified | success |
| | bounced | danger |
| `sending_domain_status` | not_setup | neutral |
| | warming | warning |
| | ready | success |
| | degraded | danger |
| `campaign_status` | draft | neutral |
| | matching | info |
| | pitching | progress |
| | active | success |
| | closed | neutral (dim) |
| `pitch_status` | drafted | neutral |
| | edited | info |
| | approved | accent ★ |
| | pushed | progress |
| | replied | signal |
| | placed | success |
| | declined | danger |
| | bounced | danger |
| `monitor_event_status` | new | info |
| | drafted | progress |
| | responded | success |
| | won | accent ★ |
| | ignored | neutral (dim) |
| `placement_type` | feature | progress |
| | quote | info |
| | listicle | signal |
| | directory | neutral |
| | mention | neutral |

`placement_type` is a category, not a status, so it uses the same hues at a
calmer weight rather than implying good/bad state.
