import { useState } from "react";
import { LeaseInputPanel } from "@/components/LeaseInputPanel";
import { LeaseSummaryCards } from "@/components/LeaseSummaryCards";
import { AmortizationTable } from "@/components/AmortizationTable";
import { LiabilityChart } from "@/components/LiabilityChart";
import { generateAmortizationSchedule, exportToCSV, exportToExcel, type LeaseInput, type AmortizationRow, type LeaseSummary } from "@/lib/leaseCalculations";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, BarChart3 } from "lucide-react";

interface CalcInput extends LeaseInput {
  startDate: string;
}

const Index = () => {
  const [result, setResult] = useState<{ schedule: AmortizationRow[]; summary: LeaseSummary } | null>(null);

  const handleCalculate = (input: CalcInput) => {
    setResult(generateAmortizationSchedule(input));
  };

  const handleExport = () => {
    if (!result) return;
    const csv = exportToCSV(result.schedule);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lease_amortization_schedule.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Lease Calculator Pro</h1>
            <p className="text-xs text-muted-foreground">IFRS 16 / ASC 842 Lease Amortization</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Panel */}
          <aside className="lg:w-80 shrink-0">
            <div className="rounded-xl border border-border bg-card p-6 sticky top-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">
                Lease Parameters
              </h2>
              <LeaseInputPanel onCalculate={handleCalculate} />
            </div>
          </aside>

          {/* Right Content */}
          <section className="flex-1 min-w-0 space-y-6">
            {!result ? (
              <div className="flex items-center justify-center h-96 rounded-xl border border-dashed border-border bg-card/50">
                <div className="text-center space-y-2">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                  <p className="text-muted-foreground font-medium">Enter lease parameters and click Calculate</p>
                  <p className="text-xs text-muted-foreground/60">Your amortization schedule will appear here</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Results
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                      <Download className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => result && exportToExcel(result.schedule, result.summary)}>
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel
                    </Button>
                  </div>
                </div>

                <LeaseSummaryCards summary={result.summary} />
                <LiabilityChart schedule={result.schedule} />

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Monthly Amortization Schedule
                  </h3>
                  <AmortizationTable schedule={result.schedule} summary={result.summary} />
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
