import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Wine, ShoppingCart, Archive, Play, Users, Award } from "lucide-react";
import { mockWines } from "../data/mockWines";
import { useWingStore } from "../stores/wingStore";
import { flavorClusters } from "../data/flavorClusters";
import { toast } from "sonner";

const WineProduct = () => {
  const { id } = useParams<{ id: string }>();
  const wine = mockWines.find((w) => w.id === id);
  const { addToCart, addToCellar, flavorCluster } = useWingStore();
  const cluster = flavorCluster ? flavorClusters[flavorCluster] : null;

  if (!wine) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p style={{ color: '#F5F0EB66' }}>Wine not found</p>
      </div>
    );
  }

  const getMaturityStatus = () => {
    const year = new Date().getFullYear();
    if (year >= wine.drinkFrom && year <= wine.drinkTo) return { label: 'Drink Now', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
    if (year < wine.drinkFrom) return { label: 'Lay Down', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
    return { label: 'Past Peak', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  };

  const maturity = getMaturityStatus();
  const isMatch = wine.flavorCluster === flavorCluster;

  const handleAddToCart = () => {
    addToCart(wine);
    toast.success(`${wine.name} added to cart`);
  };

  const handleAddToCellar = () => {
    addToCellar(wine);
    toast.success(`${wine.name} added to your virtual cellar`);
  };

  const barStyle = (value: number) => ({
    width: `${(value / 5) * 100}%`,
    height: '6px',
    borderRadius: '3px',
    background: '#C9A96E',
    transition: 'width 0.5s ease',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <Link to="/wing/lobby" className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-80 transition-opacity"
        style={{ color: '#F5F0EB66' }}>
        <ChevronLeft className="w-4 h-4" />
        Back to Lobby
      </Link>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Left: Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl overflow-hidden relative aspect-[3/4]"
            style={{ background: '#2D2D2D' }}>
            <img src={wine.imageUrl} alt={wine.name}
              className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(0deg, rgba(45,45,45,0.6) 0%, transparent 30%)',
            }} />
            {/* Maturity badge */}
            {wine.vintage > 0 && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: maturity.bg, color: maturity.color }}>
                <span className="w-2 h-2 rounded-full" style={{ background: maturity.color }} />
                {maturity.label}
              </div>
            )}
          </div>

          {/* Wine Guy Video Note */}
          <div className="mt-4 p-4 rounded-xl border flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: 'rgba(114,47,55,0.1)', borderColor: 'rgba(201,169,110,0.15)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#722F37' }}>
              <Play className="w-5 h-5 ml-0.5" style={{ color: '#F5F0EB' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
                The Wine Guy's Take
              </p>
              <p className="text-xs" style={{ color: '#F5F0EB66' }}>
                Tap to hear Marco's story about this bottle
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right: Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Title */}
          <div>
            <p className="text-sm mb-1" style={{ color: '#C9A96E' }}>
              {wine.region} · {wine.vintage > 0 ? wine.vintage : 'NV'}
            </p>
            <h1 className="text-3xl font-bold mb-1"
              style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
              {wine.name}
            </h1>
            <p className="text-lg" style={{ color: '#F5F0EB88' }}>
              {wine.producer} · {wine.varietal}
            </p>
            {isMatch && cluster && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs"
                style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.2)', color: '#C9A96E' }}>
                {cluster.icon} Matches your {cluster.name} palate
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="rounded-xl p-5 border"
            style={{ background: 'rgba(45,45,45,0.5)', borderColor: 'rgba(201,169,110,0.1)' }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs mb-1" style={{ color: '#F5F0EB55' }}>Wholesale</p>
                <p className="text-lg font-bold" style={{ color: '#F5F0EB66' }}>${wine.wholesalePrice}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#F5F0EB55' }}>Retail</p>
                <p className="text-lg font-bold line-through" style={{ color: '#F5F0EB44' }}>${wine.retailPrice}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#C9A96E' }}>Your Price</p>
                <p className="text-2xl font-bold" style={{ color: '#C9A96E' }}>${wine.memberPrice}</p>
              </div>
            </div>
            <p className="text-xs text-center mt-3" style={{ color: '#F5F0EB44' }}>
              You save {Math.round((1 - wine.memberPrice / wine.retailPrice) * 100)}% as a Private Wing member
            </p>
          </div>

          {/* Sommelier Note */}
          <div className="rounded-xl p-5 border"
            style={{ background: 'rgba(27,67,50,0.08)', borderColor: 'rgba(201,169,110,0.1)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#722F37' }}>
                <Wine className="w-4 h-4" style={{ color: '#F5F0EB' }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#F5F0EB' }}>Marco says:</p>
                <p className="text-sm italic leading-relaxed" style={{ color: '#F5F0EBCC' }}>
                  "{wine.sommelierNote}"
                </p>
              </div>
            </div>
          </div>

          {/* Tasting Profile */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#C9A96E' }}>
              Tasting Profile
            </h3>
            {[
              { label: 'Body', value: wine.body, labels: ['Light', 'Full'] },
              { label: 'Tannin', value: wine.tannin, labels: ['Low', 'High'] },
              { label: 'Acidity', value: wine.acidity, labels: ['Low', 'High'] },
              { label: 'Sweetness', value: wine.sweetness, labels: ['Dry', 'Sweet'] },
            ].filter(item => wine.type === 'red' || item.label !== 'Tannin').map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs w-16" style={{ color: '#F5F0EB88' }}>{item.label}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(245,240,235,0.08)' }}>
                  <div style={barStyle(item.value)} />
                </div>
                <span className="text-xs w-10 text-right" style={{ color: '#F5F0EB55' }}>
                  {item.value <= 2 ? item.labels[0] : item.value >= 4 ? item.labels[1] : 'Med'}
                </span>
              </div>
            ))}
          </div>

          {/* Food Pairings */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#C9A96E' }}>
              Food Pairings
            </h3>
            <div className="flex flex-wrap gap-2">
              {wine.foodPairings.map((pairing) => (
                <span key={pairing} className="px-3 py-1.5 rounded-full text-xs"
                  style={{ background: 'rgba(245,240,235,0.06)', color: '#F5F0EBCC', border: '1px solid rgba(245,240,235,0.08)' }}>
                  {pairing}
                </span>
              ))}
            </div>
          </div>

          {/* Technical Details */}
          <details className="group">
            <summary className="text-sm font-semibold uppercase tracking-widest cursor-pointer list-none flex items-center gap-2"
              style={{ color: '#F5F0EB66' }}>
              <span>Sommelier Details</span>
              <ChevronLeft className="w-4 h-4 -rotate-90 group-open:rotate-0 transition-transform" />
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><span style={{ color: '#F5F0EB55' }}>ABV:</span> <span style={{ color: '#F5F0EB' }}>{wine.abv}%</span></div>
              <div><span style={{ color: '#F5F0EB55' }}>Oak:</span> <span style={{ color: '#F5F0EB' }}>{wine.oakTreatment}</span></div>
              <div><span style={{ color: '#F5F0EB55' }}>Drink:</span> <span style={{ color: '#F5F0EB' }}>{wine.drinkFrom}–{wine.drinkTo}</span></div>
              <div><span style={{ color: '#F5F0EB55' }}>Stock:</span> <span style={{ color: '#F5F0EB' }}>{wine.stockLevel} bottles</span></div>
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: '#F5F0EB88' }}>
              {wine.tastingNotes}
            </p>
          </details>

          {/* Social Proof */}
          <div className="flex items-center gap-4 text-xs" style={{ color: '#F5F0EB55' }}>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 3 collectors recently added this</span>
            <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> 94 pts Halliday</span>
          </div>

          {/* Dual CTA */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #C9A96E, #D4BA8A)',
                color: '#1C1C1C',
              }}>
              <ShoppingCart className="w-4 h-4" />
              Add to Cart — ${wine.memberPrice}
            </button>
            <button
              onClick={handleAddToCellar}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95 border"
              style={{
                borderColor: 'rgba(201,169,110,0.3)',
                color: '#C9A96E',
              }}>
              <Archive className="w-4 h-4" />
              Virtual Cellar
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WineProduct;
