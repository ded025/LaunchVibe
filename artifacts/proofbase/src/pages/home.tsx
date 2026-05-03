import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useGetTrendingProducts } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { data: trendingProducts = [] } = useGetTrendingProducts();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0B0B0C]">
      <Nav />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-32 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/10 to-transparent pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center container mx-auto max-w-4xl relative z-10"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 text-foreground">
              Get real feedback. <br className="hidden md:inline" />
              Build better products.
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              ProofBase helps builders get structured feedback, real users, and actionable insights. A premium instrument for teams who take feedback seriously.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-base bg-gradient-accent text-white border-0 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all w-full sm:w-auto">
                <Link href="/sign-up">Start Listing</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base w-full sm:w-auto border-[#1A1A1A] hover:bg-[#111111]">
                <Link href="/explore">Explore Products</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Featured / Trending Section */}
        <section className="py-24 bg-[#111111] border-y border-[#1A1A1A]">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Trending Products</h2>
              <p className="text-muted-foreground">See what other ambitious founders are building.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {trendingProducts.slice(0, 3).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/products/${product.id}`}>
                    <Card className="h-full bg-card hover:scale-[1.02] transition-transform duration-300 cursor-pointer border-[#1A1A1A]">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold line-clamp-1">{product.name}</h3>
                          <Badge variant="outline" className="bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20">{product.category}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-6">{product.tagline}</p>
                        <div className="flex items-center justify-between text-sm pt-4 border-t border-[#1A1A1A]">
                          <span className="text-muted-foreground">{product.feedbackCount} feedback</span>
                          {product.avgRating && (
                            <span className="text-yellow-500 flex items-center gap-1">★ {product.avgRating.toFixed(1)}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Link href="/explore">View all products →</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-32 px-4 container mx-auto max-w-5xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Designed for signal, not noise.</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Get past the shallow compliments and uncover exactly what you need to build next.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { num: "01", title: "List with intent", desc: "Create a focused listing that tells users exactly what you want them to test and evaluate." },
              { num: "02", title: "Structured insights", desc: "No free-form essays. We ask what they loved, what confused them, and what's missing." },
              { num: "03", title: "AI Synthesis", desc: "When you have too much feedback, our AI summarizes patterns across strengths and weaknesses." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-6xl font-bold text-[#1A1A1A] mb-4">{step.num}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-gradient-to-t from-[#111111] to-[#0B0B0C] border-t border-[#1A1A1A]">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-4xl font-bold mb-8">Stop guessing what users want.</h2>
            <Button asChild size="lg" className="h-14 px-10 text-lg bg-gradient-accent text-white border-0">
              <Link href="/sign-up">Get Started Today</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-[#1A1A1A] bg-[#0B0B0C] py-12 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} ProofBase. A premium feedback instrument.</p>
      </footer>
    </div>
  );
}
