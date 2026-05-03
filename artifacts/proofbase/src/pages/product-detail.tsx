import { Nav } from "@/components/nav";
import { useParams } from "wouter";
import { 
  useGetProduct, 
  useGetProductFeedback, 
  useGetProductStats, 
  useSubmitFeedback,
  useSummarizeProductFeedback,
  getGetProductFeedbackQueryKey,
  getGetProductStatsQueryKey
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Show, useUser } from "@clerk/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    liked: "",
    confused: "",
    missing: "",
    rating: 5,
    wouldPay: true
  });

  const { data: product, isLoading: productLoading } = useGetProduct(id, { query: { enabled: !!id } });
  const { data: feedback = [], isLoading: feedbackLoading } = useGetProductFeedback(id, { query: { enabled: !!id } });
  const { data: stats, isLoading: statsLoading } = useGetProductStats(id, { query: { enabled: !!id } });
  
  const submitFeedback = useSubmitFeedback({
    mutation: {
      onSuccess: () => {
        setIsFeedbackOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetProductFeedbackQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey(id) });
        setFeedbackForm({ liked: "", confused: "", missing: "", rating: 5, wouldPay: true });
      }
    }
  });

  const summarize = useSummarizeProductFeedback();

  if (productLoading) {
    return <div className="min-h-screen flex flex-col"><Nav /><div className="flex-1 flex items-center justify-center"><div className="animate-pulse">Loading...</div></div></div>;
  }

  if (!product) return <div>Product not found</div>;

  const isFounder = user?.id === product.founderClerkId;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-12 border-b border-border pb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30">{product.category}</Badge>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl">{product.tagline}</p>
            </div>
            <div className="flex gap-3">
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
                          onChange={(e) => setFeedbackForm({...feedbackForm, liked: e.target.value})}
                          placeholder="What stood out to you..."
                          className="bg-background"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>What confused you?</Label>
                        <Textarea 
                          value={feedbackForm.confused}
                          onChange={(e) => setFeedbackForm({...feedbackForm, confused: e.target.value})}
                          placeholder="What wasn't clear..."
                          className="bg-background"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>What is missing?</Label>
                        <Textarea 
                          value={feedbackForm.missing}
                          onChange={(e) => setFeedbackForm({...feedbackForm, missing: e.target.value})}
                          placeholder="What features do you wish it had..."
                          className="bg-background"
                        />
                      </div>
                      <div className="grid gap-2 pt-2">
                        <Label>Rating ({feedbackForm.rating}/5)</Label>
                        <Slider 
                          value={[feedbackForm.rating]} 
                          max={5} min={1} step={1}
                          onValueChange={([val]) => setFeedbackForm({...feedbackForm, rating: val})}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Label>Would you pay for this?</Label>
                        <Switch 
                          checked={feedbackForm.wouldPay}
                          onCheckedChange={(checked) => setFeedbackForm({...feedbackForm, wouldPay: checked})}
                        />
                      </div>
                      <Button 
                        onClick={() => submitFeedback.mutate({ id, data: feedbackForm })}
                        disabled={submitFeedback.isPending || !feedbackForm.liked}
                        className="mt-4"
                      >
                        {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </Show>
            </div>
          </div>
          
          <div className="mt-8 text-muted-foreground whitespace-pre-wrap">
            {product.description}
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats?.avgRating?.toFixed(1) || "-"} <span className="text-lg text-yellow-500">★</span></div></CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats?.totalFeedback || 0}</div></CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Would Pay Ratio</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats?.wouldPayRatio !== null && stats?.wouldPayRatio !== undefined ? Math.round(stats.wouldPayRatio * 100) : 0}%</div></CardContent>
          </Card>
        </div>

        {isFounder && (
          <div className="mb-12 p-6 border border-primary/30 rounded-xl bg-primary/5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary mb-1">AI Insights</h3>
                <p className="text-sm text-muted-foreground">Synthesize all your feedback into actionable insights.</p>
              </div>
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => summarize.mutate({ data: { productId: id }})}
                disabled={summarize.isPending}
              >
                {summarize.isPending ? "Analyzing..." : "Generate Summary"}
              </Button>
            </div>
            
            {summarize.data && (
              <div className="grid md:grid-cols-3 gap-6 mt-6">
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
            )}
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Feedback</h2>
          <div className="space-y-6">
            {feedback.length === 0 ? (
              <p className="text-muted-foreground">No feedback yet. Be the first!</p>
            ) : (
              feedback.map(item => (
                <Card key={item.id} className="border-border/50 shadow-none">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex text-yellow-500">
                        {Array.from({length: 5}).map((_, i) => (
                          <span key={i} className={i < item.rating ? "opacity-100" : "opacity-30"}>★</span>
                        ))}
                      </div>
                      <Badge variant="outline" className={item.wouldPay ? "text-green-400 border-green-400/20" : "text-muted-foreground"}>
                        {item.wouldPay ? "Would pay" : "Wouldn't pay"}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(item.createdAt).toLocaleDateString()}</span>
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
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
