import { Nav } from "@/components/nav";
import { useListProducts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Explore() {
  const { data: products = [], isLoading } = useListProducts({});

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Explore Products</h1>
          <p className="text-muted-foreground">Discover and review new tools built by ambitious founders.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-muted/50 rounded-t-xl" />
                <CardContent className="h-24 bg-card" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="hover:scale-[1.02] transition-transform duration-200 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] cursor-pointer h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl line-clamp-1">{product.name}</CardTitle>
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{product.category}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2 mt-2">{product.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{product.feedbackCount} feedback</span>
                      {product.avgRating && (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span> {product.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
