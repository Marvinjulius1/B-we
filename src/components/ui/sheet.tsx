"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Seitliches/unteres Panel auf Basis von Radix Dialog (Fokusfalle, Escape, aria-modal inklusive). */
export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

const sides = {
  left: "inset-y-0 left-0 h-full w-[min(92vw,26rem)] data-[state=open]:animate-[sheet-in-left_.35s_var(--ease-out-expo)]",
  right: "inset-y-0 right-0 h-full w-[min(92vw,28rem)] data-[state=open]:animate-[sheet-in-right_.35s_var(--ease-out-expo)]",
  top: "inset-x-0 top-0 max-h-[90dvh] w-full data-[state=open]:animate-[sheet-in-top_.35s_var(--ease-out-expo)]",
  bottom:
    "inset-x-0 bottom-0 max-h-[90dvh] w-full rounded-t-[var(--radius-tile)] data-[state=open]:animate-[sheet-in-bottom_.35s_var(--ease-out-expo)]",
} as const;

export function SheetContent({
  side = "right",
  className,
  children,
  closeLabel = "Schließen",
  ...props
}: React.ComponentProps<typeof Dialog.Content> & { side?: keyof typeof sides; closeLabel?: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-[2px] data-[state=open]:animate-[fade-in_.25s_ease-out]" />
      <Dialog.Content
        className={cn(
          "bg-surface text-ink fixed z-50 flex flex-col overflow-hidden shadow-[var(--shadow-lift)] outline-none",
          sides[side],
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close
          className="text-muted hover:bg-surface-2 hover:text-ink absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full"
          aria-label={closeLabel}
        >
          <X aria-hidden className="size-5" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
