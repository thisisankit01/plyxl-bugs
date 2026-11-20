import type { Metadata } from "next"

import { DndDemo } from "@/components/dnd-demo"

export const metadata: Metadata = {
  title: "Drag & Drop Demo",
}

export default function Page() {
  return <DndDemo />
}
