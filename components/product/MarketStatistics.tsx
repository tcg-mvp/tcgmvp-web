import type {
  MarketStatisticsResult,
} from "@/lib/analytics/marketStatistics";


type MarketStatisticsProps = {
  statistics: MarketStatisticsResult;
};


function formatCurrency(
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    },
  ).format(
    value,
  );
}


function formatPercentage(
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  const sign =
    value > 0
      ? "+"
      : "";

  return `${sign}${value.toFixed(
    1,
  )}%`;
}


function getChangeClass(
  value: number | null,
): string {
  if (
    value === null ||
    value === 0
  ) {
    return "market-stat-neutral";
  }

  return value > 0
    ? "market-stat-positive"
    : "market-stat-negative";
}


export default function MarketStatistics({
  statistics,
}: MarketStatisticsProps) {
  const statisticsItems = [
    {
      label:
        "Current Price",

      value:
        formatCurrency(
          statistics.currentPrice,
        ),

      className:
        "market-stat-primary",
    },

    {
      label:
        "30D Change",

      value:
        formatPercentage(
          statistics.change30d,
        ),

      className:
        getChangeClass(
          statistics.change30d,
        ),
    },

    {
      label:
        "52-Week High",

      value:
        formatCurrency(
          statistics.high52Week,
        ),
    },

    {
      label:
        "52-Week Low",

      value:
        formatCurrency(
          statistics.low52Week,
        ),
    },

    {
      label:
        "All-Time High",

      value:
        formatCurrency(
          statistics.allTimeHigh,
        ),
    },

    {
      label:
        "Average Verified Sale",

      value:
        formatCurrency(
          statistics.averageSale,
        ),
    },

    {
      label:
        "Latest Verified Sale",

      value:
        formatCurrency(
          statistics.latestSale,
        ),
    },

    {
      label:
        "Verified Sales Tracked",

      value:
        statistics.salesTracked.toLocaleString(
          "en-US",
        ),
    },
  ];


  return (
    <section className="market-statistics">
      <div className="market-statistics-heading">
        <div>
          <p className="market-statistics-eyebrow">
            Market Overview
          </p>

          <h2>
            Market Statistics
          </h2>

          <p className="market-statistics-description">
            Objective pricing, historical range,
            and verified sales statistics used to
            support TCGMVP market intelligence.
          </p>
        </div>
      </div>


      <div className="market-statistics-grid">
        {statisticsItems.map(
          (item) => (
            <div
              className="market-stat-card"
              key={
                item.label
              }
            >
              <span className="market-stat-label">
                {item.label}
              </span>

              <strong
                className={`market-stat-value ${
                  item.className ??
                  ""
                }`}
              >
                {item.value}
              </strong>
            </div>
          ),
        )}
      </div>
    </section>
  );
}