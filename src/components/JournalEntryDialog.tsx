import { AmortizationRow, LeaseSummary } from "@/lib/leaseCalculations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { BookOpen } from "lucide-react";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface JournalEntry {
  account: string;
  debit: number;
  credit: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: AmortizationRow | null;
  summary: LeaseSummary;
  isFirstMonth: boolean;
}

export function JournalEntryDialog({ open, onOpenChange, row, summary, isFirstMonth }: Props) {
  if (!row) return null;

  const entries: { title: string; entries: JournalEntry[] }[] = [];

  // Initial recognition only in month 1
  if (isFirstMonth) {
    const initialEntries: JournalEntry[] = [
      { account: "Right-of-Use Asset", debit: summary.rouAssetInitial, credit: 0 },
      { account: "Lease Liability", debit: 0, credit: summary.presentValue },
    ];
    if (summary.initialDirectCosts > 0) {
      initialEntries.push({ account: "Cash / Bank (Initial Direct Costs)", debit: 0, credit: summary.initialDirectCosts });
    }
    if (summary.leaseIncentives > 0) {
      initialEntries.push({ account: "Cash / Bank (Lease Incentive Received)", debit: summary.leaseIncentives, credit: 0 });
    }
    if (summary.prepaidRent > 0) {
      initialEntries.push({ account: "Cash / Bank (Prepaid Rent)", debit: 0, credit: summary.prepaidRent });
    }
    entries.push({
      title: "1. Initial Recognition of Lease (IFRS 16.24)",
      entries: initialEntries,
    });
  }

  // Interest accrual
  entries.push({
    title: isFirstMonth ? "2. Interest Expense Accrual" : "1. Interest Expense Accrual",
    entries: [
      { account: "Interest Expense", debit: row.interestExpense, credit: 0 },
      { account: "Lease Liability", debit: 0, credit: row.interestExpense },
    ],
  });

  // Lease payment
  entries.push({
    title: isFirstMonth ? "3. Lease Payment" : "2. Lease Payment",
    entries: [
      { account: "Lease Liability", debit: row.leasePayment, credit: 0 },
      { account: "Cash / Bank", debit: 0, credit: row.leasePayment },
    ],
  });

  // Depreciation
  entries.push({
    title: isFirstMonth ? "4. Depreciation of ROU Asset" : "3. Depreciation of ROU Asset",
    entries: [
      { account: "Depreciation Expense", debit: row.depreciationExpense, credit: 0 },
      { account: "Accumulated Depreciation – ROU Asset", debit: 0, credit: row.depreciationExpense },
    ],
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            Journal Entries – {row.monthLabel}
          </DialogTitle>
        </DialogHeader>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Interest</p>
            <p className="font-mono font-bold text-foreground">{fmt(row.interestExpense)}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Depreciation</p>
            <p className="font-mono font-bold text-foreground">{fmt(row.depreciationExpense)}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Expense</p>
            <p className="font-mono font-bold text-foreground">{fmt(row.totalExpense)}</p>
          </div>
        </div>

        <Separator />

        {/* Journal entries */}
        <div className="space-y-5">
          {entries.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-foreground mb-2">{group.title}</h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Account</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right w-32">Debit ($)</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right w-32">Credit ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.entries.map((entry, idx) => (
                    <TableRow key={idx} className="font-mono text-sm">
                      <TableCell className={entry.credit > 0 ? "pl-8 text-muted-foreground" : "font-medium"}>
                        {entry.account}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.debit > 0 ? fmt(entry.debit) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit > 0 ? fmt(entry.credit) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>

        {/* Closing balances */}
        <Separator />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lease Liability (Closing)</p>
            <p className="font-mono font-bold text-foreground">${fmt(row.closingBalance)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ROU Asset (Net Book Value)</p>
            <p className="font-mono font-bold text-foreground">${fmt(row.rouAssetClosing)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
