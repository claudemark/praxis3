import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ComplianceRadarChartProps {
  data: { name: string; wert: number }[];
}

export function ComplianceRadarChart({ data }: ComplianceRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid stroke="hsla(173, 88%, 28%, 0.2)" />
        <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(213 28% 17%)", fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsla(206, 16%, 45%, 0.8)" }} />
        <Tooltip
          formatter={(value: number) => value + "%"}
          contentStyle={{ borderRadius: 14, border: "1px solid hsla(173, 88%, 28%, 0.2)" }}
        />
        <Radar
          name="Compliance"
          dataKey="wert"
          stroke="#0d6a63"
          fill="#0d6a63"
          fillOpacity={0.35}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
