import { Nav } from "@/components/nav";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  useGetDashboard, 
  useGetDashboardProducts, 
  getGetDashboardQueryKey,
  getGetDashboardProductsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const { data: dashboard, isLoading } = useGetDashboard({ query: { enabled: isSignedIn === true } });
  const { data: products = [], isLoading: productsLoading } = useGetDashboardProducts({ query: { enabled: isSignedIn === true } });
  const queryClient = useQueryClient();

  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Nav />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  if (isLoading || productsLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Nav />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link href="/dashboard/submit">New Product</Link>
          </Button>
        </div>
        
        {(!products || products.length === 0) ? (
          <div className="text-center py-24 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground mb-4">You haven't listed any products yet.</p>
            <Button asChild variant="outline">
              <Link href="/dashboard/submit">List your first product</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{dashboard?.totalProducts || 0}</div></CardContent>
              </Card>
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{dashboard?.totalFeedback || 0}</div></CardContent>
              </Card>
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{dashboard?.avgRating?.toFixed(1) || "-"} <span className="text-lg text-yellow-500">★</span></div></CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Your Products</h2>
              <div className="grid gap-4">
                {products.map(product => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-border">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>{product.feedbackCount} feedback</span>
                            {product.avgRating && <span>{product.avgRating.toFixed(1)} avg rating</span>}
                          </div>
                        </div>
                        <Badge variant="outline">{product.category}</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
