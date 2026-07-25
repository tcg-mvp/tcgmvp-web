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

const rangeOptions: RangeOption[] = [
  "1M",
  "3M",
  "6M",
  "1Y",
  "ALL",
];

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function PriceChart({ data }: PriceChartProps) {
  const [selectedRange, setSelectedRange] =
    useState<RangeOption>("1Y");

  const filteredData = useMemo(() => {
    const validData = data
      .map((item) => ({
        price: Number(item.price),
        recorded_at: item.recorded_at,
      }))
      .filter(
        (item) =>
          Number.isFinite(item.price) &&
          !Number.isNaN(
            new Date(item.recorded_at).getTime()
          )
      )
      .sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() -
          new Date(b.recorded_at).getTime()
      );

    if (
      validData.length === 0 ||
      selectedRange === "ALL"
    ) {
      return validData;
    }

    const latestDate = new Date(
      validData[validData.length - 1].recorded_at
    );

    const cutoffDate = new Date(latestDate);

    switch (selectedRange) {
      case "1M":
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case "3M":
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
      case "6M":
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        break;
      case "1Y":
        cutoffDate.setFullYear(
          cutoffDate.getFullYear() - 1
        );
        break;
    }

    return validData.filter(
      (item) =>
        new Date(item.recorded_at).getTime() >=
        cutoffDate.getTime()
    );
  }, [data, selectedRange]);

  const chartData = useMemo(
    () =>
      filteredData.map((item) => {
        const date = new Date(item.recorded_at);

        return {
          price: item.price,
          timestamp: date.getTime(),
          shortDate: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          fullDate: date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        };
      }),
    [filteredData]
  );

  const periodSummary = useMemo(() => {
    if (filteredData.length === 0) {
      return null;
    }

    const firstPrice = filteredData[0].price;
    const currentPrice =
      filteredData[filteredData.length - 1].price;

    const dollarChange = currentPrice - firstPrice;

    const percentageChange =
      firstPrice > 0
        ? (dollarChange / firstPrice) * 100
        : null;

    return {
      currentPrice,
      dollarChange,
      percentageChange,
    };
  }, [filteredData]);

  const yAxisDomain = useMemo<[number, number] | undefined>(
    () => {
      if (filteredData.length === 0) {
        return undefined;
      }

      const prices = filteredData.map(
        (item) => item.price
      );

      const minimumPrice = Math.min(...prices);
      const maximumPrice = Math.max(...prices);

      if (minimumPrice === maximumPrice) {
        const padding = Math.max(
          minimumPrice * 0.05,
          10
        );

        return [
          Math.max(0, minimumPrice - padding),
          maximumPrice + padding,
        ];
      }

      const padding =
        (maximumPrice - minimumPrice) * 0.12;

      return [
        Math.max(0, minimumPrice - padding),
        maximumPrice + padding,
      ];
    },
    [filteredData]
  );

  if (chartData.length === 0) {
    return (
      <div className="price-chart-empty">
        Historical pricing is not available for this
        period yet.
      </div>
    );
  }

  const movementIsNegative =
    periodSummary !== null &&
    periodSummary.dollarChange < 0;

  return (
    <div className="price-chart-wrapper">
      <div className="price-chart-header">
        <div className="price-chart-summary">
          <span>Current market price</span>

          <strong>
            {periodSummary
              ? formatCurrency(
                  periodSummary.currentPrice
                )
              : "N/A"}
          </strong>

          {periodSummary &&
            periodSummary.percentageChange !== null && (
              <small
                className={
                  movementIsNegative
                    ? "negative"
                    : "positive"
                }
              >
                {periodSummary.dollarChange >= 0
                  ? "+"
                  : ""}
                {formatCurrency(
                  periodSummary.dollarChange
                )}{" "}
                (
                {periodSummary.percentageChange >= 0
                  ? "+"
                  : ""}
                {periodSummary.percentageChange.toFixed(
                  2
                )}
                %) over {selectedRange}
              </small>
            )}
        </div>

        <div
          className="price-chart-ranges"
          aria-label="Price history timeframe"
        >
          {rangeOptions.map((range) => (
            <button
              key={range}
              type="button"
              className={
                selectedRange === range
                  ? "price-chart-range active"
                  : "price-chart-range"
              }
              aria-pressed={
                selectedRange === range
              }
              onClick={() =>
                setSelectedRange(range)
              }
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 1 && (
        <p className="price-chart-limited-data">
          Only one historical price is available for
          this timeframe.
        </p>
      )}

      <div className="price-chart-container">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 24,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid
              stroke="rgba(148, 163, 184, 0.10)"
              vertical={false}
            />

      <XAxis
        dataKey="timestamp"
        type="number"
        scale="time"
        domain={["dataMin", "dataMax"]}
        tickFormatter={(value) =>
          new Date(
            Number(value)
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        }
        tick={{
          fill: "#64748b",
          fontSize: 12,
        }}
        axisLine={false}
        tickLine={false}
        minTickGap={32}
        padding={{
          left: 18,
          right: 18,
        }}
      />

            <YAxis
              domain={yAxisDomain}
              tick={{
                fill: "#64748b",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
              width={90}
              tickFormatter={(value) =>
                `$${Number(value).toLocaleString(
                  "en-US",
                  {
                    maximumFractionDigits: 0,
                  }
                )}`
              }
            />

            <Tooltip
              labelFormatter={(value) =>
                new Date(
                  Number(value)
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              }
              formatter={(value) => [
                formatCurrency(Number(value)),
                "Market price",
              ]}
              contentStyle={{
                background: "#0b1628",
                border:
                  "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: "12px",
                color: "#f8fafc",
              }}
              labelStyle={{
                color: "#94a3b8",
                marginBottom: "6px",
              }}
            />

            <Line
              type="monotone"
              dataKey="price"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={
                chartData.length === 1
                  ? {
                      r: 5,
                      fill: "#38bdf8",
                      strokeWidth: 0,
                    }
                  : false
              }
              activeDot={{
                r: 5,
                fill: "#38bdf8",
                stroke: "#e0f2fe",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}