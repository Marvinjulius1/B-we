import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Basis-Button (shadcn/ui-Muster). Mindesthöhe 44 px für Touch (WCAG 2.5.8).
 * Primär: Orange-Fläche mit dunkler Schrift (Kontrast 5,8:1).
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.15em] [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-brand text-brand-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)] hover:bg-brand-hover",
        dark: "bg-ink text-bg hover:bg-ink/85",
        outline: "border border-line-strong bg-surface text-ink hover:border-ink",
        ghost: "text-ink hover:bg-surface-2",
        link: "rounded-md px-0 text-brand-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "min-h-9 px-3.5 text-sm",
        md: "min-h-11 px-5 text-[0.95rem]",
        lg: "min-h-13 px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
