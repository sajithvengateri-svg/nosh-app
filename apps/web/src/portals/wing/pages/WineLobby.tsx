import { motion } from "framer-motion";
import { Wine, TrendingUp, Clock, Gift, ChevronRight, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { useWingStore } from "../stores/wingStore";
import { mockWines } from "../data/mockWines";
import { flavorClusters } from "../data/flavorClusters";
import WineCard from "../components/WineCard";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const WineLobby = () => {
  const { userName, flavorCluster, cellar } = useWingStore();
  const cluster = flavorCluster ? flavorClusters[flavorCluster] : null;

  // Filter wines by user's cluster
  const matchingWines = mockWines.filter((w) => w.flavorCluster === flavorCluster);
  const allocatedWines = mockWines.filter((w) => w.isAllocated);
  const newDrops = mockWines.filter((w) => w.isNewDrop);
  const allWines = mockWines.slice(0, 5);

  const cellarValue = cellar.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
  const readyToDrink = cellar.filter((item) => {
    const year = new Date().getFullYear();
    return year >= item.wine.drinkFrom && year <= item.wine.drinkTo;
  }).length;

  const stats = [
    { icon: Wine, label: 'In Your Cellar', value: cellar.reduce((s, i) => s + i.quantity, 0).toString(), color: '#722F37' },
    { icon: TrendingUp, label: 'Cellar Value', value: `$${cellarValue.toLocaleString()}`, color: '#C9A96E' },
    { icon: Clock, label: 'Ready to Drink', value: readyToDrink.toString(), color: '#22c55e' },
    { icon: Gift, label: 'Allocations', value: allocatedWines.length.toString(), color: '#C9A96E' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">
      {/* Welcome Hero */}
      <motion.section {...fadeUp} transition={{ delay: 0.1 }}>
        <div className="rounded-2xl p-8 md:p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(114,47,55,0.2), rgba(27,67,50,0.15))' }}>
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-widest mb-2" style={{ color: '#C9A96E' }}>Welcome back</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-3"
              style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
              {userName}.
            </h1>
            {cluster && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.2)' }}>
                <span>{cluster.icon}</span>
                <span style={{ color: '#C9A96E' }}>{cluster.name}</span>
              </div>
            )}
            <p className="mt-4 text-sm max-w-lg" style={{ color: '#F5F0EB88' }}>
              {cellar.length > 0
                ? `Your cellar is looking great. ${cellar.reduce((s, i) => s + i.quantity, 0)} bottles, ${readyToDrink} ready to drink.`
                : "Your private cellar awaits. Start building your collection with our curated selections below."
              }
            </p>
          </div>
        </div>
      </motion.section>

      {/* Stat Cards */}
      <motion.section {...fadeUp} transition={{ delay: 0.2 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="rounded-xl p-4 border"
                style={{ background: '#2D2D2D', borderColor: 'rgba(201,169,110,0.08)' }}
              >
                <div className="p-2 rounded-lg inline-flex mb-3"
                  style={{ background: `${stat.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: '#F5F0EB', fontFamily: "'DM Sans', sans-serif" }}>
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: '#F5F0EB66' }}>{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Quick Replenish */}
      {cellar.length > 0 && (
        <motion.section {...fadeUp} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
              Quick Replenish
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {cellar.slice(0, 5).map((item) => (
              <WineCard key={item.wine.id} wine={item.wine} compact />
            ))}
          </div>
        </motion.section>
      )}

      {/* Allocated for You */}
      {allocatedWines.length > 0 && (
        <motion.section {...fadeUp} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
                Allocated for You
              </h2>
              <p className="text-sm mt-1" style={{ color: '#F5F0EB66' }}>
                Reserved bottles, hand-picked for your palate
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(201,169,110,0.15)', color: '#C9A96E' }}>
              {allocatedWines.length} Reserved
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allocatedWines.map((wine) => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        </motion.section>
      )}

      {/* New Drops */}
      <motion.section {...fadeUp} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
            New Drops
          </h2>
          <span className="text-sm flex items-center gap-1" style={{ color: '#C9A96E' }}>
            View all <ChevronRight className="w-4 h-4" />
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {newDrops.map((wine) => (
            <WineCard key={wine.id} wine={wine} />
          ))}
        </div>
      </motion.section>

      {/* Curated for You */}
      {matchingWines.length > 0 && (
        <motion.section {...fadeUp} transition={{ delay: 0.45 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
                Curated for Your Palate
              </h2>
              <p className="text-sm mt-1" style={{ color: '#F5F0EB66' }}>
                Wines that match your {cluster?.name} profile
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {matchingWines.slice(0, 4).map((wine) => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Monthly Bundle CTA */}
      <motion.section {...fadeUp} transition={{ delay: 0.5 }}>
        <div className="rounded-2xl p-6 md:p-8 border relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(27,67,50,0.3), rgba(114,47,55,0.2))',
            borderColor: 'rgba(201,169,110,0.15)',
          }}>
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-6 h-6" style={{ color: '#C9A96E' }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: '#C9A96E' }}>Monthly Curated Case</p>
          </div>
          <h3 className="text-2xl font-bold mb-2"
            style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
            The March Discovery Box
          </h3>
          <p className="text-sm mb-6 max-w-lg" style={{ color: '#F5F0EB88' }}>
            6 wines curated for your {cluster?.name || ''} palate. A mix of favourites and discoveries,
            hand-selected by our sommelier team.
          </p>
          <div className="flex items-center gap-4">
            <button className="px-6 py-3 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #C9A96E, #D4BA8A)',
                color: '#1C1C1C',
              }}>
              Explore Bundle — $295
            </button>
            <span className="text-xs" style={{ color: '#F5F0EB44' }}>
              Value $420 if purchased individually
            </span>
          </div>
        </div>
      </motion.section>

      {/* Browse All */}
      <motion.section {...fadeUp} transition={{ delay: 0.55 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
            Browse Portfolio
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mockWines.slice(0, 8).map((wine) => (
            <WineCard key={wine.id} wine={wine} />
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default WineLobby;
