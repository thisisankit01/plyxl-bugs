"use client";

import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as RG from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
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

/* ───────── For your RIGHT panel ───────── */

/* FIX 1: min-w-0 + overflow-wrap:anywhere on bubble, overflow-x-auto on <pre> */
export function ChatBubble({
  role,
  text,
  code,
}: {
  role: "user" | "ai";
  text: string;
  code?: string;
}) {
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

/* FIX 2: autosizing textarea, height follows content, placeholder never clipped */
export function ChatInput() {
  return (
    <TextareaAutosize
      minRows={1}
      maxRows={6}
      placeholder="Message SoloOS Agent... @ to bring in a sheet"
      className="w-full resize-none rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
    />
  );
}

/* ───────── MIDDLE content ───────── */

const COLOURS = [
  { id: "mono", label: "Mono", dot: "bg-neutral-900" },
  { id: "red", label: "Red", dot: "bg-rose-300" },
  { id: "amber", label: "Amber", dot: "bg-amber-300" },
  { id: "green", label: "Green", dot: "bg-green-300" },
  { id: "blue", label: "Blue", dot: "bg-sky-300" },
  { id: "plum", label: "Plum", dot: "bg-violet-300" },
];
const DEFAULT_ID = COLOURS[0].id; // default = first, single source of truth

/* FIX 3: one label, "Default", derived from DEFAULT_ID. No "Recommended". */
function ThemePicker() {
  const [value, setValue] = useState(DEFAULT_ID);
  const current = COLOURS.find((c) => c.id === value)!;

  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-4">
        <div className={cn("size-14 rounded-full", current.dot)} />
        <div>
          <p className="font-semibold">SoloOS Agent</p>
          <p className="text-sm text-neutral-500">{current.label}. The colour you see it in.</p>
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
              {c.id === DEFAULT_ID ? "Default" : ""}
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

/* FIX 4: tooltip anchored to the input with floating-ui. animationFrame keeps it
   glued to the input while either sidebar animates its width. */
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

export default function PlyxlMain() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  return (
    // min-w-0 + w-full: fills the space between your two sidebars and can shrink
    <div className="flex w-full min-w-0 flex-col gap-8 px-8 pb-10">
      <h1 className="pt-6 text-center text-4xl font-semibold text-neutral-400">
        Good evening, Ankit
      </h1>

      <div className="w-full">
        <div ref={setTarget} className="relative w-full">
          {/* spotlight ring, 12px outside the input, so px-8 above leaves room */}
          <div className="pointer-events-none absolute -inset-3 rounded-3xl ring-2 ring-neutral-900" />
          <div className="relative rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-400">
            Publish a page where customers can request a booking…
          </div>
        </div>

        {/* FIX 5: pill in normal flow, mt-6 is larger than the 12px ring offset */}
        <div className="mt-6 flex justify-center">
          <div className="max-w-full truncate rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 shadow-sm">
            Read soloos site · Working out what SoloOS needs
          </div>
        </div>
      </div>

      <ThemePicker />
      <Tooltip target={target} />
    </div>
  );
}