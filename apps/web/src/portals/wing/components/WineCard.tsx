import { motion } from "framer-motion";
import { Wine, Plus, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Wine as WineType } from "../data/mockWines";
import { useWingStore } from "../stores/wingStore";

interface WineCardProps {
  wine: WineType;
  compact?: boolean;
  showBadge?: boolean;
}

const WineCard = ({ wine, compact = false, showBadge = true }: WineCardProps) => {
  const { addToCart, addToCellar } = useWingStore();

  const getMaturityStatus = () => {
    const year = new Date().getFullYear();
    if (year >= wine.drinkFrom && year <= wine.drinkTo) return { label: 'Drink Now', color: '#22c55e' };
    if (year < wine.drinkFrom) return { label: 'Lay Down', color: '#ef4444' };
    return { label: 'Past Peak', color: '#f59e0b' };
  };

  const maturity = getMaturityStatus();

  if (compact) {
    return (
      <Link to={`/wing/product/${wine.id}`}
        className="flex-shrink-0 w-40 group">
        <div className="rounded-xl overflow-hidden border transition-all group-hover:scale-[1.02]"
          style={{ background: '#2D2D2D', borderColor: 'rgba(201,169,110,0.1)' }}>
          <div className="h-32 relative overflow-hidden">
            <img src={wine.imageUrl} alt={wine.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(45,45,45,0.8) 0%, transparent 50%)' }} />
          </div>
          <div className="p-3">
            <p className="text-xs truncate" style={{ color: '#F5F0EB66' }}>{wine.region}</p>
            <p className="text-sm font-semibold truncate" style={{ color: '#F5F0EB' }}>{wine.name}</p>
            <p className="text-sm font-bold mt-1" style={{ color: '#C9A96E' }}>${wine.memberPrice}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/wing/product/${wine.id}`}
        className="block rounded-xl overflow-hidden border transition-all group"
        style={{ background: '#2D2D2D', borderColor: 'rgba(201,169,110,0.1)' }}>
        <div className="relative h-48 overflow-hidden">
          <img src={wine.imageUrl} alt={wine.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(45,45,45,0.9) 0%, transparent 40%)' }} />

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {showBadge && wine.isAllocated && (
              <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{ background: '#C9A96E', color: '#1C1C1C' }}>
                Allocated
              </span>
            )}
            {showBadge && wine.isNewDrop && (
              <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{ background: '#722F37', color: '#F5F0EB' }}>
                New Drop
              </span>
            )}
          </div>

          {/* Maturity badge */}
          {wine.vintage > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium"
              style={{ background: 'rgba(28,28,28,0.8)', backdropFilter: 'blur(8px)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: maturity.color }} />
              <span style={{ color: '#F5F0EBCC' }}>{maturity.label}</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs mb-1" style={{ color: '#F5F0EB55' }}>
                {wine.region} {wine.vintage > 0 ? `· ${wine.vintage}` : '· NV'}
              </p>
              <h3 className="font-semibold text-sm leading-tight mb-0.5" style={{ color: '#F5F0EB' }}>
                {wine.name}
              </h3>
              <p className="text-xs" style={{ color: '#F5F0EB66' }}>
                {wine.producer} · {wine.varietal}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-xs line-through mr-2" style={{ color: '#F5F0EB44' }}>
                ${wine.retailPrice}
              </span>
              <span className="text-lg font-bold" style={{ color: '#C9A96E' }}>
                ${wine.memberPrice}
              </span>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); addToCart(wine); }}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ background: 'rgba(201,169,110,0.15)' }}
            >
              <Plus className="w-4 h-4" style={{ color: '#C9A96E' }} />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default WineCard;
