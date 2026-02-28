import { motion } from "framer-motion";
import { Wine, Clock, TrendingUp, Sparkles, ChevronRight, Archive } from "lucide-react";
import { Link } from "react-router-dom";
import { useWingStore } from "../stores/wingStore";
import { mockWines } from "../data/mockWines";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ['#722F37', '#C9A96E', '#1B4332', '#8B4513', '#F5F0EB33'];

const WineCellar = () => {
  const { cellar, addToCellar } = useWingStore();

  // If cellar is empty, seed some demo data
  const displayCellar = cellar.length > 0
    ? cellar
    : mockWines.slice(0, 6).map((wine) => ({
        wine,
        quantity: Math.floor(Math.random() * 4) + 1,
        addedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        purchasePrice: wine.memberPrice,
      }));

  const totalBottles = displayCellar.reduce((s, i) => s + i.quantity, 0);
  const totalValue = displayCellar.reduce((s, i) => s + i.purchasePrice * i.quantity, 0);

  const getMaturity = (wine: typeof mockWines[0]) => {
    const year = new Date().getFullYear();
    if (year >= wine.drinkFrom && year <= wine.drinkTo) return { label: 'Drink Now', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
    if (year < wine.drinkFrom) return { label: 'Lay Down', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
    return { label: 'Hold', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  };

  const readyCount = displayCellar.filter((i) => getMaturity(i.wine).label === 'Drink Now').length;
  const holdCount = displayCellar.filter((i) => getMaturity(i.wine).label === 'Hold').length;
  const layDownCount = displayCellar.filter((i) => getMaturity(i.wine).label === 'Lay Down').length;

  // Pie chart data — by type
  const typeMap: Record<string, number> = {};
  displayCellar.forEach((item) => {
    const t = item.wine.type;
    typeMap[t] = (typeMap[t] || 0) + item.quantity;
  });
  const pieData = Object.entries(typeMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const stats = [
    { label: 'Total Bottles', value: totalBottles.toString(), icon: Wine, color: '#722F37' },
    { label: 'Drink Now', value: readyCount.toString(), icon: Clock, color: '#22c55e' },
    { label: 'Hold', value: holdCount.toString(), icon: Clock, color: '#f59e0b' },
    { label: 'Cellar Value', value: `$${totalValue.toLocaleString()}`, icon: TrendingUp, color: '#C9A96E' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold"
            style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
            Your Digital Cellar
          </h1>
          <p className="text-sm mt-1" style={{ color: '#F5F0EB66' }}>
            {totalBottles} bottles across {displayCellar.length} wines
          </p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-xl p-4 border"
              style={{ background: '#2D2D2D', borderColor: 'rgba(201,169,110,0.08)' }}
            >
              <div className="p-2 rounded-lg inline-flex mb-2" style={{ background: `${stat.color}20` }}>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bottle Grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {displayCellar.map((item, i) => {
              const maturity = getMaturity(item.wine);
              return (
                <motion.div
                  key={item.wine.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.03 * i }}
                >
                  <Link to={`/wing/product/${item.wine.id}`}
                    className="block rounded-xl overflow-hidden border group transition-all hover:scale-[1.02]"
                    style={{ background: '#2D2D2D', borderColor: 'rgba(201,169,110,0.08)' }}>
                    <div className="relative h-36 overflow-hidden">
                      <img src={item.wine.imageUrl} alt={item.wine.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(0deg, rgba(45,45,45,0.9) 0%, transparent 50%)',
                      }} />
                      {/* Maturity indicator */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
                        style={{ background: maturity.bg, color: maturity.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: maturity.color }} />
                        {maturity.label}
                      </div>
                      {/* Quantity */}
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-bold"
                        style={{ background: 'rgba(28,28,28,0.8)', color: '#F5F0EB' }}>
                        ×{item.quantity}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[11px]" style={{ color: '#F5F0EB55' }}>
                        {item.wine.region} · {item.wine.vintage > 0 ? item.wine.vintage : 'NV'}
                      </p>
                      <p className="text-sm font-semibold truncate" style={{ color: '#F5F0EB' }}>
                        {item.wine.name}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#F5F0EB44' }}>
                        ${item.purchasePrice} × {item.quantity}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Analytics + AI */}
        <div className="space-y-4">
          {/* Cellar Composition */}
          <div className="rounded-xl p-5 border"
            style={{ background: '#2D2D2D', borderColor: 'rgba(201,169,110,0.08)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
              Cellar Composition
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#2D2D2D', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '8px', color: '#F5F0EB' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span style={{ color: '#F5F0EBCC' }}>{item.name}</span>
                  </div>
                  <span style={{ color: '#F5F0EB66' }}>{item.value} bottles</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestion */}
          <div className="rounded-xl p-5 border"
            style={{
              background: 'linear-gradient(135deg, rgba(27,67,50,0.15), rgba(114,47,55,0.1))',
              borderColor: 'rgba(201,169,110,0.12)',
            }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: '#C9A96E' }} />
              <h3 className="text-sm font-semibold" style={{ color: '#C9A96E' }}>
                Sommelier Suggestion
              </h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#F5F0EBCC' }}>
              Your cellar is heavy on reds. For summer, consider adding the
              <strong style={{ color: '#C9A96E' }}> Grosset Riesling</strong> — it'll give you
              something crisp and refreshing when the mood strikes.
            </p>
            <Link to="/wing/product/w10"
              className="inline-flex items-center gap-1 mt-3 text-xs font-medium"
              style={{ color: '#C9A96E' }}>
              View Riesling <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WineCellar;
