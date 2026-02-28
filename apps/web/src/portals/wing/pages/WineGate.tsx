import { motion } from "framer-motion";
import { Wine, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useWingStore } from "../stores/wingStore";

const WineGate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasCompletedAssessment } = useWingStore();

  useEffect(() => {
    if (user) {
      navigate(hasCompletedAssessment ? '/wing/lobby' : '/wing/palate');
    }
  }, [user, hasCompletedAssessment, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{ background: '#1C1C1C' }}>
      {/* Background image with Ken Burns effect */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1920&h=1080&fit=crop"
          alt="Vineyard"
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
          style={{ filter: 'brightness(0.35)' }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(28,28,28,0.3) 0%, rgba(28,28,28,0.6) 50%, rgba(28,28,28,0.95) 100%)',
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <Wine className="w-10 h-10 mx-auto mb-6" style={{ color: '#C9A96E' }} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-7xl font-bold mb-4 tracking-tight"
          style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}
        >
          The Private Wing
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="h-px w-32 mx-auto mb-6"
          style={{ background: 'linear-gradient(90deg, transparent, #C9A96E, transparent)' }}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl mb-12 leading-relaxed"
          style={{ color: '#F5F0EB99', fontFamily: "'DM Sans', sans-serif" }}
        >
          Your private cellar, curated by an AI sommelier who knows your palate.
          <br className="hidden md:block" />
          The best wines, reserved for those who appreciate them.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Link
            to="/auth"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #C9A96E, #D4BA8A)',
              color: '#1C1C1C',
              boxShadow: '0 8px 32px rgba(201,169,110,0.3)',
            }}
          >
            Request Access to the Private Cellar
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-8 text-xs tracking-widest uppercase"
          style={{ color: '#F5F0EB44' }}
        >
          By invitation or application only
        </motion.p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, #1C1C1C, transparent)' }} />
    </div>
  );
};

export default WineGate;
