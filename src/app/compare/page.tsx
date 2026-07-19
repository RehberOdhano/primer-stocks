import { CompareView } from "@/components/CompareView";
import { getStockListing } from "@/lib/queries/stocks";
import { getTermsByKey } from "@/lib/queries/terms";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ symbols?: string }>;
}) {
  const [stocks, terms, params] = await Promise.all([
    getStockListing(),
    getTermsByKey(),
    searchParams,
  ]);

  const initialSymbols = params.symbols?.split(",").filter(Boolean) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Compare</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Put stocks side by side to see how their fundamentals stack up.
        </p>
      </header>
      <CompareView
        stocks={stocks}
        terms={Object.fromEntries(terms)}
        initialSymbols={initialSymbols}
      />
    </main>
  );
}
