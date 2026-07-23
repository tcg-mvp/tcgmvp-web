"use client";

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

export default function PriceChart({ data }: PriceChartProps) {
  const formattedData = data.map((item) => ({
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