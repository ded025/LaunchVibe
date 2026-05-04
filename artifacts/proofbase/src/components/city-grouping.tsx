import { motion } from "framer-motion";

interface CityGroupingProps {
  cityGroups: [string, number][];
  activeCity?: string | null;
  onCityClick: (city: string | null) => void;
}

export function CityGrouping({ cityGroups, activeCity, onCityClick }: CityGroupingProps) {
  if (!cityGroups.length) return null;

  return (
    <section className="py-12 bg-[#0D0D0F] border-t border-[#1A1A1A]">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              🏙️ Top Cities Building Right Now
            </h2>
            <p className="text-xs text-white/30 mt-1">Click a city to filter startups</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {activeCity && (
              <button
                onClick={() => onCityClick(null)}
                className="px-4 py-2 rounded-xl text-sm border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all"
              >
                ✕ Clear filter
              </button>
            )}
            {cityGroups.map(([city, count], i) => (
              <motion.button
                key={city}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onCityClick(activeCity === city ? null : city)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  activeCity === city
                    ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_16px_rgba(124,58,237,0.35)]"
                    : "bg-[#111111] border-[#1A1A1A] text-white/60 hover:text-white hover:border-purple-500/30 hover:shadow-[0_0_10px_rgba(124,58,237,0.1)]"
                }`}
              >
                <span>📍</span>
                <span>{city}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                    activeCity === city ? "bg-white/20" : "bg-[#1a1a1a] text-purple-400"
                  }`}
                >
                  {count}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
