import { useState, useMemo, lazy, Suspense } from "react";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useGetMapProducts,
  useListProducts,
  useGetTrendingProducts,
} from "@workspace/api-client-react";
import { VibeTicker } from "@/components/vibe-ticker";
import { CategoryBar } from "@/components/category-bar";
import { ProductGrid } from "@/components/product-grid";
import { CityGrouping } from "@/components/city-grouping";
import type { Product } from "@workspace/api-client-react";

const WorldMap = lazy(() =>
  import("@/components/world-map").then((m) => ({ default: m.WorldMap }))
);

type SortMode = "trending" | "new" | "active";

const CATEGORY_MAP: Record<string, string[]> = {
  "AI": ["AI", "AI/ML", "Machine Learning", "Artificial Intelligence"],
  "SaaS": ["SaaS", "B2B", "Software"],
  "Crypto": ["Crypto", "Web3", "Blockchain", "DeFi"],
  "Dev Tools": ["Dev Tools", "Developer Tools", "DevTools", "Open Source"],
  "Finance": ["Finance", "FinTech", "Fintech", "Banking"],
  "Health": ["Health", "HealthTech", "Wellness", "MedTech"],
  "Others": [],
};

function matchCategory(productCategory: string | null | undefined, filter: string): boolean {
  if (filter === "All") return true;
  if (!productCategory) return filter === "Others";
  const variants = CATEGORY_MAP[filter];
  if (!variants) return false;
  if (variants.length === 0) {
    // "Others" — doesn't match any known category
    const allKnown = Object.values(CATEGORY_MAP).flat();
    return !allKnown.some((v) =>
      productCategory.toLowerCase().includes(v.toLowerCase())
    );
  }
  return variants.some((v) =>
    productCategory.toLowerCase().includes(v.toLowerCase())
  );
}

function sortProducts(products: Product[], mode: SortMode): Product[] {
  const arr = [...products];
  if (mode === "trending") {
    return arr.sort((a, b) => {
      const sa = (a as any).score ?? 0;
      const sb = (b as any).score ?? 0;
      return sb - sa;
    });
  }
  if (mode === "new") {
    return arr.sort((a, b) => {
      const da = new Date((a as any).createdAt ?? 0).getTime();
      const db = new Date((b as any).createdAt ?? 0).getTime();
      return db - da;
    });
  }
  if (mode === "active") {
    return arr.sort(
      (a, b) => (b.feedbackCount ?? 0) - (a.feedbackCount ?? 0)
    );
  }
  return arr;
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("trending");
  const [filterCity, setFilterCity] = useState<string | null>(null);

  const { data: mapProducts = [] } = useGetMapProducts();
  const { data: allProducts = [] } = useListProducts();
  const { data: trendingProducts = [] } = useGetTrendingProducts();

  const cityGroups = useMemo(() => {
    const map: Record<string, number> = {};
    (mapProducts as any[]).forEach((p) => {
      if (p.city) map[p.city] = (map[p.city] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) as [string, number][];
  }, [mapProducts]);

  const tickerItems = useMemo(() => {
    const source = trendingProducts.length ? trendingProducts : allProducts;
    return source.slice(0, 20).map((p) => ({
      id: p.id,
      name: p.name,
      city: (p as any).city,
      category: p.category,
      statusTag: (p as any).statusTag,
    }));
  }, [trendingProducts, allProducts]);

  const filteredProducts = useMemo(() => {
    let list = allProducts as Product[];
    if (activeCategory !== "All") {
      list = list.filter((p) => matchCategory(p.category, activeCategory));
    }
    if (filterCity) {
      list = list.filter((p) => (p as any).city === filterCity);
    }
    return sortProducts(list, sortMode);
  }, [allProducts, activeCategory, sortMode, filterCity]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0B0B0C]">
      <Nav />

      <main className="flex-1">
        {/* HERO: Full-width World Map */}
        <section className="relative w-full border-b border-[#1A1A1A] overflow-hidden">
          <Suspense
            fallback={
              <div
                className="w-full bg-[#0D0D0F] flex items-center justify-center"
                style={{ height: 420 }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3 animate-pulse">🌍</div>
                  <p className="text-white/30 text-sm">Loading map…</p>
                </div>
              </div>
            }
          >
            <WorldMap products={mapProducts as any} />
          </Suspense>
        </section>

        {/* VIBE TICKER */}
        <VibeTicker items={tickerItems} />

        {/* CATEGORY BAR */}
        <CategoryBar active={activeCategory} onChange={(cat) => { setActiveCategory(cat); setFilterCity(null); }} />

        {/* PRODUCT GRID */}
        <div className="bg-[#0B0B0C]">
          <ProductGrid
            products={filteredProducts}
            sort={sortMode}
            onSortChange={setSortMode}
            filterCity={filterCity}
          />
        </div>

        {/* CITY GROUPING */}
        <CityGrouping
          cityGroups={cityGroups}
          activeCity={filterCity}
          onCityClick={(city) => {
            setFilterCity(city);
            setActiveCategory("All");
            // scroll to product grid
            document.getElementById("product-grid-anchor")?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* CTA STRIP */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="py-20 md:py-28 bg-gradient-to-t from-[#111111] to-[#0B0B0C] border-t border-[#1A1A1A]"
        >
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 tracking-tight">
              Building something?
            </h2>
            <p className="text-white/40 text-sm md:text-base mb-8">
              Add your startup to the map and get discovered by builders worldwide.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 text-base bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-[0_0_24px_rgba(124,58,237,0.3)] hover:shadow-[0_0_36px_rgba(124,58,237,0.5)] transition-all w-full sm:w-auto"
              >
                <Link href="/sign-up">List Your Startup</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base border-[#1A1A1A] hover:bg-[#111111] w-full sm:w-auto"
              >
                <Link href="/leaderboard">View Leaderboard</Link>
              </Button>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-[#1A1A1A] bg-[#0B0B0C] py-8 text-center text-white/20 text-sm">
        <p>© {new Date().getFullYear()} LaunchVibe · Built for founders, by founders.</p>
      </footer>
    </div>
  );
}
