"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { RiskHeatmapData } from "@/lib/types";

interface RiskHeatmapProps {
  data: RiskHeatmapData[];
  title: string;
  height?: number;
}

const getRiskColor = (riskScore: number): string => {
  if (riskScore >= 7) return "#FF6363";
  if (riskScore >= 4) return "#FF9149";
  if (riskScore >= 2) return "#FF90BB";
  return "#80D8C3";
};

export function RiskHeatmap({ data, title, height = 350 }: RiskHeatmapProps) {
  const formatTooltip = (value: any, name: string, props: any) => {
    const payload = props.payload;
    return [
      <div key="tooltip" className="text-xs">
        <p>
          <strong>{payload?.department}</strong>
        </p>
        <p>Risk Score: {payload?.riskScore}</p>
        <p>Violations: {payload?.violationCount}</p>
        <p>Employees: {payload?.employeeCount}</p>
      </div>,
    ];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ width: "100%", height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="department"
              tickLine={false}
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
              label={{
                value: "Department",
                position: "insideBottom",
                offset: -15,
                style: { textAnchor: "middle", fontSize: 11 },
              }}
            />
            <YAxis
              tickLine={false}
              tick={{ fontSize: 10 }}
              label={{
                value: "Risk Score",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fontSize: 11 },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      {formatTooltip(null, "", payload[0])}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="riskScore" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getRiskColor(entry.riskScore)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
