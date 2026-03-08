import { AmortizationRow, LeaseSummary } from "@/lib/leaseCalculations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JournalEntryDialog } from "@/components/JournalEntryDialog";
import { useState } from "react";

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  schedule: AmortizationRow[];
  summary: LeaseSummary;
}

export function AmortizationTable({ schedule, summary }: Props) {
  const [selectedRow, setSelectedRow] = useState<AmortizationRow | null>(null);
  const hasPrepaid = schedule.some(r => r.prepaidAdjustment > 0);

  return (
    <>
      <ScrollArea className="h-[480px] rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground w-16">Month</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Opening Liability</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Interest</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Payment</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Principal</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Closing Liability</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-accent-foreground text-right bg-accent/30">Depreciation</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-accent-foreground text-right bg-accent/30">ROU Asset</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Total Expense</TableHead>
              {hasPrepaid && (
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-primary text-right bg-primary/10">Prepaid Adj.</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((row) => (
              <TableRow key={row.month} className="font-mono text-sm">
                <TableCell>
                  <button
                    onClick={() => setSelectedRow(row)}
                    className="font-semibold text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary cursor-pointer transition-colors"
                    title={`View journal entries for ${row.monthLabel}`}
                  >
                    {row.monthLabel}
                  </button>
                </TableCell>
                <TableCell className="text-right">{fmt(row.openingBalance)}</TableCell>
                <TableCell className="text-right text-accent-foreground">{fmt(row.interestExpense)}</TableCell>
                <TableCell className="text-right">{fmt(row.leasePayment)}</TableCell>
                <TableCell className="text-right">{fmt(row.principalReduction)}</TableCell>
                <TableCell className="text-right font-semibold">{fmt(row.closingBalance)}</TableCell>
                <TableCell className="text-right text-accent-foreground bg-accent/10">{fmt(row.depreciationExpense)}</TableCell>
                <TableCell className="text-right bg-accent/10">{fmt(row.rouAssetClosing)}</TableCell>
                <TableCell className="text-right font-semibold">{fmt(row.totalExpense)}</TableCell>
                {hasPrepaid && (
                  <TableCell className={`text-right bg-primary/5 ${row.prepaidAdjustment > 0 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    {row.prepaidAdjustment > 0 ? `$${fmt(row.prepaidAdjustment)}` : "—"}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <JournalEntryDialog
        open={!!selectedRow}
        onOpenChange={(open) => !open && setSelectedRow(null)}
        row={selectedRow}
        summary={summary}
        isFirstMonth={selectedRow?.month === 1}
      />
    </>
  );
}
