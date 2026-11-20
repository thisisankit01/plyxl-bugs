export type BoardNode = {
  id: string
  name: string
  kind: "file" | "folder"
  icon: number
  children: string[]
  parentId: string | null // null = home screen
}

export type Board = {
  nodes: Record<string, BoardNode>
  rootIds: string[]
  nextFile: number
  nextFolder: number
}

let counter = 0
export const makeId = () =>
  `n_${Date.now().toString(36)}_${(counter++).toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`

function seed(count: number): Board {
  const nodes: Record<string, BoardNode> = {}
  const rootIds: string[] = []
  for (let i = 0; i < count; i++) {
    const id = makeId()
    nodes[id] = { id, name: `Icon ${i + 1}`, kind: "file", icon: i, children: [], parentId: null }
    rootIds.push(id)
  }
  return { nodes, rootIds, nextFile: count + 1, nextFolder: 1 }
}

export const INITIAL_BOARD: Board = seed(0)

/** remove id from wherever it lives; delete the parent folder if it becomes empty */
function detach(board: Board, id: string): Board {
  const node = board.nodes[id]
  if (!node) return board
  const nodes = { ...board.nodes }
  let rootIds = board.rootIds
  if (node.parentId === null) {
    rootIds = rootIds.filter((x) => x !== id)
  } else {
    const parent = nodes[node.parentId]
    if (parent) {
      const children = parent.children.filter((x) => x !== id)
      if (children.length <= 1) {
        // dissolve: last remaining icon takes the folder's place on the home screen
        const [last] = children
        const at = rootIds.indexOf(parent.id)
        rootIds = [...rootIds]
        if (last && nodes[last]) {
          nodes[last] = { ...nodes[last], parentId: null }
          rootIds.splice(at === -1 ? rootIds.length : at, 1, last)
        } else {
          rootIds = rootIds.filter((x) => x !== parent.id)
        }
        delete nodes[parent.id]
      } else {
        nodes[parent.id] = { ...parent, children }
      }
    }
  }
  return { ...board, nodes, rootIds }
}

export function addFile(board: Board, parentId: string | null, iconCount: number): Board {
  const id = makeId()
  const node: BoardNode = {
    id,
    name: `Icon ${board.nextFile}`,
    kind: "file",
    icon: (board.nextFile - 1) % iconCount,
    children: [],
    parentId,
  }
  const nodes = { ...board.nodes, [id]: node }
  if (parentId && nodes[parentId]?.kind === "folder") {
    nodes[parentId] = { ...nodes[parentId], children: [...nodes[parentId].children, id] }
    return { ...board, nodes, nextFile: board.nextFile + 1 }
  }
  return { ...board, nodes, rootIds: [...board.rootIds, id], nextFile: board.nextFile + 1 }
}

/** folder is created only from two files, and the target must be on the home screen */
export function canCreateFolder(board: Board, sourceId: string, targetId: string): boolean {
  const s = board.nodes[sourceId]
  const t = board.nodes[targetId]
  return !!s && !!t && s.id !== t.id && s.kind === "file" && t.kind === "file" && t.parentId === null
}

export function createFolderFrom(
  board: Board,
  sourceId: string,
  targetId: string,
  folderId: string
): Board {
  if (!canCreateFolder(board, sourceId, targetId)) return board
  const index = board.rootIds.indexOf(targetId)
  const folderNumber = board.nextFolder
  let next = detach(board, sourceId) // target is on root so it can't be deleted by detach
  const rootIds = [...next.rootIds]
  const at = rootIds.indexOf(targetId)
  rootIds.splice(at === -1 ? Math.max(index, 0) : at, 1, folderId)
  const nodes = { ...next.nodes }
  nodes[targetId] = { ...nodes[targetId], parentId: folderId }
  nodes[sourceId] = { ...nodes[sourceId], parentId: folderId }
  nodes[folderId] = {
    id: folderId,
    name: `Folder ${folderNumber}`,
    kind: "folder",
    icon: 0,
    children: [targetId, sourceId],
    parentId: null,
  }
  return { ...next, nodes, rootIds, nextFolder: folderNumber + 1 }
}

export function moveIntoFolder(board: Board, sourceId: string, folderId: string): Board {
  const s = board.nodes[sourceId]
  const f = board.nodes[folderId]
  if (!s || !f || s.kind !== "file" || f.kind !== "folder" || s.parentId === folderId) return board
  const next = detach(board, sourceId)
  const folder = next.nodes[folderId]
  if (!folder) return board
  const nodes = { ...next.nodes }
  nodes[folderId] = { ...folder, children: [...folder.children, sourceId] }
  nodes[sourceId] = { ...nodes[sourceId], parentId: folderId }
  return { ...next, nodes }
}

export function moveToRoot(board: Board, sourceId: string): Board {
  const s = board.nodes[sourceId]
  if (!s || s.parentId === null) return board
  const next = detach(board, sourceId)
  const nodes = { ...next.nodes }
  nodes[sourceId] = { ...nodes[sourceId], parentId: null }
  return { ...next, nodes, rootIds: [...next.rootIds, sourceId] }
}

export function deleteNode(board: Board, id: string): Board {
  const node = board.nodes[id]
  if (!node) return board
  let next = detach(board, id)
  const nodes = { ...next.nodes }
  const kill = (nid: string) => {
    const n = nodes[nid]
    if (!n) return
    n.children.forEach(kill)
    delete nodes[nid]
  }
  kill(id)
  return { ...next, nodes }
}

export function renameNode(board: Board, id: string, name: string): Board {
  const node = board.nodes[id]
  const trimmed = name.trim()
  if (!node || !trimmed) return board
  return { ...board, nodes: { ...board.nodes, [id]: { ...node, name: trimmed } } }
}