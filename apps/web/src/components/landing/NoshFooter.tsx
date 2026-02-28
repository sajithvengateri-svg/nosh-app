import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Youtube, Mail } from "lucide-react";
import noshLogo from "@/assets/nosh-logo.png";

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

const SOCIAL_LINKS = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "X (Twitter)" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export function NoshFooter() {
  return (
    <footer className="py-16 px-4" style={{ background: "#FBF6F8" }}>
      <div className="max-w-5xl mx-auto">
        {/* Top: Logo + columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/nosh" className="flex items-center gap-2 mb-3">
              <img src={noshLogo} alt="Prep Mi" className="w-8 h-8 rounded-lg" />
              <span className="text-lg font-bold tracking-[4px]" style={{ color: "#D94878" }}>
                Prep Mi
              </span>
            </Link>
            <p className="text-xs leading-relaxed" style={{ color: "#7A6B75" }}>
              Cook smarter. Spend less. Eat better.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-4">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(217,72,120,0.08)" }}
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" style={{ color: "#D94878" }} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#2A1F2D" }}>
              Product
            </h4>
            <ul className="space-y-2">
              {[
                { label: "How It Works", id: "how-it-works" },
                { label: "Deals", id: "deals" },
                { label: "Recipes", id: "recipes" },
                { label: "Pricing", id: "pricing" },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollTo(link.id)}
                    className="text-xs hover:underline"
                    style={{ color: "#7A6B75" }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#2A1F2D" }}>
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-xs hover:underline" style={{ color: "#7A6B75" }}>
                  About
                </Link>
              </li>
              <li>
                <button
                  onClick={() => scrollTo("faq")}
                  className="text-xs hover:underline"
                  style={{ color: "#7A6B75" }}
                >
                  FAQ
                </button>
              </li>
              <li>
                <Link to="/nosh/vendors" className="text-xs hover:underline" style={{ color: "#7A6B75" }}>
                  For Vendors
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@prepmi.app"
                  className="text-xs hover:underline inline-flex items-center gap-1"
                  style={{ color: "#7A6B75" }}
                >
                  <Mail className="w-3 h-3" />
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#2A1F2D" }}>
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-xs hover:underline" style={{ color: "#7A6B75" }}>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-xs hover:underline" style={{ color: "#7A6B75" }}>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t mb-6" style={{ borderColor: "rgba(232,221,226,0.5)" }} />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px]" style={{ color: "#A89DA3" }}>
            &copy; {new Date().getFullYear()} Prep Mi. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px]" style={{ color: "#A89DA3" }}>
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <button onClick={() => scrollTo("faq")} className="hover:underline">FAQ</button>
            <a href="mailto:hello@prepmi.app" className="hover:underline">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
