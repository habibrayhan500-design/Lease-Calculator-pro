import { AmortizationRow, LeaseSummary } from "@/lib/leaseCalculations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface AnnualData {
  yearLabel: string;
  yearNumber: number;
  months: AmortizationRow[];
  totalInterest: number;
  totalDepreciation: number;
  totalExpense: number;
  totalPayments: number;
  totalPrepaidAdj: number;
  closingLiability: number;
  closingRouAsset: number;
  accumulatedDepreciation: number;
}

interface Props {
  schedule: AmortizationRow[];
  summary: LeaseSummary;
}

function computeAnnualData(schedule: AmortizationRow[], summary: LeaseSummary): AnnualData[] {
  const years: AnnualData[] = [];
  const totalMonths = schedule.length;
  const numYears = Math.ceil(totalMonths / 12);
  let cumulativeDepreciation = 0;

  for (let y = 0; y < numYears; y++) {
    const start = y * 12;
    const end = Math.min(start + 12, totalMonths);
    const months = schedule.slice(start, end);

    const totalInterest = months.reduce((s, r) => s + r.interestExpense, 0);
    const totalDepreciation = months.reduce((s, r) => s + r.depreciationExpense, 0);
    const totalExpense = months.reduce((s, r) => s + r.totalExpense, 0);
    const totalPayments = months.reduce((s, r) => s + r.leasePayment, 0);
    const totalPrepaidAdj = months.reduce((s, r) => s + r.prepaidAdjustment, 0);
    cumulativeDepreciation += totalDepreciation;

    const lastRow = months[months.length - 1];
    const firstLabel = months[0].monthLabel;
    const lastLabel = lastRow.monthLabel;

    years.push({
      yearLabel: `${firstLabel} – ${lastLabel}`,
      yearNumber: y + 1,
      months,
      totalInterest,
      totalDepreciation,
      totalExpense,
      totalPayments,
      totalPrepaidAdj,
      closingLiability: lastRow.closingBalance,
      closingRouAsset: lastRow.rouAssetClosing,
      accumulatedDepreciation: cumulativeDepreciation,
    });
  }

  return years;
}

function StatLine({ label, value, bold, indent }: { label: string; value: number; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 ${indent ? "pl-4" : ""} ${bold ? "font-semibold border-t border-border pt-2" : ""}`}>
      <span className={`text-sm ${bold ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span className={`font-mono text-sm ${bold ? "text-foreground" : ""}`}>{fmt(value)}</span>
    </div>
  );
}

function DoubleStatLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between py-1.5 font-bold border-t-2 border-b-2 border-foreground pt-2 pb-2">
      <span className="text-sm text-foreground">{label}</span>
      <span className="font-mono text-sm text-foreground">{fmt(value)}</span>
    </div>
  );
}

export function FinancialStatements({ schedule, summary }: Props) {
  const annualData = computeAnnualData(schedule, summary);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Annual Financial Statements
        </h3>
      </div>

      <Accordion type="multiple" className="space-y-3">
        {annualData.map((year) => (
          <AccordionItem
            key={year.yearNumber}
            value={`year-${year.yearNumber}`}
            className="rounded-xl border border-border bg-card px-5 data-[state=open]:pb-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  Y{year.yearNumber}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{year.yearLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    Total Expense: {fmt(year.totalExpense)} · Closing Liability: {fmt(year.closingLiability)}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Income Statement Extract */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                    Income Statement (P&L Extract)
                  </h4>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Operating Expenses</p>
                    <StatLine label="Depreciation – ROU Asset" value={year.totalDepreciation} indent />
                    {year.totalPrepaidAdj > 0 && (
                      <StatLine label="Prepaid Rent Adjustment" value={year.totalPrepaidAdj} indent />
                    )}
                    <StatLine label="Total Operating Expense" value={year.totalDepreciation + year.totalPrepaidAdj} bold />

                    <div className="h-3" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Finance Costs</p>
                    <StatLine label="Interest on Lease Liability" value={year.totalInterest} indent />
                    <StatLine label="Total Finance Costs" value={year.totalInterest} bold />

                    <div className="h-3" />
                    <DoubleStatLine
                      label="Total Lease-Related Expense"
                      value={year.totalExpense + year.totalPrepaidAdj}
                    />
                  </div>
                </div>

                {/* Balance Sheet Extract */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                    Balance Sheet (Extract)
                  </h4>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Non-Current Assets</p>
                    <StatLine label="ROU Asset (Gross)" value={summary.rouAssetInitial} indent />
                    <StatLine label="Less: Accumulated Depreciation" value={-year.accumulatedDepreciation} indent />
                    <StatLine label="ROU Asset (Net)" value={year.closingRouAsset} bold />

                    <div className="h-3" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Liabilities</p>
                    <StatLine label="Lease Liability" value={year.closingLiability} indent />

                    <div className="h-3" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cash Flow Impact</p>
                    <StatLine label="Lease Payments Made" value={-year.totalPayments} indent />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
