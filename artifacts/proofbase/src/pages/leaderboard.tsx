import { Nav } from "@/components/nav";
import { useGetTopBuilders, useGetTopReviewers, useGetTopProducts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";

type Tab = "builders" | "reviewers" | "products";

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return null;
  return (
    <span className="text-xs font-mono bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded-full whitespace-nowrap">
      ★ {score.toFixed(2)}
    </span>
  );
}

function StatusBadge({ tag }: { tag?: string | null }) {
  if (!tag) return null;
  const map: Record<string, string> = {
    launching: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    trending: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    needs_feedback: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    active: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  const label: Record<string, string> = { launching: "Launching", trending: "Trending", needs_feedback: "Needs Feedback", active: "Active" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${map[tag] ?? map.active} whitespace-nowrap`}>
      {label[tag] ?? tag}
    </span>
  );
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 text-lg shrink-0">🥇</span>;
  if (rank === 2) return <span className="text-slate-300 text-lg shrink-0">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 text-lg shrink-0">🥉</span>;
  return <span className="text-muted-foreground text-sm font-mono w-6 text-center shrink-0">#{rank}</span>;
}

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>("products");

  const { data: builders = [], isLoading: buildersLoading } = useGetTopBuilders({ query: { enabled: tab === "builders" } as any });
  const { data: reviewers = [], isLoading: reviewersLoading } = useGetTopReviewers({ query: { enabled: tab === "reviewers" } as any });
  const { data: products = [], isLoading: productsLoading } = useGetTopProducts({ query: { enabled: tab === "products" } as any });

  const tabs: { key: Tab; label: string }[] = [
    { key: "products", label: "Top Products" },
    { key: "builders", label: "Top Builders" },
    { key: "reviewers", label: "Top Reviewers" },
  ];

  const isLoading = (tab === "builders" && buildersLoading) || (tab === "reviewers" && reviewersLoading) || (tab === "products" && productsLoading);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0B0B0C]">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-7 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Leaderboard</h1>
            <p className="text-muted-foreground text-sm">The builders, reviewers, and products leading ProofBase.</p>
          </div>

          {/* Tab bar — horizontally scrollable on mobile */}
          <div className="flex gap-1 mb-6 md:mb-8 border-b border-border pb-3 overflow-x-auto scrollbar-none">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  tab === t.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {tab === "products" &&
                (products as any[]).map((product, i) => (
                  <motion.div key={product.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link href={`/products/${product.id}`}>
                      <Card className="border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer">
                        <CardContent className="p-3 md:p-4 flex items-center gap-3">
                          <MedalIcon rank={i + 1} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-sm truncate">{product.name}</span>
                              <StatusBadge tag={product.statusTag} />
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/20 hidden sm:inline-flex">
                                {product.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{product.tagline}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <ScoreBadge score={product.score} />
                            <span className="text-xs text-muted-foreground">{product.feedbackCount} feedback</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}

              {tab === "builders" &&
                (builders as any[]).map((builder, i) => (
                  <motion.div key={builder.userId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="border-border/50">
                      <CardContent className="p-3 md:p-4 flex items-center gap-3">
                        <MedalIcon rank={i + 1} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold font-mono text-sm truncate">
                              {builder.userId.slice(0, 10)}…
                            </span>
                            {(builder.badges as string[])?.map((b: string) => (
                              <span key={b} className="text-xs bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded-full border border-[#7C3AED]/20 whitespace-nowrap">
                                {b}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {builder.productCount} products · {builder.totalFeedback} feedback
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-bold text-primary text-sm">{builder.totalPoints} pts</div>
                          {builder.avgRating && (
                            <span className="text-xs text-yellow-500">★ {Number(builder.avgRating).toFixed(1)}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

              {tab === "reviewers" &&
                (reviewers as any[]).map((reviewer, i) => (
                  <motion.div key={reviewer.userId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="border-border/50">
                      <CardContent className="p-3 md:p-4 flex items-center gap-3">
                        <MedalIcon rank={i + 1} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold font-mono text-sm truncate">
                              {reviewer.userId.slice(0, 10)}…
                            </span>
                            {(reviewer.badges as string[])?.map((b: string) => (
                              <span key={b} className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                                {b}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{reviewer.feedbackCount} reviews given</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-bold text-primary text-sm">{reviewer.totalPoints} pts</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

              {((tab === "products" && products.length === 0) ||
                (tab === "builders" && builders.length === 0) ||
                (tab === "reviewers" && reviewers.length === 0)) && (
                <div className="text-center py-16 text-muted-foreground">Nothing here yet.</div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
