import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface TickerItem {
  id: number;
  name: string;
  city?: string | null;
  category?: string | null;
  statusTag?: string | null;
}

interface VibeTickerProps {
  items: TickerItem[];
}

const STATUS_LABELS: Record<string, string> = {
  launching: "Just Launched",
  trending: "Trending 🔥",
  needs_feedback: "Needs Feedback",
  active: "Active",
};

const STATUS_COLORS: Record<string, string> = {
  launching: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  trending: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  needs_feedback: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  active: "text-slate-400 border-slate-500/30 bg-slate-500/10",
};

function TickerCard({ item }: { item: TickerItem }) {
  const status = (item.statusTag as string) ?? "active";
  const statusLabel = STATUS_LABELS[status] ?? "Active";
  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.active;

  return (
    <Link href={`/products/${item.id}`}>
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-[#222] bg-[#111111] hover:border-purple-500/40 hover:shadow-[0_0_12px_rgba(124,58,237,0.2)] transition-all cursor-pointer whitespace-nowrap group">
        <span className="text-base">🚀</span>
        <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
          {item.name}
        </span>
        {item.city && (
          <span className="text-xs text-white/40">· {item.city}</span>
        )}
        {item.category && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-purple-400">
            {item.category}
          </span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
    </Link>
  );
}

export function VibeTicker({ items }: VibeTickerProps) {
  if (!items.length) return null;

  // Duplicate items for seamless loop
  const doubled = [...items, ...items];
  const duration = Math.max(20, items.length * 4);

  return (
    <div className="w-full overflow-hidden bg-[#0D0D0F] border-y border-[#1A1A1A] py-3 relative">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0D0D0F] to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0D0D0F] to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-3"
        animate={{ x: ["-50%", "0%"] }}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
        }}
        style={{ width: "max-content" }}
      >
        {doubled.map((item, i) => (
          <TickerCard key={`${item.id}-${i}`} item={item} />
        ))}
      </motion.div>
    </div>
  );
}
