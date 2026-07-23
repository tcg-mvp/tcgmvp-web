import Link from "next/link";

type ProductCardProps = {
  name: string;
  slug: string;
  productType: string;
  language: string;
  series: string;
  marketPrice: number | null;
  change30d: number | null;
};

export default function ProductCard({
  name,
  slug,
  productType,
  language,
  series,
  marketPrice,
  change30d,
}: ProductCardProps) {
  const formattedPrice =
    marketPrice === null
      ? "No price available"
      : marketPrice.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });

  const formattedChange =
    change30d === null
      ? "No 30-day data"
      : `${change30d >= 0 ? "+" : ""}${change30d.toFixed(2)}%`;

  return (
    <Link
      href={`/products/${slug}`}
      className="group block rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
    >
      <div className="mb-6 flex aspect-[4/3] items-center justify-center rounded-xl bg-white/5">
        <span className="text-5xl">📦</span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-white/50">
            {productType} · {language}
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            {name}
          </h2>

          <p className="mt-1 text-sm text-white/50">{series}</p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/40">
              Market price
            </p>

            <p className="text-2xl font-bold text-white">
              {formattedPrice}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-white/40">
              30 days
            </p>

            <p
              className={
                change30d !== null && change30d < 0
                  ? "font-semibold text-red-400"
                  : "font-semibold text-emerald-400"
              }
            >
              {formattedChange}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}