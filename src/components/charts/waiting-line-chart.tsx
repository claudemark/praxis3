import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WaitingLineChartProps {
  data: { slot: string; minuten: number }[];
}

export function WaitingLineChart({ data }: WaitingLineChartProps) {
  const formatMinutes = (value: number) => value.toString().concat(" min");
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4" stroke="hsla(206, 20%, 80%, 0.5)" />
        <XAxis dataKey="slot" axisLine={false} tickLine={false} tickMargin={10} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          tickFormatter={formatMinutes}
          domain={[0, 40]}
        />
        <Tooltip
          formatter={(value: number) => formatMinutes(value)}
          contentStyle={{ borderRadius: 14, border: "1px solid hsla(28, 92%, 57%, 0.35)" }}
        />
        <Line
          type="monotone"
          dataKey="minuten"
          stroke="#ff8c42"
          strokeWidth={3}
          dot={{ r: 4, stroke: "#ffffff", strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
