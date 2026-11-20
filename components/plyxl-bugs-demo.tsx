"use client";

import { useState, type ReactNode } from "react";
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

/* ───────────── Section wrapper with its own Before/After toggle ───────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: (fixed: boolean) => ReactNode;
}) {
  const [fixed, setFixed] = useState(false);
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">{title}</h2>
        <button
          onClick={() => setFixed((f) => !f)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            fixed
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {fixed ? "After (fixed)" : "Before (bug)"}
        </button>
      </div>
      {children(fixed)}
    </section>
  );
}

/* ───────────── 1. Chat bubble: text overflow ───────────── */

const LONG_URL =
  "https://app.example.com/api/v1/workspaces/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/jobs/run";
const CODE = `const res = await fetch("/api/jobs/run", { method: "POST", body: JSON.stringify({ workspaceId, jobId, retries: 3 }) });`;

function ChatBubble({
  role,
  text,
  code,
  fixed,
}: {
  role: "user" | "ai";
  text: string;
  code?: string;
  fixed: boolean;
}) {
  return (
    <div className={cn("flex gap-2", role === "user" && "flex-row-reverse")}>
      <div className="size-7 shrink-0 rounded-full bg-violet-300" />
      <div
        className={cn(
          "max-w-[80%] rounded-2xl bg-neutral-100 px-4 py-2 text-sm text-neutral-900",
          // FIX: bubble can shrink + long unbroken strings wrap
          fixed && "min-w-0 [overflow-wrap:anywhere]"
        )}
      >
        <p>{text}</p>
        {code && (
          <pre
            className={cn(
              "mt-2 rounded-lg bg-neutral-200 p-3 text-xs",
              // FIX: code scrolls inside the bubble instead of spilling out
              fixed && "max-w-full overflow-x-auto"
            )}
          >
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

/* ───────────── 2. Chat input: placeholder clipped ───────────── */

function ChatInput({ fixed }: { fixed: boolean }) {
  const placeholder = "Message SoloOS Agent... @ to bring in a sheet";
  const base =
    "w-full resize-none rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900";

  return fixed ? (
    // FIX: autosizing textarea. Height follows content (placeholder included), max 6 rows.
    <TextareaAutosize minRows={1} maxRows={6} placeholder={placeholder} className={base} />
  ) : (
    // BUG: fixed height + overflow hidden. Placeholder wraps to 2 lines and the 2nd is clipped.
    <textarea placeholder={placeholder} className={cn(base, "h-12 overflow-hidden")} />
  );
}

/* ───────────── 3. Theme picker: "Recommended" badge ───────────── */

const COLOURS = [
  { id: "mono", label: "Mono", dot: "bg-neutral-900", recommended: true },
  { id: "red", label: "Red", dot: "bg-rose-300" },
  { id: "amber", label: "Amber", dot: "bg-amber-300" },
  { id: "green", label: "Green", dot: "bg-green-300" },
  { id: "blue", label: "Blue", dot: "bg-sky-300" },
  { id: "plum", label: "Plum", dot: "bg-violet-300" },
];
const DEFAULT_ID = "plum";

function ThemePicker({ fixed }: { fixed: boolean }) {
  const [value, setValue] = useState(DEFAULT_ID);

  return (
    <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-4">
      {/* Preview */}
      <div className="relative mb-2 flex items-center gap-4">
        <div className="size-16 rounded-full bg-violet-300" />
        <div>
          <p className="font-semibold text-neutral-900">SoloOS Agent</p>
          <p className="text-sm text-neutral-500">Plum. The colour you see it in.</p>
        </div>
        {/* BUG: absolute badge, hardcoded to the first swatch, hangs over the preview
            and the Mono tile. Nothing marks which one is the actual default. */}
        {!fixed && (
          <span className="absolute -bottom-3 left-0 z-10 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] text-white">
            Recommended
          </span>
        )}
      </div>

      <RG.Root value={value} onValueChange={setValue} className="flex flex-wrap gap-3 pt-3">
        {COLOURS.map((c) => (
          <div key={c.id} className="flex flex-col items-center gap-1">
            {/* FIX: labels live in flow above each tile, driven by data.
                "Recommended" and "Default" are separate things. */}
            {fixed && (
              <span className="h-4 text-[10px] font-medium text-neutral-500">
                {c.recommended ? "Recommended" : c.id === DEFAULT_ID ? "Default" : ""}
              </span>
            )}
            <RG.Item
              value={c.id}
              aria-label={c.label}
              className={cn(
                "flex w-20 flex-col items-center gap-1 rounded-xl border border-neutral-200 p-2 text-xs text-neutral-700",
                "data-[state=checked]:border-neutral-900 data-[state=checked]:ring-2 data-[state=checked]:ring-neutral-900"
              )}
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

/* ───────────── 4. Onboarding tooltip + status pill ───────────── */

const NAV = ["Home", "Apps", "Jobs", "Mail", "Calendar", "Chat", "Connections"];
const tooltipCls =
  "z-50 w-72 rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 shadow-lg";

function TooltipBody() {
  return (
    <>
      <h3 className="text-base font-semibold">Ask for anything</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Type what you need here: a question, an app, or work to do on its own.
      </p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-neutral-400">Skip</span>
        <button className="rounded-full bg-neutral-900 px-3 py-1 text-white">Next →</button>
      </div>
    </>
  );
}

function FixedTooltip({ target }: { target: HTMLElement | null }) {
  // FIX: anchored to the target, flips/shifts on collision, can't land on the sidebar
  const { refs, floatingStyles } = useFloating({
    placement: "top-start",
    elements: { reference: target },
    middleware: [offset(24), flip({ padding: 16 }), shift({ padding: 16 })],
    whileElementsMounted: autoUpdate,
  });

  if (!target) return null;
  return (
    <FloatingPortal>
      <div ref={refs.setFloating} style={floatingStyles} className={tooltipCls}>
        <TooltipBody />
      </div>
    </FloatingPortal>
  );
}

function OnboardingDemo({ fixed }: { fixed: boolean }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const pillCls =
    "whitespace-nowrap rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 shadow-sm";

  return (
    <div className="grid h-[600px] grid-cols-[220px_1fr] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-900">
      <aside className="space-y-1 border-r border-neutral-200 bg-white p-3">
        {NAV.map((n) => (
          <div key={n} className="rounded-lg px-3 py-2 text-sm text-neutral-600">
            {n}
          </div>
        ))}
      </aside>

      <main className="relative flex flex-col items-center justify-end px-12 pb-24">
        <h1 className="mb-auto mt-10 text-4xl font-semibold text-neutral-400">
          Good evening, Ankit
        </h1>

        <div className="relative w-full max-w-xl">
          <div ref={setTarget} className="relative">
            {/* spotlight ring, 12px outside the input */}
            <div className="pointer-events-none absolute -inset-3 rounded-3xl ring-2 ring-neutral-900" />
            <div className="relative rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-400">
              Publish a page where customers can request a booking…
            </div>
          </div>

          {/* Status pill */}
          {!fixed ? (
            // BUG: -mt-3 pulls it into the ring's 12px offset, so it sits on the ring border
            <div className={cn(pillCls, "absolute left-1/2 top-full z-10 -mt-3 -translate-x-1/2")}>
              Read soloos site · Working out what SoloOS needs
            </div>
          ) : (
            // FIX: in flow, margin larger than the ring offset
            <div className="mt-6 flex justify-center">
              <div className={pillCls}>Read soloos site · Working out what SoloOS needs</div>
            </div>
          )}

          {/* Tooltip */}
          {!fixed ? (
            // BUG: hardcoded to the LEFT of the target, no collision handling.
            // 288px wide + 16px margin, but the gutter is ~48px => covers sidebar nav.
            <div className={cn(tooltipCls, "absolute right-full top-0 mr-4")}>
              <TooltipBody />
            </div>
          ) : (
            <FixedTooltip target={target} />
          )}
        </div>
      </main>
    </div>
  );
}

/* ───────────── Page ───────────── */

export default function PlyxlBugsDemo() {
  return (
    <main className="min-h-screen bg-white p-6 text-neutral-900">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Narrow panel (like the side chat) so both chat bugs reproduce */}
        <Section title="1. Chat: text overflow">
          {(fixed) => (
            <div className="w-80 space-y-3 rounded-2xl border border-neutral-200 p-3">
              <ChatBubble role="user" text={LONG_URL} fixed={fixed} />
              <ChatBubble role="ai" text="Here's the call:" code={CODE} fixed={fixed} />
            </div>
          )}
        </Section>

        <Section title="2. Chat input: placeholder clipped">
          {(fixed) => (
            <div className="w-64 rounded-2xl border border-neutral-200 p-3">
              <ChatInput fixed={fixed} />
            </div>
          )}
        </Section>

        <Section title="3. Theme picker: Recommended vs Default">
          {(fixed) => <ThemePicker fixed={fixed} />}
        </Section>

        <Section title="4. Onboarding tooltip + status pill">
          {(fixed) => <OnboardingDemo fixed={fixed} />}
        </Section>
      </div>
    </main>
  );
}