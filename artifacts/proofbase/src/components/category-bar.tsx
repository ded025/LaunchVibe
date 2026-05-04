interface CategoryBarProps {
  active: string;
  onChange: (cat: string) => void;
}

const CATEGORIES = [
  "All",
  "AI",
  "SaaS",
  "Crypto",
  "Dev Tools",
  "Finance",
  "Health",
  "Others",
];

export function CategoryBar({ active, onChange }: CategoryBarProps) {
  return (
    <div className="sticky top-0 z-40 bg-[#0B0B0C]/90 backdrop-blur-md border-b border-[#1A1A1A]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                active === cat
                  ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                  : "bg-[#111111] border-[#1A1A1A] text-white/50 hover:text-white hover:border-[#2a2a2a]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
