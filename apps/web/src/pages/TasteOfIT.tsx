import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";
import { SEO } from "@/lib/seoConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChefHat, Wine, Monitor, Users, Clock, Truck, Building2, Megaphone,
  CalendarDays, Atom, ShieldCheck, Volume2, VolumeX, ArrowDown, Mail,
} from "lucide-react";

const modules = [
  { name: "ChefOS", icon: ChefHat, color: "from-orange-500 to-amber-500", desc: "Recipe costing, inventory, prep lists, food safety, menu engineering.", bullets: ["Auto-cost every recipe in real-time", "AI invoice scanning updates prices instantly", "HACCP-compliant food safety with photo evidence"] },
  { name: "BevOS", icon: Wine, color: "from-purple-500 to-violet-500", desc: "Wine cellar, cocktails, draught, coffee, stocktake, Coravin tracking.", bullets: ["Pour-level GP tracking across spirits, wine, beer", "Automated line cleaning schedules with alerts", "Coravin integration for premium by-the-glass programs"] },
  { name: "RestOS", icon: Monitor, color: "from-blue-500 to-cyan-500", desc: "Point of sale, kitchen display, tabs, analytics.", bullets: ["Touch-optimised order flow with modifier support", "Multi-station KDS with smart timer integration", "Real-time sales analytics with hourly breakdowns"] },
  { name: "LabourOS", icon: Users, color: "from-emerald-500 to-green-500", desc: "Roster, timesheets, payroll, award interpretation.", bullets: ["Award-compliant roster building with cost forecasting", "Automated timesheet approval with overtime detection", "Break compliance monitoring with real-time alerts"] },
  { name: "ClockOS", icon: Clock, color: "from-cyan-500 to-sky-500", desc: "Time & attendance with photo verification and geo-fencing.", bullets: ["PIN + photo clock-in prevents buddy punching", "Geo-fenced to venue location", "Integrates directly with LabourOS timesheets"] },
  { name: "SupplyOS", icon: Truck, color: "from-teal-500 to-emerald-500", desc: "Supplier management, ordering, price comparison.", bullets: ["Par-level based order suggestions", "Multi-supplier price comparison", "Delivery tracking and receiving verification"] },
  { name: "OverheadOS", icon: Building2, color: "from-slate-500 to-gray-500", desc: "Fixed costs, utilities, rent, insurance, break-even analysis.", bullets: ["Break-even calculator updated with live data", "Recurring cost tracking with trend analysis", "Industry benchmark comparisons"] },
  { name: "GrowthOS", icon: Megaphone, color: "from-pink-500 to-rose-500", desc: "Campaigns, customer segments, marketing analytics.", bullets: ["RFM-based customer segmentation", "Campaign ROI tracking across channels", "Automated marketing calendar"] },
  { name: "ReservationOS", icon: CalendarDays, color: "from-amber-500 to-yellow-500", desc: "Bookings, floor plan, guest CRM, functions & events.", bullets: ["Interactive floor plan with live status", "Guest profiles with visit history and preferences", "Full function management with proposal builder"] },
];

const sections = [
  { id: "hero", text: "One ecosystem. Every decision. Zero guesswork. Welcome to dot iT — the operating system for modern hospitality." },
  { id: "problem", text: "60% of restaurants fail in their first year. The number one reason? Not food quality — it's financial blindness. Disconnected systems, hidden costs, and decisions made on gut feeling instead of data." },
  { id: "ecosystem", text: "dot iT connects every part of your operation into a single ecosystem. 9 operational modules generate data. 2 intelligence layers read it all and tell you what to do." },
  { id: "intelligence", text: "MoneyOS Reactor doesn't generate data. It reads EVERYTHING from every module and tells you what's happening, what's about to happen, and what to do about it. Quiet Audit is a silent engine that scores your business across 7 modules, 24/7, without you lifting a finger." },
];

export default function TasteOfIT() {
  useSEO(SEO["/taste"]);
  const [speaking, setSpeaking] = useState(false);

  const narrate = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = sections.map((s) => s.text).join(". . . ");
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }, [speaking]);

  const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Voice toggle */}
      <Button
        onClick={narrate}
        size="icon"
        variant="outline"
        className="fixed top-4 right-4 z-50 rounded-full h-10 w-10"
      >
        {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </Button>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            <span className="text-primary">.</span>iT
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mt-4 max-w-lg mx-auto">
            One ecosystem. Every decision.<br />Zero guesswork.
          </p>
        </motion.div>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8">
          <ArrowDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </section>

      {/* Problem */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <motion.div {...fadeUp} className="space-y-6 text-center">
          <h2 className="text-3xl font-bold">The Problem</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            <span className="text-destructive font-bold">60%</span> of restaurants fail in their first year.
            The #1 reason isn't food quality — it's <span className="text-foreground font-semibold">financial blindness</span>.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { stat: "73%", label: "use disconnected systems" },
              { stat: "$47K", label: "avg hidden cost per year" },
              { stat: "82%", label: "decisions made on gut feeling" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-primary">{s.stat}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Module Cards */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <motion.h2 {...fadeUp} className="text-3xl font-bold text-center mb-12">The Ecosystem</motion.h2>
        <div className="grid md:grid-cols-3 gap-4">
          {modules.map((m, i) => (
            <motion.div key={m.name} {...fadeUp} transition={{ delay: i * 0.05, duration: 0.5 }}>
              <Card className="h-full hover:border-primary/30 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center`}>
                      <m.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-foreground">{m.name}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {m.bullets.map((b) => (
                      <li key={b} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span> {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Intelligence Layer */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="max-w-3xl mx-auto space-y-8">
          <motion.div {...fadeUp} className="text-center space-y-4">
            <h2 className="text-3xl font-bold">The Intelligence Layer</h2>
            <p className="text-muted-foreground">Sitting above everything. Watching everything. Acting on everything.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div {...fadeUp}>
              <Card className="border-rose-500/30 h-full">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
                      <Atom className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">MoneyOS</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    MoneyOS doesn't generate data. It reads <span className="text-foreground font-semibold">EVERYTHING</span> from
                    every module and tells you what's happening, what's about to happen, and what to do about it.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Live P&L updated every transaction</li>
                    <li>• Cross-product correlation engine</li>
                    <li>• What-if simulator with Monte Carlo</li>
                    <li>• Proactive alert system (Reactor)</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeUp}>
              <Card className="border-emerald-500/30 h-full">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Quiet Audit</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A silent audit engine that scores your business across <span className="text-foreground font-semibold">7 modules</span>,
                    24/7, without you lifting a finger.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Weighted scoring: Labour, Food, Bev, Service, Overhead, Marketing, Compliance</li>
                    <li>• Trend tracking with improvement roadmaps</li>
                    <li>• Actionable recommendations per module</li>
                    <li>• External forensic audit capability</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Data Flow */}
      <section className="py-20 px-6 max-w-3xl mx-auto text-center space-y-6">
        <motion.div {...fadeUp}>
          <h2 className="text-3xl font-bold mb-4">How It All Connects</h2>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {modules.slice(0, 5).map((m) => (
                <div key={m.name} className="text-center">
                  <div className={`w-8 h-8 mx-auto rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center`}>
                    <m.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{m.name}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <ArrowDown className="w-5 h-5 text-primary animate-bounce" />
            </div>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
                  <Atom className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-semibold mt-1">MoneyOS</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-semibold mt-1">Quiet Audit</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center bg-primary/5">
        <motion.div {...fadeUp} className="space-y-6 max-w-md mx-auto">
          <h2 className="text-3xl font-bold">Ready to See Everything?</h2>
          <p className="text-muted-foreground">Start with what you need. Scale to everything.</p>
          <Button size="lg" className="gap-2">
            <Mail className="w-4 h-4" /> Talk to Us
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
