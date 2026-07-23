"use client";

import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUS_STEPS } from "@/lib/types";

type Props = {
  status: string;
  deliveryType?: string;
};

function normalizeStatus(status: string): OrderStatus {
  const s = status.toLowerCase();
  if (ORDER_STATUS_STEPS.some((step) => step.key === s)) return s as OrderStatus;
  if (s === "confirmed") return "paid";
  if (s === "in_progress") return "preparing";
  if (s === "done") return "completed";
  return "pending";
}

export default function OrderStatusTimeline({ status, deliveryType = "delivery" }: Props) {
  const current = normalizeStatus(status);
  const steps =
    deliveryType === "pickup"
      ? ORDER_STATUS_STEPS.filter((s) => s.key !== "delivering")
      : ORDER_STATUS_STEPS;

  const currentIndex = steps.findIndex((s) => s.key === current);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const done = index < activeIndex || (current === "completed" && index <= activeIndex);
        const active = index === activeIndex && current !== "completed";
        const upcoming = index > activeIndex;

        return (
          <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
            {index < steps.length - 1 && (
              <span
                className={`absolute left-[15px] top-8 h-full w-0.5 ${
                  done ? "bg-terracotta" : "bg-stone-200"
                }`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done
                  ? "bg-terracotta text-white"
                  : active
                    ? "bg-mustard text-ink ring-4 ring-mustard/30"
                    : "border-2 border-stone-200 bg-white text-muted"
              }`}
            >
              {done ? "✓" : index + 1}
            </span>
            <div className="pt-1">
              <p
                className={`font-medium ${
                  upcoming ? "text-muted" : active ? "text-terracotta" : "text-ink"
                }`}
              >
                {step.label}
              </p>
              {active && (
                <p className="mt-0.5 text-sm text-muted">Текущий статус</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
