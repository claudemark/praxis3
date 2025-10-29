import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface DonutChartProps {
  data: { name: string; wert: number }[];
  colors: string[];
}

export function DonutChart({ data, colors }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="wert"
          nameKey="name"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={6}
          strokeWidth={6}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name) => [value + " %", name as string]}
          contentStyle={{ borderRadius: 16, border: "1px solid hsla(173, 88%, 28%, 0.2)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
