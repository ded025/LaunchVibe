import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useGetTrendingProducts, useGetMapProducts } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

function StatusTag({ tag }: { tag?: string | null }) {
  const config: Record<string, { label: string; cls: string }> = {
    launching: { label: "Launching", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    trending: { label: "Trending", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    needs_feedback: { label: "Needs Feedback", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    active: { label: "Active", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  };
  if (!tag) return null;
  const cfg = config[tag] ?? config.active;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function Home() {
  const { data: trendingProducts = [] } = useGetTrendingProducts();
  const { data: mapProducts = [] } = useGetMapProducts();

  const cityGroups = useMemo(() => {
    const map: Record<string, number> = {};
    (mapProducts as any[]).forEach((p) => {
      if (p.city) map[p.city] = (map[p.city] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [mapProducts]);

  const hasMapData = (mapProducts as any[]).some((p) => p.latitude && p.longitude);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0B0B0C]">
      <Nav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-16 md:py-32 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/10 to-transparent pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center container mx-auto max-w-4xl relative z-10"
          >
            <h1 className="text-4xl md:text-7xl font-bold tracking-tighter mb-6 md:mb-8 text-foreground">
              Get real feedback.{" "}
              <br className="hidden md:inline" />
              Build better products.
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
              ProofBase helps builders get structured feedback, real users, and actionable insights. A premium instrument for teams who take feedback seriously.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <Button asChild size="lg" className="h-12 md:h-14 px-8 text-base bg-gradient-accent text-white border-0 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all w-full sm:w-auto">
                <Link href="/sign-up">Start Listing</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 md:h-14 px-8 text-base w-full sm:w-auto border-[#1A1A1A] hover:bg-[#111111]">
                <Link href="/explore">Explore Products</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Live Startup Map */}
        <section className="py-10 md:py-16 bg-[#0D0D0F] border-y border-[#1A1A1A]">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-1">Live Startup Map</h2>
              <p className="text-muted-foreground text-sm">Where builders on ProofBase are located.</p>
            </div>

            {hasMapData ? (
              <div className="rounded-2xl overflow-hidden border border-[#1A1A1A] shadow-[0_0_40px_rgba(124,58,237,0.08)]" style={{ height: 280 }}>
                <MapContainer
                  center={[20, 0]}
                  zoom={2}
                  style={{ height: "100%", width: "100%", background: "#0D0D0F" }}
                  zoomControl={false}
                  scrollWheelZoom={false}
                  attributionControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  />
                  {(mapProducts as any[]).filter((p) => p.latitude && p.longitude).map((p) => (
                    <CircleMarker
                      key={p.id}
                      center={[p.latitude, p.longitude]}
                      radius={7}
                      pathOptions={{ color: "#7C3AED", fillColor: "#7C3AED", fillOpacity: 0.85, weight: 1.5 }}
                    >
                      <Popup className="dark-popup">
                        <div className="text-sm font-semibold">{p.name}</div>
                        {p.city && <div className="text-xs text-gray-400">{p.city}{p.country ? `, ${p.country}` : ""}</div>}
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#1A1A1A] h-40 flex flex-col items-center justify-center text-muted-foreground">
                <span className="text-3xl mb-2">🗺️</span>
                <p className="text-sm px-4 text-center">No location data yet. Products with locations will appear here.</p>
              </div>
            )}

            {cityGroups.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                {cityGroups.map(([city, count]) => (
                  <span
                    key={city}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#111111] border border-[#1A1A1A] text-muted-foreground"
                  >
                    📍 {city} <span className="text-primary font-medium ml-1">{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Trending Products */}
        <section className="py-14 md:py-24 bg-[#111111] border-y border-[#1A1A1A]">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Trending Products</h2>
              <p className="text-muted-foreground text-sm md:text-base">See what other ambitious founders are building.</p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {trendingProducts.slice(0, 3).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/products/${product.id}`}>
                    <Card className="h-full bg-card hover:scale-[1.02] transition-transform duration-300 cursor-pointer border-[#1A1A1A] hover:border-primary/30">
                      <CardContent className="p-5 md:p-6">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="text-lg md:text-xl font-bold line-clamp-1">{product.name}</h3>
                          <Badge variant="outline" className="bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20 shrink-0 text-xs">
                            {product.category}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <StatusTag tag={(product as any).statusTag} />
                          {(product as any).city && (
                            <span className="text-xs text-muted-foreground">📍 {(product as any).city}</span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-5">{product.tagline}</p>
                        <div className="flex items-center justify-between text-sm pt-4 border-t border-[#1A1A1A]">
                          <span className="text-muted-foreground text-xs">{product.feedbackCount} feedback</span>
                          <div className="flex items-center gap-2">
                            {(product as any).score != null && (
                              <span className="text-xs font-mono text-[#7C3AED]">★ {Number((product as any).score).toFixed(2)}</span>
                            )}
                            {product.avgRating && (
                              <span className="text-yellow-500 flex items-center gap-1 text-xs">
                                ★ {product.avgRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Link href="/explore">View all products →</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 md:py-32 px-4 container mx-auto max-w-5xl">
          <div className="text-center mb-14 md:mb-20">
            <h2 className="text-2xl md:text-5xl font-bold tracking-tight mb-4 md:mb-6">Designed for signal, not noise.</h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Get past the shallow compliments and uncover exactly what you need to build next.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-12">
            {[
              { num: "01", title: "List with intent", desc: "Create a focused listing that tells users exactly what you want them to test and evaluate." },
              { num: "02", title: "Structured insights", desc: "No free-form essays. We ask what they loved, what confused them, and what's missing." },
              { num: "03", title: "AI Synthesis", desc: "When you have too much feedback, our AI summarizes patterns across strengths and weaknesses." },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-5xl md:text-6xl font-bold text-[#1A1A1A] mb-3">{step.num}</div>
                <h3 className="text-lg md:text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-32 bg-gradient-to-t from-[#111111] to-[#0B0B0C] border-t border-[#1A1A1A]">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8">Stop guessing what users want.</h2>
            <Button asChild size="lg" className="h-12 md:h-14 px-8 md:px-10 text-base md:text-lg bg-gradient-accent text-white border-0 w-full sm:w-auto">
              <Link href="/sign-up">Get Started Today</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1A1A1A] bg-[#0B0B0C] py-8 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} ProofBase. A premium feedback instrument.</p>
      </footer>
    </div>
  );
}
