export interface LeaseInput {
  leasePeriodMonths: number;
  monthlyRent: number;
  annualInterestRate: number;
}

export interface AmortizationRow {
  month: number;
  openingBalance: number;
  interestExpense: number;
  leasePayment: number;
  principalReduction: number;
  closingBalance: number;
  depreciationExpense: number;
  rouAssetOpening: number;
  rouAssetClosing: number;
  totalExpense: number;
}

export interface LeaseSummary {
  totalLeasePayments: number;
  presentValue: number;
  totalInterest: number;
  totalDepreciation: number;
  monthlyDepreciation: number;
}

export function calculatePresentValue(monthlyPayment: number, monthlyRate: number, periods: number): number {
  if (monthlyRate === 0) return monthlyPayment * periods;
  return monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -periods)) / monthlyRate);
}

export function generateAmortizationSchedule(input: LeaseInput): {
  schedule: AmortizationRow[];
  summary: LeaseSummary;
} {
  const monthlyRate = input.annualInterestRate / 100 / 12;
  const pv = calculatePresentValue(input.monthlyRent, monthlyRate, input.leasePeriodMonths);
  const monthlyDepreciation = pv / input.leasePeriodMonths;

  const schedule: AmortizationRow[] = [];
  let balance = pv;
  let rouAsset = pv;
  let totalInterest = 0;

  for (let i = 1; i <= input.leasePeriodMonths; i++) {
    const interest = balance * monthlyRate;
    const principal = input.monthlyRent - interest;
    const closing = Math.max(balance - principal, 0);
    const rouClosing = Math.max(rouAsset - monthlyDepreciation, 0);

    schedule.push({
      month: i,
      openingBalance: balance,
      interestExpense: interest,
      leasePayment: input.monthlyRent,
      principalReduction: principal,
      closingBalance: closing,
      depreciationExpense: monthlyDepreciation,
      rouAssetOpening: rouAsset,
      rouAssetClosing: rouClosing,
      totalExpense: interest + monthlyDepreciation,
    });

    totalInterest += interest;
    balance = closing;
    rouAsset = rouClosing;
  }

  return {
    schedule,
    summary: {
      totalLeasePayments: input.monthlyRent * input.leasePeriodMonths,
      presentValue: pv,
      totalInterest,
      totalDepreciation: pv,
      monthlyDepreciation,
    },
  };
}

export function exportToCSV(schedule: AmortizationRow[]): string {
  const headers = ['Month', 'Opening Liability', 'Interest Expense', 'Lease Payment', 'Principal Reduction', 'Closing Liability', 'ROU Asset Opening', 'Depreciation', 'ROU Asset Closing', 'Total Expense'];
  const rows = schedule.map(r => [
    r.month,
    r.openingBalance.toFixed(2),
    r.interestExpense.toFixed(2),
    r.leasePayment.toFixed(2),
    r.principalReduction.toFixed(2),
    r.closingBalance.toFixed(2),
    r.rouAssetOpening.toFixed(2),
    r.depreciationExpense.toFixed(2),
    r.rouAssetClosing.toFixed(2),
    r.totalExpense.toFixed(2),
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportToExcel(schedule: AmortizationRow[], summary: LeaseSummary): void {
  import('xlsx').then((XLSX) => {
    const headers = ['Month', 'Opening Liability', 'Interest Expense', 'Lease Payment', 'Principal Reduction', 'Closing Liability', 'ROU Asset Opening', 'Depreciation', 'ROU Asset Closing', 'Total Expense'];
    const data = schedule.map(r => [
      r.month,
      Number(r.openingBalance.toFixed(2)),
      Number(r.interestExpense.toFixed(2)),
      Number(r.leasePayment.toFixed(2)),
      Number(r.principalReduction.toFixed(2)),
      Number(r.closingBalance.toFixed(2)),
      Number(r.rouAssetOpening.toFixed(2)),
      Number(r.depreciationExpense.toFixed(2)),
      Number(r.rouAssetClosing.toFixed(2)),
      Number(r.totalExpense.toFixed(2)),
    ]);

    const summaryData = [
      ['Lease Amortization Summary'],
      [],
      ['Total Lease Payments', summary.totalLeasePayments],
      ['Present Value (ROU Asset / Liability)', summary.presentValue],
      ['Total Interest Expense', summary.totalInterest],
      ['Total Depreciation', summary.totalDepreciation],
      ['Monthly Depreciation', summary.monthlyDepreciation],
      [],
      headers,
      ...data,
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lease Schedule');

    // Auto-size columns
    ws['!cols'] = headers.map(() => ({ wch: 20 }));

    XLSX.writeFile(wb, 'lease_amortization_schedule.xlsx');
  });
}
