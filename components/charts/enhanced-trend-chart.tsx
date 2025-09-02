"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";

interface EnhancedTrendChartProps {
  title: string;
  dataKey?: string;
  color?: string;
  height?: number;
  metric?: string;
  onRangeChange?: (days: number) => void;
}

const TIME_PERIODS = [
  { label: "30 Days", value: 30 },
  { label: "60 Days", value: 60 },
  { label: "180 Days", value: 180 },
];

export function EnhancedTrendChart({
  title,
  dataKey = "value",
  color = "#60B5FF",
  height = 300,
  metric = "violations",
  onRangeChange,
}: EnhancedTrendChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, metric]);

  useEffect(() => {
    onRangeChange?.(selectedPeriod);
  }, [selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/trends?days=${selectedPeriod}&metric=${metric}`,
      );
      const result = await response.json();
      setData(result.trendData || []);
    } catch (error) {
      console.error("Failed to fetch trend data:", error);
      setData([]);
    }
    setLoading(false);
  };

  const formatTooltip = (value: any, name: string) => {
    if (name === "value") {
      return [value, title];
    }
    return [value, name];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex space-x-1">
          {TIME_PERIODS.map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: height }}>
        {loading ? (
          <div className="flex justify-center items-center" style={{ height }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
