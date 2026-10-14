import { Truck } from "lucide-react";
import { STOCK_LABELS, type StockStatus } from "@/lib/catalog-constants";
import { cn } from "@/lib/utils";

const DOT: Record<StockStatus, string> = {
  IN_STOCK: "bg-success",
  LOW_STOCK: "bg-warning",
  OUT_OF_STOCK: "bg-danger",
  ON_REQUEST: "bg-warning",
};

/** Verfügbarkeit + Lieferzeit. Farbe ist nie alleiniger Informationsträger (Text daneben). */
export function StockStatusLine({
  status,
  deliveryTime,
  quantity,
  className,
}: {
  status: StockStatus;
  deliveryTime?: string;
  quantity?: number | null;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5 text-sm", className)}>
      <p className="flex items-center gap-2 font-medium">
        <span aria-hidden className={cn("size-2 rounded-full", DOT[status])} />
        {STOCK_LABELS[status]}
        {status === "LOW_STOCK" && quantity ? <span className="text-muted font-normal">({quantity} Stück)</span> : null}
      </p>
      {deliveryTime && status !== "OUT_OF_STOCK" && (
        <p className="text-muted flex items-center gap-2">
          <Truck aria-hidden className="size-3.5" /> Lieferzeit {deliveryTime}
        </p>
      )}
    </div>
  );
}
