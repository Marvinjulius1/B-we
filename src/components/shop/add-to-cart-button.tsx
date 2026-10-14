"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCart, type CartLine } from "@/stores/cart";

/**
 * Legt einen Artikel in den Warenkorb und kündigt das für Screenreader an.
 * (Die "Fly-to-Cart"-Animation folgt in Phase 4 als progressive Erweiterung.)
 */
export function AddToCartButton({
  line,
  quantity = 1,
  disabled,
  label = "In den Warenkorb",
  ...props
}: { line: Omit<CartLine, "quantity">; quantity?: number; label?: string } & Omit<ButtonProps, "onClick">) {
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <>
      <Button
        {...props}
        disabled={disabled}
        onClick={() => {
          add(line, quantity);
          setDone(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setDone(false), 2000);
        }}
      >
        {done ? <Check aria-hidden /> : <ShoppingBag aria-hidden />}
        {done ? "Hinzugefügt" : label}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {done ? `${quantity} × ${line.name} wurde in den Warenkorb gelegt.` : ""}
      </span>
    </>
  );
}
