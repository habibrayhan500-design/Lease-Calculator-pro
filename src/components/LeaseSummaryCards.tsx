import { LeaseSummary } from "@/lib/leaseCalculations";
import { DollarSign, TrendingDown, Percent, Building, FileText, Gift } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  summary: LeaseSummary;
}

export function LeaseSummaryCards({ summary }: Props) {
  const cards = [
    { label: "Total Lease Payments", value: summary.totalLeasePayments, icon: DollarSign },
    { label: "Lease Liability (PV)", value: summary.presentValue, icon: TrendingDown },
    { label: "ROU Asset (Initial)", value: summary.rouAssetInitial, icon: Building },
    { label: "Total Interest Expense", value: summary.totalInterest, icon: Percent },
    { label: "Total Depreciation", value: summary.totalDepreciation, icon: FileText },
  ];

  // Only show adjustment cards if they have values
  if (summary.initialDirectCosts > 0) {
    cards.push({ label: "Initial Direct Costs", value: summary.initialDirectCosts, icon: Gift });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-5 space-y-2"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <c.icon className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">{c.label}</span>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">${fmt(c.value)}</p>
        </div>
      ))}
    </div>
  );
}
