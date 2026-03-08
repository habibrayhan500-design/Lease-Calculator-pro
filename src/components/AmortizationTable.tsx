import { AmortizationRow } from "@/lib/leaseCalculations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  schedule: AmortizationRow[];
}

export function AmortizationTable({ schedule }: Props) {
  return (
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedule.map((row) => (
            <TableRow key={row.month} className="font-mono text-sm">
              <TableCell className="font-semibold text-muted-foreground">{row.month}</TableCell>
              <TableCell className="text-right">${fmt(row.openingBalance)}</TableCell>
              <TableCell className="text-right text-accent-foreground">${fmt(row.interestExpense)}</TableCell>
              <TableCell className="text-right">${fmt(row.leasePayment)}</TableCell>
              <TableCell className="text-right">${fmt(row.principalReduction)}</TableCell>
              <TableCell className="text-right font-semibold">${fmt(row.closingBalance)}</TableCell>
              <TableCell className="text-right text-accent-foreground bg-accent/10">${fmt(row.depreciationExpense)}</TableCell>
              <TableCell className="text-right bg-accent/10">${fmt(row.rouAssetClosing)}</TableCell>
              <TableCell className="text-right font-semibold">${fmt(row.totalExpense)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
