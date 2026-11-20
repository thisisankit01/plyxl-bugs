"use client";

import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as RG from "@radix-ui/react-radio-group";
import { Check, PanelRight } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  FloatingPortal,
} from "@floating-ui/react";

const cn = (...i: ClassValue[]) => twMerge(clsx(i));

const NAV = ["Home", "Apps", "Jobs", "Mail", "Calendar", "Chat", "Connections"];

const LONG_URL =
  "https://app.example.com/api/v1/workspaces/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/jobs/run";
const CODE = `const res = await fetch("/api/jobs/run", { method: "POST", body: JSON.stringify({ workspaceId, jobId, retries: 3 }) });`;

const COLOURS = [
  { id: "mono", label: "Mono", dot: "bg-neutral-900" },
  { id: "red", label: "Red", dot: "bg-rose-300" },
  { id: "amber", label: "Amber", dot: "bg-amber-300" },
  { id: "green", label: "Green", dot: "bg-green-300" },
  { id: "blue", label: "Blue", dot: "bg-sky-300" },
  { id: "plum", label: "Plum", dot: "bg-violet-300" },
];
const DEFAULT_ID = COLOURS[0].id;

/* FIX 1: min-w-0 + overflow-wrap:anywhere on bubble, overflow-x-auto on <pre> */
function ChatBubble({ role, text, code }: { role: "user" | "ai"; text: string; code?: string }) {
  return (
    <div className={cn("flex gap-2", role === "user" && "flex-row-reverse")}>
      <div className="size-7 shrink-0 rounded-full bg-violet-300" />
      <div className="min-w-0 max-w-[85%] rounded-2xl bg-neutral-100 px-4 py-2 text-sm text-neutral-900 [overflow-wrap:anywhere]">
        <p>{text}</p>
        {code && (
          <pre className="mt-2 max-w-full overflow-x-auto rounded-lg bg-neutral-200 p-3 text-xs">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

/* FIX 2: autosizing textarea, height follows content */
function ChatInput() {
  return (
    <TextareaAutosize
      minRows={1}
      maxRows={6}
      placeholder="Message SoloOS Agent... @ to bring in a sheet"
      className="w-full resize-none rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
    />
  );
}

/* FIX 3: data-driven labels in flow; grid auto-fits whatever width main has */
function ThemePicker() {
  const [value, setValue] = useState(DEFAULT_ID);
  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-4">
        <div className="size-14 rounded-full bg-violet-300" />
        <div>
          <p className="font-semibold">SoloOS Agent</p>
          <p className="text-sm text-neutral-500">Plum. The colour you see it in.</p>
        </div>
      </div>
      <RG.Root
        value={value}
        onValueChange={setValue}
        className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-3 pt-3"
      >
        {COLOURS.map((c) => (
          <div key={c.id} className="flex flex-col items-stretch gap-1">
            <span className="h-4 text-center text-[10px] font-medium text-neutral-500">
              {c.recommended ? "Recommended" : c.id === DEFAULT_ID ? "Default" : ""}
            </span>
            <RG.Item
              value={c.id}
              aria-label={c.label}
              className="flex flex-col items-center gap-1 rounded-xl border border-neutral-200 p-2 text-xs text-neutral-700 data-[state=checked]:border-neutral-900 data-[state=checked]:ring-2 data-[state=checked]:ring-neutral-900"
            >
              <span className={cn("size-8 rounded-full", c.dot)} />
              <span className="flex items-center gap-1">
                {c.label}
                <RG.Indicator>
                  <Check className="size-3" />
                </RG.Indicator>
              </span>
            </RG.Item>
          </div>
        ))}
      </RG.Root>
    </div>
  );
}

/* FIX 4: tooltip anchored with floating-ui. animationFrame:true keeps it glued
   to the input while the right panel animates its width. */
function Tooltip({ target }: { target: HTMLElement | null }) {
  const { refs, floatingStyles } = useFloating({
    placement: "top-start",
    elements: { reference: target },
    middleware: [offset(24), flip({ padding: 16 }), shift({ padding: 16 })],
    whileElementsMounted: (ref, floating, update) =>
      autoUpdate(ref, floating, update, { animationFrame: true }),
  });
  if (!target) return null;
  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="z-50 w-72 rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 shadow-lg"
      >
        <h3 className="text-base font-semibold">Ask for anything</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Type what you need here: a question, an app, or work to do on its own.
        </p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-neutral-400">Skip</span>
          <button className="rounded-full bg-neutral-900 px-3 py-1 text-white">Next →</button>
        </div>
      </div>
    </FloatingPortal>
  );
}

export default function PlyxlFixed() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50 text-neutral-900">
      {/* Left nav */}
      <aside className="w-56 shrink-0 space-y-1 border-r border-neutral-200 bg-white p-3">
        {NAV.map((n) => (
          <div key={n} className="rounded-lg px-3 py-2 text-sm text-neutral-600">
            {n}
          </div>
        ))}
      </aside>

      {/* Main: takes ALL remaining width, shrinks/grows with the right panel */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="flex items-center justify-end px-6 py-3">
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium"
          >
            <PanelRight className="size-4" />
            {panelOpen ? "Close agent" : "Open agent"}
          </button>
        </header>

        <div className="flex w-full flex-1 flex-col gap-8 px-8 pb-10">
          <h1 className="pt-6 text-center text-4xl font-semibold text-neutral-400">
            Good evening, Ankit
          </h1>

          {/* Input + spotlight ring (ring is 12px out, so px-8 above leaves room) */}
          <div className="w-full">
            <div ref={setTarget} className="relative w-full">
              <div className="pointer-events-none absolute -inset-3 rounded-3xl ring-2 ring-neutral-900" />
              <div className="relative rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-400">
                Publish a page where customers can request a booking…
              </div>
            </div>

            {/* FIX 5: pill in flow, mt-6 > 12px ring offset */}
            <div className="mt-6 flex justify-center">
              <div className="max-w-full truncate rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 shadow-sm">
                Read soloos site · Working out what SoloOS needs
              </div>
            </div>
          </div>

          <ThemePicker />
        </div>

        <Tooltip target={target} />
      </main>

      {/* Right agent panel: width animates, inner content keeps fixed width so it doesn't reflow mid-animation */}
      <aside
        className={cn(
          "shrink-0 overflow-hidden border-l border-neutral-200 bg-white transition-[width] duration-200",
          panelOpen ? "w-96" : "w-0 border-l-0"
        )}
      >
        <div className="flex h-full w-96 flex-col">
          <div className="border-b border-neutral-200 px-4 py-3 text-sm font-semibold">
            SoloOS Agent
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <ChatBubble role="user" text={LONG_URL} />
            <ChatBubble role="ai" text="Here's the call:" code={CODE} />
          </div>
          <div className="border-t border-neutral-200 p-3">
            <ChatInput />
          </div>
        </div>
      </aside>
    </div>
  );
}