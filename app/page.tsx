export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">
          Trading Card Market Intelligence
        </p>

        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
          TCGMVP
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
          Historical pricing, market trends, liquidity insights, and deal
          analysis for trading card collectors.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="mailto:tcgmvpplaceholder@gmail.com?subject=TCGMVP Beta Interest"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Join the Beta
          </a>

          <span className="text-sm text-slate-400">Coming soon</span>
        </div>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold">Historical Pricing</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Review trusted sales history and long-term pricing trends.
            </p>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold">Deal Analysis</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Evaluate listings against market value before purchasing.
            </p>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold">Market Insights</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Understand liquidity, momentum, and confidence in the market.
            </p>
          </section>
        </div>

        <footer className="mt-16 text-sm text-slate-500">
          © 2026 TCGMVP
        </footer>
      </div>
    </main>
  );
}