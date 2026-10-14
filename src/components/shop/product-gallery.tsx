"use client";

import { useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Expand, X } from "lucide-react";
import type { ImageRef } from "@/server/catalog/types";
import { ProductImage } from "./product-image";
import { cn } from "@/lib/utils";

/**
 * Produktgalerie: Hauptbild mit Lupen-Zoom (Maus), Vollbild-Ansicht (Tippen/Klick, natives Pinch-Zoom),
 * Thumbnails als Buttons (Tastatur), Pfeiltasten wechseln das Bild.
 */
export function ProductGallery({ images, name }: { images: ImageRef[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const frame = useRef<HTMLButtonElement>(null);
  const current = images[index] ?? images[0];

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !frame.current) return;
    const r = frame.current.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  const step = (d: number) => setIndex((i) => (i + d + images.length) % images.length);

  return (
    <div
      className="flex flex-col-reverse gap-3 md:flex-row"
      onKeyDown={(e) => {
        if (images.length < 2) return;
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }}
    >
      {images.length > 1 && (
        <ul className="flex shrink-0 scrollbar-none gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Bilder">
          {images.map((img, i) => (
            <li key={img.url + i}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Bild ${i + 1} von ${images.length} anzeigen`}
                aria-current={i === index}
                className={cn(
                  "bg-surface-2 relative block size-16 overflow-hidden rounded-xl border-2 md:size-20",
                  i === index ? "border-ink" : "hover:border-line-strong border-transparent",
                )}
              >
                <ProductImage src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button
            ref={frame}
            type="button"
            className="group border-line bg-surface-2 relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-tile)] border"
            onPointerMove={onMove}
            onPointerLeave={() => setZoom(null)}
            aria-label={`${current.alt} – Vollbild öffnen`}
          >
            <ProductImage
              src={current.url}
              alt={current.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              loading="eager"
              fetchPriority="high"
              className="object-cover transition-transform duration-200 ease-out"
              style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : { transform: "scale(1)" }}
            />
            <span className="bg-surface/90 absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm">
              <Expand aria-hidden className="size-3.5" /> Vergrößern
            </span>
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 data-[state=open]:animate-[fade-in_.2s_ease-out]" />
          <Dialog.Content
            className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">{name} – Bildansicht</Dialog.Title>
            {/* touch-action: pinch-zoom erlaubt natives Zoomen auf Mobilgeräten */}
            <div className="relative h-full max-h-[90dvh] w-full max-w-[90dvh] [touch-action:pinch-zoom]">
              <ProductImage src={current.url} alt={current.alt} fill sizes="90vw" className="object-contain" />
            </div>
            <Dialog.Close
              className="absolute top-4 right-4 inline-flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Bildansicht schließen"
            >
              <X aria-hidden className="size-6" />
            </Dialog.Close>
            {images.length > 1 && (
              <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Bild ${i + 1}`}
                    aria-current={i === index}
                    className={cn("size-3 rounded-full", i === index ? "bg-white" : "bg-white/40")}
                  />
                ))}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
