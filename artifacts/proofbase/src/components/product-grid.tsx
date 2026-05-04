import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@workspace/api-client-react";

type SortMode = "trending" | "new" | "active";

interface ProductGridProps {
  products: Product[];
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
  filterCity?: string | null;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  launching: { label: "Launching", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  trending: { label: "Trending 🔥", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  needs_feedback: { label: "Needs Feedback", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  active: { label: "Active", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

function StatusBadge({ tag }: { tag?: string | null }) {
  if (!tag) return null;
  const cfg = STATUS_CFG[tag] ?? STATUS_CFG.active;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export function ProductGrid({ products, sort, onSortChange, filterCity }: ProductGridProps) {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              {filterCity ? `Startups in ${filterCity}` : "Discover Startups"}
            </h2>
            <p className="text-xs text-white/40 mt-1">{products.length} products found</p>
          </div>

          {/* Sort pills */}
          <div className="flex gap-2">
            {(["trending", "new", "active"] as SortMode[]).map((s) => (
              <button
                key={s}
                onClick={() => onSortChange(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  sort === s
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-[#111111] border-[#1A1A1A] text-white/40 hover:text-white"
                }`}
              >
                {s === "trending" ? "🔥 Trending" : s === "new" ? "✨ New" : "⚡ Most Active"}
              </button>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/30">
            <span className="text-4xl mb-3">🔭</span>
            <p className="text-sm">No startups found in this category yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: Math.min(i, 5) * 0.06, duration: 0.4 }}
              >
                <Link href={`/products/${product.id}`}>
                  <Card className="h-full bg-[#111111] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(124,58,237,0.12)] transition-all duration-300 cursor-pointer border-[#1A1A1A] hover:border-purple-500/30">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-base font-bold line-clamp-1 text-white">{product.name}</h3>
                        {product.category && (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 shrink-0 text-xs">
                            {product.category}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 mb-3 flex-wrap items-center">
                        <StatusBadge tag={(product as any).statusTag} />
                        {(product as any).city && (
                          <span className="text-xs text-white/30">📍 {(product as any).city}</span>
                        )}
                      </div>

                      <p className="text-white/50 text-sm line-clamp-2 mb-4 leading-relaxed">
                        {product.tagline}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1A1A1A]">
                        <span className="text-white/30">{product.feedbackCount ?? 0} feedback</span>
                        {product.avgRating ? (
                          <span className="text-yellow-500">★ {product.avgRating.toFixed(1)}</span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
