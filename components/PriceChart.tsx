"use client";
import { useMemo, useState } from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PriceHistoryItem = {
  price: number;
  recorded_at: string;
};

type PriceChartProps = {
  data: PriceHistoryItem[];
};
type RangeOption = "1M" | "3M" | "6M" | "1Y" | "ALL";

export default function PriceChart({ data }: PriceChartProps) {
  const [selectedRange, setSelectedRange] =
    useState<RangeOption>("1Y");
  const filteredData = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    const sortedData = [...data].sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() -
        new Date(b.recorded_at).getTime()
    );

    if (selectedRange === "ALL") {
      return sortedData;
    }

    const latestDate = new Date(
      sortedData[sortedData.length - 1].recorded_at
    );

    const cutoffDate = new Date(latestDate);

    if (selectedRange === "1M") {
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    }

    if (selectedRange === "3M") {
      cutoffDate.setMonth(cutoffDate.getMonth() - 3);
    }

    if (selectedRange === "6M") {
      cutoffDate.setMonth(cutoffDate.getMonth() - 6);
    }

    if (selectedRange === "1Y") {
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    }

    return sortedData.filter(
      (item) => new Date(item.recorded_at) >= cutoffDate
    );
  }, [data, selectedRange]);

  const formattedData = filteredData.map((item) => ({
    price: Number(item.price),
    date: new Date(item.recorded_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  if (formattedData.length === 0) {
    return (
      <div className="price-chart-empty">
        Historical pricing is not available yet.
      </div>
    );
  }

  return (
    <div className="price-chart-wrapper">
      <div className="price-chart-ranges">
            {(["1M", "3M", "6M", "1Y", "ALL"] as RangeOption[]).map(
              (range) => (
                <button
                  key={range}
                  type="button"
                  className={
                    selectedRange === range
                      ? "price-chart-range active"
                      : "price-chart-range"
                  }
                  onClick={() => setSelectedRange(range)}
                >
                  {range}
                </button>
              )
            )}
          </div>

      <ResponsiveContainer width="100%" height={360}>
        <LineChart
          data={formattedData}
          margin={{
            top: 20,
            right: 20,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            stroke="rgba(148, 163, 184, 0.10)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={{
              fill: "#64748b",
              fontSize: 12,
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{
              fill: "#64748b",
              fontSize: 12,
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              `$${Number(value).toLocaleString("en-US")}`
            }
          />

          <Tooltip
            formatter={(value) => [
              `$${Number(value).toLocaleString("en-US")}`,
              "Market price",
            ]}
            contentStyle={{
              background: "#0b1628",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              borderRadius: "12px",
              color: "#f8fafc",
            }}
          />

          <Line
            type="monotone"
            dataKey="price"
            stroke="#38bdf8"
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 5,
              fill: "#38bdf8",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}