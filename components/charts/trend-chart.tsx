"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendData } from "@/lib/types";

interface TrendChartProps {
  data: TrendData[];
  title: string;
  dataKey?: string;
  color?: string;
  height?: number;
}

export function TrendChart({
  data,
  title,
  dataKey = "value",
  color = "#60B5FF",
  height = 300,
}: TrendChartProps) {
  const formatTooltip = (value: any, name: string) => {
    if (name === "value") {
      return [value, title];
    }
    return [value, name];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ width: "100%", height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              label={{
                value: "Date",
                position: "insideBottom",
                offset: -15,
                style: { textAnchor: "middle", fontSize: 11 },
              }}
            />
            <YAxis
              tickLine={false}
              tick={{ fontSize: 10 }}
              label={{
                value: "Count",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fontSize: 11 },
              }}
            />
            <Tooltip
              formatter={formatTooltip}
              labelStyle={{ fontSize: 11 }}
              contentStyle={{ fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
