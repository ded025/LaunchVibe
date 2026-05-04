import { Nav } from "@/components/nav";
import { useParams } from "wouter";
import {
  useGetProduct,
  useGetProductFeedback,
  useGetProductStats,
  useSubmitFeedback,
  useSummarizeProductFeedback,
  getGetProductFeedbackQueryKey,
  getGetProductStatsQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Show, useUser } from "@clerk/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  launching: { label: "🚀 Launching", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  trending: { label: "🔥 Trending", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  needs_feedback: { label: "💬 Needs Feedback", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  active: { label: "✅ Active", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    liked: "", confused: "", missing: "", rating: 5, wouldPay: true,
  });

  const { data: product, isLoading: productLoading } = useGetProduct(id, { query: { enabled: !!id } as any });
  const { data: feedback = [], isLoading: feedbackLoading } = useGetProductFeedback(id, { query: { enabled: !!id } as any });
  const { data: stats } = useGetProductStats(id, { query: { enabled: !!id } as any });

  const submitFeedback = useSubmitFeedback({
    mutation: {
      onSuccess: () => {
        setIsFeedbackOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetProductFeedbackQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey(id) });
        setFeedbackForm({ liked: "", confused: "", missing: "", rating: 5, wouldPay: true });
      },
    },
  });

  const summarize = useSummarizeProductFeedback();

  if (productLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0B0B0C]">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0B0B0C]">
        <Nav />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Product not found.</div>
      </div>
    );
  }

  const isFounder = user?.id === product.founderClerkId;
  const p = product as any;

  const statusCfg = p.statusTag ? STATUS_CONFIG[p.statusTag] : null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0B0B0C]">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <header className="mb-12 border-b border-border pb-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">{product.category}</Badge>
                  {statusCfg && (
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusCfg.cls}`}>
                      {statusCfg.label}
                    </span>
                  )}
                </div>

                <p className="text-xl text-muted-foreground max-w-2xl mb-3">{product.tagline}</p>

                {/* Location + score row */}
                <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                  {p.city && (
                    <span className="flex items-center gap-1">
                      📍 {p.city}{p.country ? `, ${p.country}` : ""}
                    </span>
                  )}
                  {p.score != null && (
                    <span className="font-mono text-[#7C3AED] text-xs bg-[#7C3AED]/10 px-2 py-0.5 rounded-full">
                      Smart Score: {Number(p.score).toFixed(3)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 shrink-0">
                {product.websiteUrl && (
                  <Button variant="outline" asChild>
                    <a href={product.websiteUrl} target="_blank" rel="noreferrer">Visit Website</a>
                  </Button>
                )}

                <Show when="signed-in">
                  <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Give Feedback</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-card border-border">
                      <DialogHeader>
                        <DialogTitle>Feedback for {product.name}</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>What did you like?</Label>
                          <Textarea
                            value={feedbackForm.liked}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, liked: e.target.value })}
                            placeholder="What stood out to you..."
                            className="bg-background"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>What confused you?</Label>
                          <Textarea
                            value={feedbackForm.confused}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, confused: e.target.value })}
                            placeholder="What wasn't clear..."
                            className="bg-background"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>What is missing?</Label>
                          <Textarea
                            value={feedbackForm.missing}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, missing: e.target.value })}
                            placeholder="What features do you wish it had..."
                            className="bg-background"
                          />
                        </div>
                        <div className="grid gap-2 pt-2">
                          <Label>Rating ({feedbackForm.rating}/5)</Label>
                          <Slider
                            value={[feedbackForm.rating]}
                            max={5} min={1} step={1}
                            onValueChange={([val]) => setFeedbackForm({ ...feedbackForm, rating: val })}
                          />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <Label>Would you pay for this?</Label>
                          <Switch
                            checked={feedbackForm.wouldPay}
                            onCheckedChange={(checked) => setFeedbackForm({ ...feedbackForm, wouldPay: checked })}
                          />
                        </div>
                        <Button
                          onClick={() => submitFeedback.mutate({ id, data: feedbackForm })}
                          disabled={submitFeedback.isPending || !feedbackForm.liked}
                          className="mt-4"
                        >
                          {submitFeedback.isPending ? "Submitting…" : "Submit Feedback (+5 pts)"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </Show>
              </div>
            </div>

            <div className="mt-8 text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {product.description}
            </div>
          </header>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.avgRating?.toFixed(1) ?? "—"} <span className="text-lg text-yellow-500">★</span></div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalFeedback ?? 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Would Pay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.wouldPayRatio != null ? `${Math.round(stats.wouldPayRatio * 100)}%` : "—"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights (founder only) */}
          {isFounder && (
            <div className="mb-12 p-6 border border-primary/30 rounded-xl bg-primary/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1">AI Insights</h3>
                  <p className="text-sm text-muted-foreground">Synthesize all feedback into actionable insights.</p>
                </div>
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => summarize.mutate({ id })}
                  disabled={summarize.isPending}
                >
                  {summarize.isPending ? "Analyzing…" : "Generate Summary"}
                </Button>
              </div>

              {summarize.data && (
                <>
                  {summarize.data.overallSentiment && (
                    <div className="mb-4 text-sm">
                      Overall sentiment:{" "}
                      <span className="font-medium text-primary capitalize">{summarize.data.overallSentiment}</span>
                    </div>
                  )}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-400 mb-2">Strengths</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                        {summarize.data.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-2">Weaknesses</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                        {summarize.data.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-400 mb-2">Suggestions</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                        {summarize.data.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Feedback list */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Recent Feedback
              {!feedbackLoading && feedback.length > 0 && (
                <span className="text-base font-normal text-muted-foreground ml-2">({feedback.length})</span>
              )}
            </h2>
            <div className="space-y-6">
              {feedback.length === 0 ? (
                <p className="text-muted-foreground">No feedback yet. Be the first!</p>
              ) : (
                feedback.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="border-border/50 shadow-none">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex text-yellow-500">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <span key={j} className={j < item.rating ? "opacity-100" : "opacity-20"}>★</span>
                            ))}
                          </div>
                          <Badge
                            variant="outline"
                            className={item.wouldPay ? "text-green-400 border-green-400/20" : "text-muted-foreground"}
                          >
                            {item.wouldPay ? "Would pay" : "Wouldn't pay"}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="text-sm font-semibold text-green-400 mb-2">Loved</h4>
                            <p className="text-sm text-muted-foreground">{item.liked}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-yellow-400 mb-2">Confused</h4>
                            <p className="text-sm text-muted-foreground">{item.confused}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-blue-400 mb-2">Missing</h4>
                            <p className="text-sm text-muted-foreground">{item.missing}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
