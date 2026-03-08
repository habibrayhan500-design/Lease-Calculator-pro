import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { PaymentTiming } from "@/lib/leaseCalculations";

interface LeaseInputPanelProps {
  onCalculate: (data: {
    leasePeriodMonths: number;
    monthlyRent: number;
    annualInterestRate: number;
    startDate: string;
    paymentTiming: PaymentTiming;
    initialDirectCosts: number;
    leaseIncentives: number;
    prepaidRent: number;
  }) => void;
}

export function LeaseInputPanel({ onCalculate }: LeaseInputPanelProps) {
  const [periodValue, setPeriodValue] = useState("36");
  const [periodUnit, setPeriodUnit] = useState<"months" | "years">("months");
  const [monthlyRent, setMonthlyRent] = useState("5000");
  const [annualRate, setAnnualRate] = useState("6");
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [startDate, setStartDate] = useState(defaultMonth);
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("end");
  const [initialDirectCosts, setInitialDirectCosts] = useState("0");
  const [leaseIncentives, setLeaseIncentives] = useState("0");
  const [prepaidRent, setPrepaidRent] = useState("0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const months = periodUnit === "years" ? Number(periodValue) * 12 : Number(periodValue);
    onCalculate({
      leasePeriodMonths: months,
      monthlyRent: Number(monthlyRent),
      annualInterestRate: Number(annualRate),
      startDate,
      paymentTiming,
      initialDirectCosts: Number(initialDirectCosts),
      leaseIncentives: Number(leaseIncentives),
      prepaidRent: Number(prepaidRent),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Start Date */}
      <div className="space-y-1.5">
        <Label htmlFor="startDate" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Lease Commencement Date
        </Label>
        <Input
          id="startDate"
          type="month"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-panel text-panel-foreground font-mono"
          required
        />
      </div>

      {/* Lease Period */}
      <div className="space-y-1.5">
        <Label htmlFor="period" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Lease Term
        </Label>
        <div className="flex gap-2">
          <Input
            id="period"
            type="number"
            min="1"
            value={periodValue}
            onChange={(e) => setPeriodValue(e.target.value)}
            className="bg-panel text-panel-foreground font-mono"
            required
          />
          <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setPeriodUnit("months")}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                periodUnit === "months"
                  ? "bg-primary text-primary-foreground"
                  : "bg-panel text-muted-foreground hover:text-foreground"
              }`}
            >
              Mo
            </button>
            <button
              type="button"
              onClick={() => setPeriodUnit("years")}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                periodUnit === "years"
                  ? "bg-primary text-primary-foreground"
                  : "bg-panel text-muted-foreground hover:text-foreground"
              }`}
            >
              Yr
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Rent */}
      <div className="space-y-1.5">
        <Label htmlFor="rent" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Monthly Lease Payment ($)
        </Label>
        <Input
          id="rent"
          type="number"
          min="0"
          step="0.01"
          value={monthlyRent}
          onChange={(e) => setMonthlyRent(e.target.value)}
          className="bg-panel text-panel-foreground font-mono"
          required
        />
      </div>

      {/* Payment Timing */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Payment Timing (IFRS 16.26)
        </Label>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setPaymentTiming("end")}
            className={`flex-1 px-3 py-2 text-xs font-semibold transition-colors ${
              paymentTiming === "end"
                ? "bg-primary text-primary-foreground"
                : "bg-panel text-muted-foreground hover:text-foreground"
            }`}
          >
            End of Period
          </button>
          <button
            type="button"
            onClick={() => setPaymentTiming("beginning")}
            className={`flex-1 px-3 py-2 text-xs font-semibold transition-colors ${
              paymentTiming === "beginning"
                ? "bg-primary text-primary-foreground"
                : "bg-panel text-muted-foreground hover:text-foreground"
            }`}
          >
            Beginning
          </button>
        </div>
      </div>

      {/* Interest Rate */}
      <div className="space-y-1.5">
        <Label htmlFor="rate" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Incremental Borrowing Rate (% p.a.)
        </Label>
        <Input
          id="rate"
          type="number"
          min="0"
          step="0.01"
          value={annualRate}
          onChange={(e) => setAnnualRate(e.target.value)}
          className="bg-panel text-panel-foreground font-mono"
          required
        />
        <p className="text-[10px] text-muted-foreground/70">IFRS 16.26(a) — Rate implicit in the lease or lessee's IBR</p>
      </div>

      <Separator />

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        ROU Asset Adjustments (IFRS 16.24)
      </p>

      {/* Initial Direct Costs */}
      <div className="space-y-1.5">
        <Label htmlFor="idc" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Initial Direct Costs ($)
        </Label>
        <Input
          id="idc"
          type="number"
          min="0"
          step="0.01"
          value={initialDirectCosts}
          onChange={(e) => setInitialDirectCosts(e.target.value)}
          className="bg-panel text-panel-foreground font-mono"
        />
        <p className="text-[10px] text-muted-foreground/70">IFRS 16.24(d) — Costs incurred by lessee</p>
      </div>

      {/* Lease Incentives */}
      <div className="space-y-1.5">
        <Label htmlFor="incentives" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Lease Incentives Received ($)
        </Label>
        <Input
          id="incentives"
          type="number"
          min="0"
          step="0.01"
          value={leaseIncentives}
          onChange={(e) => setLeaseIncentives(e.target.value)}
          className="bg-panel text-panel-foreground font-mono"
        />
        <p className="text-[10px] text-muted-foreground/70">IFRS 16.24(b) — Deducted from ROU asset</p>
      </div>

      {/* Prepaid Rent */}
      <div className="space-y-1.5">
        <Label htmlFor="prepaid" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Prepaid Rent / Advance Payments ($)
        </Label>
        <Input
          id="prepaid"
          type="number"
          min="0"
          step="0.01"
          value={prepaidRent}
          onChange={(e) => setPrepaidRent(e.target.value)}
          className="bg-panel text-panel-foreground font-mono"
        />
        <p className="text-[10px] text-muted-foreground/70">IFRS 16.24(c) — Payments made before commencement</p>
      </div>

      <Button type="submit" size="lg" className="w-full gap-2 text-base font-semibold">
        <Calculator className="h-5 w-5" />
        Calculate Lease Schedule
      </Button>
    </form>
  );
}
