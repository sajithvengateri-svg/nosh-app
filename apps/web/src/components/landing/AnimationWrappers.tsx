import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";

/* ─── Fade-up wrapper ─── */
export const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── Bubble-in wrapper (scale + fade with spring) ─── */
export const BubbleIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.6 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ type: "spring", stiffness: 260, damping: 20, delay }}
    whileHover={{ scale: 1.05 }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── Slide-from wrapper ─── */
export const SlideFrom = ({ children, direction = "left", delay = 0, className = "" }: { children: React.ReactNode; direction?: "left" | "right"; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, x: direction === "left" ? -60 : 60 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.7, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── Count-up hook ─── */
export const useCountUp = (target: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [start]);

  return { count, ref };
};

/* ─── Animated stat (parses "67%" → count-up 67 + "%" suffix) ─── */
export const AnimatedStat = ({ stat }: { stat: string }) => {
  const match = stat.match(/^([^0-9]*)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return <p className="text-3xl font-bold text-destructive">{stat}</p>;

  const prefix = match[1];
  const num = parseFloat(match[2]);
  const suffix = match[3];
  const isDecimal = match[2].includes(".");
  const { count, ref } = useCountUp(isDecimal ? Math.round(num * 10) : num);
  const display = isDecimal ? (count / 10).toFixed(1) : count.toLocaleString();

  return (
    <p className="text-3xl font-bold text-destructive">
      <span ref={ref}>{prefix}{display}{suffix}</span>
    </p>
  );
};

/* ─── Empty state ─── */
export const EmptyHint = ({ label }: { label: string }) => (
  <p className="text-sm text-muted-foreground/60 text-center py-8">
    No {label} yet — add them from the admin panel.
  </p>
);

/* ─── Metric Counter ─── */
export const MetricCounter = ({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) => {
  const { count, ref } = useCountUp(value);
  return (
    <FadeUp delay={delay}>
      <div>
        <span ref={ref} className="text-4xl font-bold text-primary">
          {count.toLocaleString()}{suffix}
        </span>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </FadeUp>
  );
};
