import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/utils";

interface RevenueAreaChartProps {
  data: { monat: string; goa: number; igel: number }[];
}

export function RevenueAreaChart({ data }: RevenueAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="goaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0d6a63" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#0d6a63" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="igelGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff8c42" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#ff8c42" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4" stroke="hsla(206, 20%, 80%, 0.4)" />
        <XAxis dataKey="monat" stroke="hsla(206, 20%, 40%, 0.8)" tickLine={false} axisLine={false} />
        <YAxis
          stroke="hsla(206, 20%, 40%, 0.8)"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          labelStyle={{ color: "hsl(213 28% 17%)", fontWeight: 600 }}
          contentStyle={{ borderRadius: 16, border: "1px solid hsla(173, 88%, 28%, 0.2)" }}
        />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        <Area
          type="natural"
          dataKey="goa"
          name="GOÄ"
          stroke="#0d6a63"
          fill="url(#goaGradient)"
          strokeWidth={2.5}
        />
        <Area
          type="natural"
          dataKey="igel"
          name="IGeL"
          stroke="#ff8c42"
          fill="url(#igelGradient)"
          strokeWidth={2.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
