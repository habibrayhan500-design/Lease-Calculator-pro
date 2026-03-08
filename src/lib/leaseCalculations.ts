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
}

export interface LeaseSummary {
  totalLeasePayments: number;
  presentValue: number;
  totalInterest: number;
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

  const schedule: AmortizationRow[] = [];
  let balance = pv;
  let totalInterest = 0;

  for (let i = 1; i <= input.leasePeriodMonths; i++) {
    const interest = balance * monthlyRate;
    const principal = input.monthlyRent - interest;
    const closing = Math.max(balance - principal, 0);

    schedule.push({
      month: i,
      openingBalance: balance,
      interestExpense: interest,
      leasePayment: input.monthlyRent,
      principalReduction: principal,
      closingBalance: closing,
    });

    totalInterest += interest;
    balance = closing;
  }

  return {
    schedule,
    summary: {
      totalLeasePayments: input.monthlyRent * input.leasePeriodMonths,
      presentValue: pv,
      totalInterest,
    },
  };
}

export function exportToCSV(schedule: AmortizationRow[]): string {
  const headers = ['Month', 'Opening Balance', 'Interest Expense', 'Lease Payment', 'Principal Reduction', 'Closing Balance'];
  const rows = schedule.map(r => [
    r.month,
    r.openingBalance.toFixed(2),
    r.interestExpense.toFixed(2),
    r.leasePayment.toFixed(2),
    r.principalReduction.toFixed(2),
    r.closingBalance.toFixed(2),
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}
