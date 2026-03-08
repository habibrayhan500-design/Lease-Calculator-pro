import { AmortizationRow, LeaseSummary } from "@/lib/leaseCalculations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FileText, Printer } from "lucide-react";

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

function generatePrintHTML(annualData: AnnualData[], summary: LeaseSummary): string {
  const statRow = (label: string, value: number, opts?: { bold?: boolean; indent?: boolean; double?: boolean }) => {
    const style = [
      'display:flex', 'justify-content:space-between', 'padding:4px 0',
      opts?.indent ? 'padding-left:16px' : '',
      opts?.bold ? 'font-weight:600;border-top:1px solid #ccc;padding-top:8px' : '',
      opts?.double ? 'font-weight:700;border-top:2px solid #333;border-bottom:2px solid #333;padding:8px 0' : '',
    ].filter(Boolean).join(';');
    return `<div style="${style}"><span>${label}</span><span style="font-family:monospace">${fmt(value)}</span></div>`;
  };

  const yearSections = annualData.map(year => `
    <div style="page-break-inside:avoid;margin-bottom:32px">
      <h2 style="font-size:16px;margin:0 0 4px;color:#333">Year ${year.yearNumber}: ${year.yearLabel}</h2>
      <p style="font-size:12px;color:#888;margin:0 0 16px">Total Expense: ${fmt(year.totalExpense)} · Closing Liability: ${fmt(year.closingLiability)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div>
          <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;margin:0 0 12px;border-bottom:2px solid #666;padding-bottom:4px">Income Statement (P&L Extract)</h3>
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin:0 0 4px">Operating Expenses</p>
          ${statRow('Depreciation – ROU Asset', year.totalDepreciation, { indent: true })}
          ${year.totalPrepaidAdj > 0 ? statRow('Prepaid Rent Adjustment', year.totalPrepaidAdj, { indent: true }) : ''}
          ${statRow('Total Operating Expense', year.totalDepreciation + year.totalPrepaidAdj, { bold: true })}
          <div style="height:12px"></div>
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin:0 0 4px">Finance Costs</p>
          ${statRow('Interest on Lease Liability', year.totalInterest, { indent: true })}
          ${statRow('Total Finance Costs', year.totalInterest, { bold: true })}
          <div style="height:12px"></div>
          ${statRow('Total Lease-Related Expense', year.totalExpense + year.totalPrepaidAdj, { double: true })}
        </div>
        <div>
          <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;margin:0 0 12px;border-bottom:2px solid #666;padding-bottom:4px">Balance Sheet (Extract)</h3>
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin:0 0 4px">Non-Current Assets</p>
          ${statRow('ROU Asset (Gross)', summary.rouAssetInitial, { indent: true })}
          ${statRow('Less: Accumulated Depreciation', -year.accumulatedDepreciation, { indent: true })}
          ${statRow('ROU Asset (Net)', year.closingRouAsset, { bold: true })}
          <div style="height:12px"></div>
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin:0 0 4px">Liabilities</p>
          ${statRow('Lease Liability', year.closingLiability, { indent: true })}
          <div style="height:12px"></div>
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin:0 0 4px">Cash Flow Impact</p>
          ${statRow('Lease Payments Made', -year.totalPayments, { indent: true })}
        </div>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Annual Financial Statements – IFRS 16</title>
<style>
  @media print { @page { margin: 20mm; } body { -webkit-print-color-adjust: exact; } }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #222; max-width: 900px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .subtitle { font-size: 12px; color: #888; margin: 0 0 24px; }
  .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
  .summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
  .summary-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 4px; }
  .summary-card .value { font-size: 18px; font-weight: 700; font-family: monospace; }
</style></head><body>
<h1>Annual Financial Statements</h1>
<p class="subtitle">IFRS 16 / ASC 842 Lease Accounting · Generated ${new Date().toLocaleDateString()}</p>
<div class="summary-grid">
  <div class="summary-card"><p class="label">Total Lease Payments</p><p class="value">${fmt(summary.totalLeasePayments)}</p></div>
  <div class="summary-card"><p class="label">Lease Liability (PV)</p><p class="value">${fmt(summary.presentValue)}</p></div>
  <div class="summary-card"><p class="label">ROU Asset (Initial)</p><p class="value">${fmt(summary.rouAssetInitial)}</p></div>
</div>
${yearSections}
</body></html>`;
}

function handlePrint(annualData: AnnualData[], summary: LeaseSummary) {
  const html = generatePrintHTML(annualData, summary);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Annual Financial Statements
          </h3>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => handlePrint(annualData, summary)}>
          <Printer className="h-4 w-4" />
          Print / PDF
        </Button>
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
