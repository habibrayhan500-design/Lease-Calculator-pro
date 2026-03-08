import { LeaseSummary } from "@/lib/leaseCalculations";
import { DollarSign, TrendingDown, Percent, Building } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  summary: LeaseSummary;
}

const cards = [
  { label: "Total Lease Payments", key: "totalLeasePayments" as const, icon: DollarSign },
  { label: "Present Value (ROU Asset / Liability)", key: "presentValue" as const, icon: TrendingDown },
  { label: "Total Interest Expense", key: "totalInterest" as const, icon: Percent },
  { label: "Total Depreciation", key: "totalDepreciation" as const, icon: Building },
];

export function LeaseSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.key}
          className="rounded-xl border border-border bg-card p-5 space-y-2"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <c.icon className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">{c.label}</span>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">${fmt(summary[c.key])}</p>
        </div>
      ))}
    </div>
  );
}
