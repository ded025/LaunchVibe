import { Nav } from "@/components/nav";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useGetDashboard,
  useGetDashboardProducts,
  useGetMyPoints,
  useDailyCheckin,
  getGetDashboardQueryKey,
  getGetDashboardProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  launching: { label: "Launching", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  trending: { label: "Trending", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  needs_feedback: { label: "Needs Feedback", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  active: { label: "Active", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

function StatusTag({ tag }: { tag?: string | null }) {
  if (!tag) return null;
  const cfg = STATUS_CONFIG[tag] ?? STATUS_CONFIG.active;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value} feedback</p>
    </div>
  );
};

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();
  const { data: dashboard, isLoading } = useGetDashboard({ query: { enabled: isSignedIn === true } as any });
  const { data: products = [], isLoading: productsLoading } = useGetDashboardProducts({ query: { enabled: isSignedIn === true } as any });
  const { data: myPoints } = useGetMyPoints({ query: { enabled: isSignedIn === true } as any });
  const checkin = useDailyCheckin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["gamification"] });
      },
    },
  });

  const skeleton = (
    <div className="min-h-[100dvh] flex flex-col">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 bg-muted rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
          </div>
        </div>
      </main>
    </div>
  );

  if (!isLoaded) return skeleton;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (isLoading || productsLoading) return skeleton;

  const feedbackOverTime = (dashboard as any)?.feedbackOverTime ?? [];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0B0B0C]">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6 md:mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <Button asChild size="sm" className="bg-primary text-primary-foreground shrink-0">
              <Link href="/dashboard/submit">+ New Product</Link>
            </Button>
          </div>

          {/* Gamification bar */}
          {myPoints && (
            <div className="mb-6 md:mb-8 p-4 rounded-xl border border-[#1A1A1A] bg-card/50">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="font-bold text-lg text-primary leading-tight">{myPoints.points} pts</div>
                    <div className="text-xs text-muted-foreground">Your points</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <div>
                    <div className="font-bold leading-tight">{myPoints.streak ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Day streak</div>
                  </div>
                </div>
                {(myPoints.badges as string[])?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {(myPoints.badges as string[]).map((b) => (
                      <span key={b} className="text-xs bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-1 rounded-full border border-[#7C3AED]/20">
                        🏅 {b}
                      </span>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs ml-auto"
                  disabled={checkin.isPending}
                  onClick={() => checkin.mutate()}
                >
                  {checkin.isPending ? "Checking in…" : "Check-in +2pts"}
                </Button>
              </div>
            </div>
          )}

          {(!products || products.length === 0) ? (
            <div className="text-center py-20 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground mb-4 text-sm">You haven't listed any products yet.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/submit">List your first product</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Stats — 2 cols on mobile, 4 on desktop */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-1 pt-4 px-4 md:px-6 md:pb-2 md:pt-6">
                    <CardTitle className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Products</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 md:px-6">
                    <div className="text-2xl md:text-3xl font-bold">{dashboard?.totalProducts ?? 0}</div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-1 pt-4 px-4 md:px-6 md:pb-2 md:pt-6">
                    <CardTitle className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 md:px-6">
                    <div className="text-2xl md:text-3xl font-bold">{dashboard?.totalFeedback ?? 0}</div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-1 pt-4 px-4 md:px-6 md:pb-2 md:pt-6">
                    <CardTitle className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Rating</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 md:px-6">
                    <div className="text-2xl md:text-3xl font-bold">
                      {dashboard?.avgRating?.toFixed(1) ?? "—"}
                      <span className="text-base text-yellow-500 ml-1">★</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-1 pt-4 px-4 md:px-6 md:pb-2 md:pt-6">
                    <CardTitle className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Would Pay</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 md:px-6">
                    <div className="text-2xl md:text-3xl font-bold">
                      {products.length > 0 && (products as any[]).some((p) => p.wouldPayRatio != null)
                        ? `${Math.round(((products as any[]).reduce((acc, p) => acc + (p.wouldPayRatio ?? 0), 0) / products.filter((p: any) => p.wouldPayRatio != null).length) * 100)}%`
                        : "—"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Feedback over time chart */}
              {feedbackOverTime.length > 0 && (
                <div className="mb-6 md:mb-8 p-4 md:p-6 rounded-xl border border-border bg-card/50">
                  <h2 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Feedback Over Time (30 days)</h2>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={feedbackOverTime} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                      <defs>
                        <linearGradient id="feedbackGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={2} fill="url(#feedbackGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Products list */}
              <div className="space-y-3">
                <h2 className="text-lg md:text-xl font-bold tracking-tight">Your Products</h2>
                <div className="grid gap-3">
                  {(products as any[]).map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`}>
                      <Card className="hover:bg-accent/40 transition-colors cursor-pointer border-border/60 hover:border-primary/30">
                        <CardContent className="p-4 md:p-5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-sm md:text-base truncate">{product.name}</h3>
                              <StatusTag tag={product.statusTag} />
                              {product.city && (
                                <span className="text-xs text-muted-foreground hidden sm:inline">📍 {product.city}</span>
                              )}
                            </div>
                            <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                              <span>{product.feedbackCount} feedback</span>
                              {product.avgRating && <span>★ {product.avgRating.toFixed(1)}</span>}
                              {product.wouldPayRatio != null && (
                                <span>{Math.round(product.wouldPayRatio * 100)}% pay</span>
                              )}
                              {product.score != null && (
                                <span className="text-[#7C3AED] font-mono">score {Number(product.score).toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-xs">{product.category}</Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
