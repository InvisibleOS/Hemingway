# UI direction: modern, premium, operational

The feel: a serious internal tool a well-funded team uses daily.
Linear/Vercel-dashboard energy, not a marketing site, not default shadcn.

## Foundation
- Dark-neutral base: near-black/deep slate surfaces (#0B0E11 background,
  #14181D cards, #1E242B borders as a starting palette, tune as needed)
- One accent only: Strategi orange #C0531F. Used for primary actions,
  active nav, focus rings, key chart series. Never for large fills.
- Light mode not required for MVP.
- Typography: Geist or Inter for everything. A serif (Source Serif 4) is
  allowed ONLY for report headings in Module 4 exports.
- Spacing is generous. Dense tables, calm chrome.

## Components
- shadcn/ui, customized: kill the default zinc look. Rounded-lg max,
  subtle 1px borders over shadows, muted hover states.
- Status pills everywhere state exists (pitch status, email status, domain
  status, event status). Pill colors: muted backgrounds, readable text,
  accent reserved for "approved/won" states.
- Data tables: comfortable row height, sticky header, column sort,
  right-aligned numbers, tabular-nums.
- Skeleton loaders on every async view. No spinners as primary loading UI.
- Command palette (cmdk) on Cmd+K: jump to client, campaign, journalist.
- A small "Sandbox" badge component: subtle amber dot + label, shown on
  any UI backed by a mock provider. One shared component, used everywhere.

## Layout
- Left sidebar: logo, client switcher at top, nav (Dashboard, Media
  Database, Campaigns, Monitor, Reports, Settings), collapse to icons.
- Page pattern: title row with primary action right-aligned, filter bar,
  content. No breadcrumbs deeper than two levels.
- Detail views open as right-side drawers (journalist profile, pitch
  review), not new pages, to keep operators in flow.

## Banned
- Gradient blobs, glassmorphism, emoji in UI, exclamation marks in copy,
  default shadcn appearance with no customization, more than one accent
  color, dashboard "welcome" hero sections.

## Micro-details that make it feel expensive
- Keyboard flow in the pitch approval queue: j/k to move, e to edit,
  a to approve.
- Optimistic UI on approvals with undo toast.
- Numbers animate on the reporting view (count-up, subtle).
- Every timestamp is relative with absolute on hover.
