import { AmortizationRow } from "@/lib/leaseCalculations";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  schedule: AmortizationRow[];
}

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export function LiabilityChart({ schedule }: Props) {
  const data = schedule.map((r) => ({
    month: r.month,
    balance: Number(r.closingBalance.toFixed(2)),
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
        Lease Liability Over Time
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160, 84%, 30%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(160, 84%, 30%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 89%)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" width={70} />
          <Tooltip
            formatter={(value: number) => [fmt(value), "Balance"]}
            labelFormatter={(label) => `Month ${label}`}
            contentStyle={{
              backgroundColor: "hsl(0, 0%, 100%)",
              border: "1px solid hsl(220, 14%, 89%)",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="hsl(160, 84%, 30%)"
            strokeWidth={2}
            fill="url(#colorBal)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
