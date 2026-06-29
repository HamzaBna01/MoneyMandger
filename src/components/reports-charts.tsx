"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCents } from "@/lib/money";
import { useDict } from "@/components/i18n-provider";

const PALETTE = [
  "#1d9e75",
  "#ef9f27",
  "#a32d2d",
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#ec4899",
  "#64748b",
];

export interface CategorySlice {
  name: string;
  value: number; // cents
}
export interface MonthBar {
  month: string;
  income: number; // cents
  expense: number; // cents
}

export function SpendingDonut({
  data,
  currency,
}: {
  data: CategorySlice[];
  currency: string;
}) {
  const dict = useDict();
  if (data.length === 0) {
    return <Empty text={dict.reports.noSpending} />;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={64}
          outerRadius={104}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCents(Number(value), currency)}
          contentStyle={tooltipStyle}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseBars({
  data,
  currency,
}: {
  data: MonthBar[];
  currency: string;
}) {
  const dict = useDict();
  const legendLabel = (value: string) =>
    value === "income" ? dict.reports.legendIncome : dict.reports.legendExpense;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={4}>
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickFormatter={(v: number) => `${Math.round(v / 100000)}k`}
          tickLine={false}
          axisLine={false}
          width={36}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          formatter={(value) => formatCents(Number(value), currency)}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          contentStyle={tooltipStyle}
        />
        <Legend
          iconType="circle"
          formatter={(value) => (
            <span className="text-xs text-muted-foreground">
              {legendLabel(String(value))}
            </span>
          )}
        />
        <Bar dataKey="income" fill="#1d9e75" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#a32d2d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
