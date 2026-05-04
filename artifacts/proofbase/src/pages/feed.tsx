import { Nav } from "@/components/nav";
import { useGetCommunityFeed } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

type FeedEvent = {
  id: number;
  type: string;
  productId: number | null;
  productName: string | null;
  userId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function EventCard({ event, index }: { event: FeedEvent; index: number }) {
  const meta = event.metadata ?? {};

  const icon: Record<string, string> = {
    product_listed: "🚀",
    feedback_received: "💬",
    milestone: "🏆",
    badge_earned: "🎖️",
  };

  const getMessage = () => {
    switch (event.type) {
      case "product_listed":
        return (
          <>
            A new product was listed:{" "}
            {event.productId ? (
              <Link href={`/products/${event.productId}`} className="text-primary hover:underline font-medium">
                {event.productName}
              </Link>
            ) : (
              <span className="font-medium">{event.productName}</span>
            )}
            {meta.city ? ` · ${meta.city}` : ""}
            {meta.category ? ` · ${meta.category}` : ""}
          </>
        );
      case "feedback_received":
        return (
          <>
            New feedback on{" "}
            {event.productId ? (
              <Link href={`/products/${event.productId}`} className="text-primary hover:underline font-medium">
                {event.productName}
              </Link>
            ) : (
              <span className="font-medium">{event.productName}</span>
            )}
            {meta.rating != null ? ` · ${meta.rating}/5 ★` : ""}
            {meta.wouldPay ? " · Would pay" : ""}
          </>
        );
      case "milestone":
        return (
          <span className="text-yellow-400">
            {String(meta.text ?? `${event.productName} hit a milestone!`)}
          </span>
        );
      case "badge_earned":
        return (
          <>
            Someone earned the <span className="text-primary font-medium">{String(meta.badge ?? "")}</span> badge
          </>
        );
      default:
        return <span>{event.type}</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-start gap-4 py-4 border-b border-border/50 last:border-0"
    >
      <div className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-base shrink-0">
        {icon[event.type] ?? "📌"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/90 leading-relaxed">{getMessage()}</p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo(event.createdAt)}</p>
      </div>
    </motion.div>
  );
}

export default function Feed() {
  const { data: events = [], isLoading } = useGetCommunityFeed({});

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0B0B0C]">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Community Feed</h1>
            <p className="text-muted-foreground">Live activity from the ProofBase community.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl px-6 py-2">
            {isLoading ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-4xl mb-4">📭</p>
                <p>No activity yet. Be the first to list a product!</p>
              </div>
            ) : (
              (events as FeedEvent[]).map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
