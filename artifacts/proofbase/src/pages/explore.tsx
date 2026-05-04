import { Nav } from "@/components/nav";
import { useListProducts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { motion } from "framer-motion";

type SortKey = "score" | "newest" | "top_rated" | "trending";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  launching: { label: "Launching", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  trending: { label: "Trending", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  needs_feedback: { label: "Needs Feedback", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  active: { label: "Active", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

function StatusTag({ tag }: { tag?: string | null }) {
  if (!tag) return null;
  const cfg = STATUS_CONFIG[tag] ?? STATUS_CONFIG.active;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export default function Explore() {
  const [sort, setSort] = useState<SortKey>("score");
  const { data: products = [], isLoading } = useListProducts({ sort } as any);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "score", label: "Smart Rank" },
    { key: "trending", label: "Trending" },
    { key: "top_rated", label: "Top Rated" },
    { key: "newest", label: "Newest" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0B0B0C]">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Explore Products</h1>
            <p className="text-muted-foreground">Discover and review tools built by ambitious founders.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {sortOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sort === key
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground border border-border hover:border-border/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-muted/50 rounded-t-xl" />
                <CardContent className="h-24 bg-card" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/products/${product.id}`}>
                  <Card className="hover:scale-[1.02] transition-all duration-200 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] cursor-pointer h-full flex flex-col border-border/60 hover:border-primary/30">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 shrink-0 text-xs">
                          {product.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <StatusTag tag={(product as any).statusTag} />
                        {(product as any).city && (
                          <span className="text-xs text-muted-foreground">📍 {(product as any).city}</span>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2 mt-2">{product.tagline}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{product.feedbackCount} feedback</span>
                        <div className="flex items-center gap-3">
                          {(product as any).score != null && (
                            <span className="text-xs font-mono text-[#7C3AED]">
                              ★ {Number((product as any).score).toFixed(2)}
                            </span>
                          )}
                          {product.avgRating && (
                            <span className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span> {product.avgRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}

            {products.length === 0 && (
              <div className="col-span-full text-center py-24 text-muted-foreground">
                No products found.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
