"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface CustomPieChartProps {
  data: DataPoint[];
  title: string;
  height?: number;
}

const COLORS = [
  "#60B5FF",
  "#FF9149",
  "#FF9898",
  "#FF90BB",
  "#80D8C3",
  "#A19AD3",
  "#72BF78",
];

export function CustomPieChart({
  data,
  title,
  height = 300,
}: CustomPieChartProps) {
  const formatTooltip = (value: number, name: string) => {
    const total = data.reduce((sum, entry) => sum + entry.value, 0);
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
    return [`${value} (${percentage}%)`, name];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ width: "100%", height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color ?? COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{ fontSize: 11 }}
            />
            <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
