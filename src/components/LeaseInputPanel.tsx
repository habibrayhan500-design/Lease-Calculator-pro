import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

interface LeaseInputPanelProps {
  onCalculate: (data: {
    leasePeriodMonths: number;
    monthlyRent: number;
    annualInterestRate: number;
    startDate: string; // YYYY-MM
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const months = periodUnit === "years" ? Number(periodValue) * 12 : Number(periodValue);
    onCalculate({
      leasePeriodMonths: months,
      monthlyRent: Number(monthlyRent),
      annualInterestRate: Number(annualRate),
      startDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="startDate" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Lease Start Month
        </Label>
        <Input
          id="startDate"
          type="month"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-panel text-panel-foreground font-mono text-lg"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="period" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Lease Period
        </Label>
        <div className="flex gap-2">
          <Input
            id="period"
            type="number"
            min="1"
            value={periodValue}
            onChange={(e) => setPeriodValue(e.target.value)}
            className="bg-panel text-panel-foreground font-mono text-lg"
            required
          />
          <div className="flex rounded-lg border border-border overflow-hidden">
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

      <div className="space-y-2">
        <Label htmlFor="rent" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Monthly Rent ($)
        </Label>
        <Input
          id="rent"
          type="number"
          min="0"
          step="0.01"
          value={monthlyRent}
          onChange={(e) => setMonthlyRent(e.target.value)}
          className="bg-panel text-panel-foreground font-mono text-lg"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rate" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Annual Interest Rate (%)
        </Label>
        <Input
          id="rate"
          type="number"
          min="0"
          step="0.01"
          value={annualRate}
          onChange={(e) => setAnnualRate(e.target.value)}
          className="bg-panel text-panel-foreground font-mono text-lg"
          required
        />
      </div>

      <Button type="submit" size="lg" className="w-full gap-2 text-base font-semibold">
        <Calculator className="h-5 w-5" />
        Calculate Lease Schedule
      </Button>
    </form>
  );
}
