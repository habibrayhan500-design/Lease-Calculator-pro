export type PaymentTiming = 'end' | 'beginning';

export interface PrepaidRentConfig {
  amount: number;
  startMonth: number; // 1-indexed month number where adjustment begins
  adjustmentMonths: number; // number of months over which to spread
}

export interface LeaseInput {
  leasePeriodMonths: number;
  monthlyRent: number;
  annualInterestRate: number;
  startDate?: string; // YYYY-MM
  paymentTiming: PaymentTiming;
  initialDirectCosts: number;
  leaseIncentives: number;
  prepaidRent: number;
  prepaidRentConfig?: PrepaidRentConfig;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getMonthLabel(startDate: string | undefined, monthIndex: number): string {
  if (!startDate) return `Month ${monthIndex}`;
  const [year, month] = startDate.split('-').map(Number);
  const totalMonths = (month - 1) + (monthIndex - 1);
  const m = totalMonths % 12;
  const y = year + Math.floor(totalMonths / 12);
  return `${MONTH_NAMES[m]} ${y}`;
}

export interface AmortizationRow {
  month: number;
  monthLabel: string;
  openingBalance: number;
  interestExpense: number;
  leasePayment: number;
  principalReduction: number;
  closingBalance: number;
  depreciationExpense: number;
  rouAssetOpening: number;
  rouAssetClosing: number;
  totalExpense: number;
  prepaidAdjustment: number; // prepaid rent adjustment for this month
}

export interface LeaseSummary {
  totalLeasePayments: number;
  presentValue: number;
  totalInterest: number;
  totalDepreciation: number;
  monthlyDepreciation: number;
  rouAssetInitial: number;
  initialDirectCosts: number;
  leaseIncentives: number;
  prepaidRent: number;
}

/**
 * PV of ordinary annuity (payments at end) or annuity due (payments at beginning)
 */
export function calculatePresentValue(
  monthlyPayment: number,
  monthlyRate: number,
  periods: number,
  timing: PaymentTiming = 'end'
): number {
  if (monthlyRate === 0) return monthlyPayment * periods;
  const pvOrdinary = monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -periods)) / monthlyRate);
  if (timing === 'beginning') {
    // Annuity due = ordinary annuity × (1 + r)
    return pvOrdinary * (1 + monthlyRate);
  }
  return pvOrdinary;
}

export function generateAmortizationSchedule(input: LeaseInput): {
  schedule: AmortizationRow[];
  summary: LeaseSummary;
} {
  const monthlyRate = input.annualInterestRate / 100 / 12;
  const timing = input.paymentTiming || 'end';
  const pv = calculatePresentValue(input.monthlyRent, monthlyRate, input.leasePeriodMonths, timing);

  // IFRS 16 para 24: ROU Asset = Lease Liability + Initial Direct Costs + Prepaid Rent − Lease Incentives
  const initialDirectCosts = input.initialDirectCosts || 0;
  const leaseIncentives = input.leaseIncentives || 0;
  const prepaidRent = input.prepaidRent || 0;
  const rouAssetInitial = pv + initialDirectCosts + prepaidRent - leaseIncentives;

  const monthlyDepreciation = rouAssetInitial / input.leasePeriodMonths;

  const schedule: AmortizationRow[] = [];
  let balance = pv;
  let rouAsset = rouAssetInitial;
  let totalInterest = 0;

  for (let i = 1; i <= input.leasePeriodMonths; i++) {
    if (timing === 'beginning') {
      // For annuity due: payment first, then interest on remaining balance
      const balanceAfterPayment = balance - input.monthlyRent;
      const interest = Math.max(balanceAfterPayment, 0) * monthlyRate;
      const principal = input.monthlyRent - interest;
      const closing = Math.max(balance - principal, 0);
      const rouClosing = Math.max(rouAsset - monthlyDepreciation, 0);

      schedule.push({
        month: i,
        monthLabel: getMonthLabel(input.startDate, i),
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
    } else {
      // Ordinary annuity: interest first, then payment
      const interest = balance * monthlyRate;
      const principal = input.monthlyRent - interest;
      const closing = Math.max(balance - principal, 0);
      const rouClosing = Math.max(rouAsset - monthlyDepreciation, 0);

      schedule.push({
        month: i,
        monthLabel: getMonthLabel(input.startDate, i),
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
  }

  return {
    schedule,
    summary: {
      totalLeasePayments: input.monthlyRent * input.leasePeriodMonths,
      presentValue: pv,
      totalInterest,
      totalDepreciation: rouAssetInitial,
      monthlyDepreciation,
      rouAssetInitial,
      initialDirectCosts,
      leaseIncentives,
      prepaidRent,
    },
  };
}

export function exportToCSV(schedule: AmortizationRow[]): string {
  const headers = ['Month', 'Month Label', 'Opening Liability', 'Interest Expense', 'Lease Payment', 'Principal Reduction', 'Closing Liability', 'ROU Asset Opening', 'Depreciation', 'ROU Asset Closing', 'Total Expense'];
  const rows = schedule.map(r => [
    r.month,
    r.monthLabel,
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
    const summaryRows = [
      ['Lease Amortization Summary (IFRS 16 / ASC 842)'],
      [],
      ['Metric', 'Value'],
      ['Total Lease Payments', summary.totalLeasePayments],
      ['Present Value of Lease Liability', summary.presentValue],
      ['Initial Direct Costs', summary.initialDirectCosts],
      ['Lease Incentives Received', summary.leaseIncentives],
      ['Prepaid Rent', summary.prepaidRent],
      ['ROU Asset (Initial)', summary.rouAssetInitial],
      ['Total Interest Expense', summary.totalInterest],
      ['Total Depreciation', summary.totalDepreciation],
      ['Monthly Depreciation', summary.monthlyDepreciation],
    ];

    const headerRow = ['Month', 'Period', 'Opening Liability', 'Interest Expense', 'Lease Payment', 'Principal Reduction', 'Closing Liability', 'ROU Asset Opening', 'Depreciation', 'ROU Asset Closing', 'Total Expense'];

    const scheduleData: any[][] = [headerRow];

    const n = schedule.length;
    const monthlyRate = n > 0 ? (summary.totalInterest > 0
      ? schedule[0].interestExpense / schedule[0].openingBalance
      : 0) : 0;
    const monthlyDepr = summary.monthlyDepreciation;

    for (let i = 0; i < n; i++) {
      const row = i + 2;
      const r = schedule[i];

      if (i === 0) {
        scheduleData.push([
          1,
          r.monthLabel,
          summary.presentValue,
          { f: `C${row}*${monthlyRate}` },
          r.leasePayment,
          { f: `E${row}-D${row}` },
          { f: `C${row}-F${row}` },
          summary.rouAssetInitial,
          monthlyDepr,
          { f: `H${row}-I${row}` },
          { f: `D${row}+I${row}` },
        ]);
      } else {
        scheduleData.push([
          i + 1,
          r.monthLabel,
          { f: `G${row - 1}` },
          { f: `C${row}*${monthlyRate}` },
          r.leasePayment,
          { f: `E${row}-D${row}` },
          { f: `C${row}-F${row}` },
          { f: `J${row - 1}` },
          monthlyDepr,
          { f: `H${row}-I${row}` },
          { f: `D${row}+I${row}` },
        ]);
      }
    }

    const lastDataRow = n + 1;
    scheduleData.push([]);
    scheduleData.push([
      'TOTALS', '', '',
      { f: `SUM(D2:D${lastDataRow})` },
      { f: `SUM(E2:E${lastDataRow})` },
      { f: `SUM(F2:F${lastDataRow})` },
      '', '',
      { f: `SUM(I2:I${lastDataRow})` },
      '',
      { f: `SUM(K2:K${lastDataRow})` },
    ]);

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 38 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const wsSchedule = XLSX.utils.aoa_to_sheet(scheduleData);
    wsSchedule['!cols'] = headerRow.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, wsSchedule, 'Amortization Schedule');

    XLSX.writeFile(wb, 'lease_amortization_schedule.xlsx');
  });
}
