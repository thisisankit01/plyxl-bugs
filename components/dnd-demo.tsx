"use client"

import * as React from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  CameraIcon,
  CoffeeIcon,
  FileIcon,
  FolderIcon,
  HeartIcon,
  MusicIcon,
  PencilIcon,
  PlusIcon,
  RocketIcon,
  SparklesIcon,
  StarIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  addFile as boardAddFile,
  canCreateFolder,
  createFolderFrom,
  deleteNode,
  INITIAL_BOARD,
  makeId,
  moveIntoFolder,
  moveToRoot,
  renameNode,
  type Board,
  type BoardNode,
} from "@/lib/dnd-board"
import { cn } from "@/lib/utils"

const FILE_ICONS = [
  StarIcon,
  HeartIcon,
  ZapIcon,
  SparklesIcon,
  RocketIcon,
  CoffeeIcon,
  MusicIcon,
  CameraIcon,
  FileIcon,
]
const TILE_COLORS = [
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
]

const ROOT = "root"
const BACKDROP = "backdrop"
const INSIDE = "inside"

/**
 * FIX #1: the dragged tile's own droppable always sits under the pointer and
 * (same size as the target) won the sort, so `over === active` and the drop was
 * ignored -> folders never got created. Exclude the active item, then prefer the
 * smallest (most specific) droppable.
 */
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args).filter((h) => h.id !== args.active.id)
  return hits.sort((a, b) => {
    const ar = args.droppableRects.get(a.id)
    const br = args.droppableRects.get(b.id)
    if (!ar || !br) return 0
    return ar.width * ar.height - br.width * br.height
  })
}

function glyph(node: BoardNode, size: string) {
  const Icon = FILE_ICONS[node.icon % FILE_ICONS.length]
  return <Icon className={cn(size, "text-white")} />
}

function FolderPreview({ node, board }: { node: BoardNode; board: Board }) {
  const kids = node.children
    .map((id) => board.nodes[id])
    .filter((c): c is BoardNode => Boolean(c))
    .slice(0, 4)
  return (
    <div className="grid size-full grid-cols-2 grid-rows-2 gap-1 p-1.5">
      {kids.map((c) => (
        <span
          key={c.id}
          className={cn(
            "flex items-center justify-center rounded-md",
            TILE_COLORS[c.icon % TILE_COLORS.length]
          )}
        >
          {glyph(c, "size-3")}
        </span>
      ))}
    </div>
  )
}

type MenuState = { id: string; x: number; y: number }

function ContextMenu({
  menu,
  node,
  onOpen,
  onRename,
  onDelete,
  onClose,
}: {
  menu: MenuState
  node: BoardNode
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const down = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("pointerdown", down)
    window.addEventListener("keydown", key)
    return () => {
      window.removeEventListener("pointerdown", down)
      window.removeEventListener("keydown", key)
    }
  }, [onClose])

  const left = Math.min(menu.x, window.innerWidth - 176)
  const top = Math.min(menu.y, window.innerHeight - 152)
  const item =
    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"

  return (
    <div
      ref={ref}
      role="menu"
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-[70] w-40 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
    >
      {node.kind === "folder" && (
        <button type="button" role="menuitem" onClick={onOpen} className={item}>
          <FolderIcon className="size-4" /> Open
        </button>
      )}
      <button type="button" role="menuitem" onClick={onRename} className={item}>
        <PencilIcon className="size-4" /> Rename
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onDelete}
        className={cn(item, "text-destructive hover:bg-destructive/10")}
      >
        <Trash2Icon className="size-4" /> Delete
      </button>
    </div>
  )
}

type SharedProps = {
  board: Board
  dragging: boolean
  setOpenFolderId: (id: string | null) => void
  renamingId: string | null
  draft: string
  setDraft: (v: string) => void
  commitRename: (id: string) => void
  cancelRename: () => void
  addFile: (parentId: string | null) => void
  ignoreClick: () => boolean
  openMenu: (id: string, x: number, y: number) => void
}

function IconTile({
  node,
  frozen,
  ...shared
}: SharedProps & { node: BoardNode; frozen?: boolean }) {
  const drag = useDraggable({
    id: node.id,
    disabled: frozen || shared.renamingId === node.id,
  })
  const drop = useDroppable({ id: node.id, disabled: frozen })
  const ref = React.useCallback(
    (el: HTMLElement | null) => {
      drag.setNodeRef(el)
      drop.setNodeRef(el)
    },
    [drag.setNodeRef, drop.setNodeRef] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const hovering = drop.isOver && !drag.isDragging
  const isFolder = node.kind === "folder"

  return (
    <div
      ref={ref}
      {...drag.attributes}
      {...drag.listeners}
      style={{ touchAction: "none" }}
      onClick={() => {
        if (frozen || shared.ignoreClick()) return
        if (isFolder) shared.setOpenFolderId(node.id)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!frozen) shared.openMenu(node.id, e.clientX, e.clientY)
      }}
      className={cn(
        "flex w-16 cursor-grab select-none flex-col items-center gap-1.5 active:cursor-grabbing",
        drag.isDragging && "opacity-30"
      )}
    >
      <div
        className={cn(
          "relative flex size-16 items-center justify-center rounded-[1.1rem] shadow-sm transition-transform duration-150",
          isFolder
            ? "bg-muted ring-1 ring-border"
            : TILE_COLORS[node.icon % TILE_COLORS.length],
          hovering && "scale-110 ring-2 ring-primary"
        )}
      >
        {isFolder ? <FolderPreview node={node} board={shared.board} /> : glyph(node, "size-7")}
        {hovering && !isFolder && (
          <span className="absolute -bottom-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground shadow">
            New folder
          </span>
        )}
      </div>
      {shared.renamingId === node.id ? (
        <input
          autoFocus
          aria-label={`Rename ${node.name}`}
          value={shared.draft}
          onChange={(e) => shared.setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === "Enter") shared.commitRename(node.id)
            if (e.key === "Escape") shared.cancelRename()
          }}
          onBlur={() => shared.commitRename(node.id)}
          className="w-16 rounded border bg-background px-1 py-0.5 text-center text-[11px] outline-none focus:ring-1 focus:ring-ring"
        />
      ) : (
        <span className="w-16 truncate text-center text-[11px] font-medium">{node.name}</span>
      )}
    </div>
  )
}

function IconGrid({
  ids,
  parentId,
  frozen,
  className,
  ...shared
}: SharedProps & {
  ids: string[]
  parentId: string | null
  frozen?: boolean
  className?: string
}) {
  return (
    <div className={cn("grid justify-items-center gap-x-3 gap-y-6", className)}>
      {ids.map((id) => {
        const node = shared.board.nodes[id]
        return node ? <IconTile key={id} node={node} frozen={frozen} {...shared} /> : null
      })}
      {!shared.dragging && !frozen && (
        <button
          type="button"
          aria-label="Add icon"
          onClick={() => shared.addFile(parentId)}
          className="group flex w-16 flex-col items-center gap-1.5"
        >
          <span className="flex size-16 items-center justify-center rounded-[1.1rem] border-2 border-dashed border-muted-foreground/40 text-muted-foreground transition group-hover:border-primary group-hover:text-primary">
            <PlusIcon className="size-6" />
          </span>
          <span className="text-[11px] text-muted-foreground">Add</span>
        </button>
      )}
    </div>
  )
}

/** iOS-style opened folder: blurred backdrop + centered rounded panel */
function FolderOverlay({
  folder,
  onClose,
  onRenameFolder,
  ...shared
}: SharedProps & {
  folder: BoardNode
  onClose: () => void
  onRenameFolder: (name: string) => void
}) {
  const backdrop = useDroppable({ id: BACKDROP })
  const inside = useDroppable({ id: `${INSIDE}:${folder.id}` })

  return (
    <div
      ref={backdrop.setNodeRef}
      onClick={(e) => {
        if (e.target === e.currentTarget && !shared.ignoreClick()) onClose()
      }}
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/40 p-5 backdrop-blur-md duration-200 fade-in"
    >
      <div
        ref={inside.setNodeRef}
        className={cn(
          "w-full max-w-md animate-in rounded-[2rem] border border-white/20 bg-background/85 p-5 shadow-2xl backdrop-blur-xl duration-200 zoom-in-90",
          inside.isOver && "ring-2 ring-primary/50"
        )}
      >
        <input
          key={folder.id}
          defaultValue={folder.name}
          aria-label="Folder name"
          onBlur={(e) => onRenameFolder(e.currentTarget.value)}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === "Enter") e.currentTarget.blur()
          }}
          className="mx-auto mb-5 block w-full bg-transparent text-center text-lg font-semibold outline-none"
        />
        <IconGrid
          ids={folder.children}
          parentId={folder.id}
          className="min-h-40 grid-cols-3 sm:grid-cols-4"
          {...shared}
        />
        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          Drag an icon outside the panel to take it out of the folder.
        </p>
      </div>
    </div>
  )
}

export function DndDemo() {
  const [board, setBoard] = React.useState<Board>(INITIAL_BOARD)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [openFolderId, setOpenFolderId] = React.useState<string | null>(null)
  const [renamingId, setRenamingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState("")
  const [menu, setMenu] = React.useState<MenuState | null>(null)
  const justDragged = React.useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  )

  // close the overlay if its folder disappears (emptied / deleted)
  React.useEffect(() => {
    if (openFolderId && !board.nodes[openFolderId]) setOpenFolderId(null)
  }, [board, openFolderId])

  // Escape closes the folder
  React.useEffect(() => {
    if (!openFolderId) return
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpenFolderId(null)
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [openFolderId])

  const markDragFinished = () => {
    justDragged.current = true
    window.setTimeout(() => (justDragged.current = false), 0)
  }

  const commitRename = React.useCallback(
    (id: string) => {
      setBoard((prev) => renameNode(prev, id, draft))
      setRenamingId(null)
    },
    [draft]
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const sourceId = String(active.id)
    setActiveId(null)
    markDragFinished()
    if (!over) return
    const overId = String(over.id)
    if (overId === sourceId) return

    if (overId === BACKDROP || overId === ROOT) {
      setBoard((prev) => moveToRoot(prev, sourceId))
      if (overId === BACKDROP) setOpenFolderId(null)
      return
    }
    if (overId.startsWith(`${INSIDE}:`)) {
      setBoard((prev) => moveIntoFolder(prev, sourceId, overId.slice(INSIDE.length + 1)))
      return
    }
    const target = board.nodes[overId]
    if (!target) return
    if (target.kind === "folder") {
      setBoard((prev) => moveIntoFolder(prev, sourceId, overId))
    } else if (canCreateFolder(board, sourceId, overId)) {
      setBoard((prev) => createFolderFrom(prev, sourceId, overId, makeId()))
    }
  }

  const shared: SharedProps = {
    board,
    dragging: activeId !== null,
    setOpenFolderId,
    renamingId,
    draft,
    setDraft,
    commitRename,
    cancelRename: () => setRenamingId(null),
    addFile: (parentId) => setBoard((p) => boardAddFile(p, parentId, FILE_ICONS.length)),
    ignoreClick: () => justDragged.current,
    openMenu: (id, x, y) => setMenu({ id, x, y }),
  }

  const openFolder = openFolderId ? board.nodes[openFolderId] : null
  const activeNode = activeId ? board.nodes[activeId] : null
  const menuNode = menu ? board.nodes[menu.id] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={({ active }) => {
        setRenamingId(null)
        setMenu(null)
        setActiveId(String(active.id))
      }}
      onDragCancel={() => {
        setActiveId(null)
        markDragFinished()
      }}
      onDragEnd={handleDragEnd}
    >
      <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Icons</h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Drop an icon on another to make a folder. Tap a folder to open it. Right-click
                for Rename or Delete.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setOpenFolderId(null)
                setRenamingId(null)
                setBoard(INITIAL_BOARD)
              }}
            >
              Reset
            </Button>
          </div>
          <RootZone disabled={openFolderId !== null}>
            <IconGrid
              ids={board.rootIds}
              parentId={null}
              frozen={openFolderId !== null}
              className="grid-cols-4 sm:grid-cols-6 md:grid-cols-8"
              {...shared}
            />
          </RootZone>
        </div>
      </main>

      {openFolder && (
        <FolderOverlay
          folder={openFolder}
          onClose={() => setOpenFolderId(null)}
          onRenameFolder={(name) => setBoard((p) => renameNode(p, openFolder.id, name))}
          {...shared}
        />
      )}

      {menu && menuNode && (
        <ContextMenu
          menu={menu}
          node={menuNode}
          onOpen={() => {
            setOpenFolderId(menu.id)
            setMenu(null)
          }}
          onRename={() => {
            setDraft(menuNode.name)
            setRenamingId(menu.id)
            setMenu(null)
          }}
          onDelete={() => {
            setBoard((p) => deleteNode(p, menu.id))
            setMenu(null)
          }}
          onClose={() => setMenu(null)}
        />
      )}

      <DragOverlay dropAnimation={null} zIndex={80}>
        {activeNode ? (
          <div
            className={cn(
              "flex size-16 scale-110 items-center justify-center rounded-[1.1rem] shadow-2xl",
              activeNode.kind === "folder"
                ? "bg-muted ring-1 ring-border"
                : TILE_COLORS[activeNode.icon % TILE_COLORS.length]
            )}
          >
            {activeNode.kind === "folder" ? (
              <FolderPreview node={activeNode} board={board} />
            ) : (
              glyph(activeNode, "size-7")
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// must live inside <DndContext>, hence its own component
function RootZone({ disabled, children }: { disabled: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: ROOT, disabled })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[420px] rounded-2xl border-2 border-dashed p-4 transition-colors",
        isOver && "border-primary bg-primary/5"
      )}
    >
      {children}
    </div>
  )
}