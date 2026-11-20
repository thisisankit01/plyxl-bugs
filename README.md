# plyxl-bugs

This repository is a Next.js app. The main page is the dashboard at
[`/dashboard`](http://localhost:3000/dashboard); `/` redirects there.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000/dashboard>. Useful checks:

```bash
npm run build
npm run lint
```

## The `/dashboard` route

`app/dashboard/page.tsx` composes the screen:

- A `SidebarProvider` wraps everything and sets `--sidebar-width: 19rem`.
- `<AppSidebar />` is the left navigation.
- `SidebarInset` contains the top header and all page content.
- `<AppSidebar side="right" mobile={false} />` is the right panel.

The header has a breadcrumb (“Build Your Application / Data Fetching”) and
**two separate triggers**: the left `SidebarTrigger` sits at the start, and the
right `SidebarTrigger side="right"` sits at the end (desktop only). Pressing
`⌘/Ctrl + B` toggles the left sidebar.

### Sidebar state

The two sidebars collapse independently. Their state is persisted in
`localStorage` under `sidebar_state_left` and `sidebar_state_right`, so the
layout you leave is the layout you get on your next visit. Storage is read via
`useSyncExternalStore`, which also keeps multiple tabs in sync and falls back
gracefully when storage is unavailable (e.g. private mode).

On screens narrower than 768px, the left sidebar becomes a sheet. The right
sidebar is explicitly `mobile={false}` so it does not stack a second sheet on
top of it, and its trigger is hidden on mobile.

### Content sections

Rendered in order inside `SidebarInset`:

1. **`DndDemo`** — a mobile-style icon grid. Drag an icon onto another icon to
   create a folder (which opens in rename mode with “Folder 1” selected), tap a
   folder to open it, drag an icon out to move it back, and right-click a tile
   for Rename/Delete. Folders cannot be nested. The same demo also has a
   standalone page at `/dnd`.
2. **`PlyxlBugsDemo`** — side-by-side bug reproductions with a Before/After
   toggle per section: chat text overflow, clipped textarea placeholder, theme
   picker labeling, and onboarding tooltip/status pill.
3. **`PlyxlFixed`** — the corrected patterns for those cases in a single
   reference layout with navigation, chat bubbles and a chat input.
4. **`PlyxlMain`** — reusable chat pieces (`ChatBubble`, `ChatInput`) used by
   the main panel reference.

## File map (dashboard path)

| File | Purpose |
| --- | --- |
| `app/dashboard/page.tsx` | The `/dashboard` layout, header, triggers and section order. |
| `app/page.tsx` | Redirects `/` to `/dashboard`. |
| `app/layout.tsx` | Root HTML shell, Geist fonts and global CSS. |
| `app/globals.css` | Tailwind and shadcn theme tokens. |
| `components/app-sidebar.tsx` | Shared left/right sidebar navigation (`side` prop). |
| `components/ui/sidebar.tsx` | Sidebar primitives, independent toggles, persistence, mobile sheet. |
| `components/ui/breadcrumb.tsx`, `separator.tsx`, `button.tsx`, `sheet.tsx`, `tooltip.tsx`, `input.tsx`, `skeleton.tsx` | shadcn primitives used by the dashboard and its sidebars. |
| `hooks/use-mobile.ts` | 768px breakpoint detection via `useSyncExternalStore`. |
| `lib/utils.ts` | The `cn()` class-name helper. |
| `components/dnd-demo.tsx`, `lib/dnd-board.ts` | Icon-grid demo and its pure board operations. |
| `components/plyxl-bugs-demo.tsx` | Bug reproductions with per-section Before/After toggles. |
| `components/plyxl-fixed.tsx` | Fixed versions of those UI patterns. |
| `components/plyxl-main.tsx` | Main chat panel and exported chat components. |
| `components.json` | shadcn CLI configuration. |
