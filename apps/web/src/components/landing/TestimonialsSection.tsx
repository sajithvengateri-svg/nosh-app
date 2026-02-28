import { Star } from "lucide-react";
import { BubbleIn } from "./AnimationWrappers";

const NOSH = {
  primary: "#D94878",
  secondary: "#2A1F2D",
  muted: "#7A6B75",
  textMuted: "#A89DA3",
  card: "#FDFBFC",
  border: "rgba(232,221,226,0.5)",
};

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    location: "Brisbane",
    initials: "SM",
    color: "#D94878",
    quote: "Prep Mi saved us $60 this month just from the vendor deals alone. The QR scanning is so easy.",
    stars: 5,
  },
  {
    name: "James L.",
    location: "Gold Coast",
    initials: "JL",
    color: "#5BA37A",
    quote: "Cook mode is a game changer. I actually cook from real recipes now instead of winging it.",
    stars: 5,
  },
  {
    name: "Priya K.",
    location: "Melbourne",
    initials: "PK",
    color: "#6366F1",
    quote: "The social cooking feature turned our boring Thursday dinners into a weekly event with friends.",
    stars: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 md:py-32 px-4">
      <div className="text-center max-w-lg mx-auto mb-12">
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold"
          style={{ color: NOSH.secondary, fontFamily: "'Playfair Display', serif" }}
        >
          Loved by home cooks
        </h2>
        <p className="mt-3 text-base md:text-lg" style={{ color: NOSH.muted }}>
          Join thousands of people cooking smarter every week.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <BubbleIn key={t.name} delay={i * 0.15}>
            <div
              className="rounded-[20px] p-6 backdrop-blur-[40px] border border-white/40"
              style={{ background: "rgba(255,255,255,0.5)", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current" style={{ color: "#F59E0B" }} />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm leading-relaxed mb-5" style={{ color: NOSH.secondary }}>
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: NOSH.secondary }}>{t.name}</p>
                  <p className="text-xs" style={{ color: NOSH.textMuted }}>{t.location}</p>
                </div>
              </div>
            </div>
          </BubbleIn>
        ))}
      </div>
    </section>
  );
}
