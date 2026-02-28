import { Link } from "react-router-dom";
import { ChefHat, Store } from "lucide-react";

export function NoshFooter() {
  return (
    <footer className="py-16 px-4" style={{ background: "#FBF6F8" }}>
      <div className="max-w-4xl mx-auto">
        {/* Cross-links */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <Link
            to="/nosh"
            className="p-6 rounded-[20px] flex items-center gap-4 transition-all hover:scale-[1.02]"
            style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(232,221,226,0.5)" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#D9487815" }}>
              <ChefHat className="w-6 h-6" style={{ color: "#D94878" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#2A1F2D" }}>NOSH for Foodies</p>
              <p className="text-xs" style={{ color: "#7A6B75" }}>Recipes, deals, social cooking</p>
            </div>
          </Link>
          <Link
            to="/nosh/vendors"
            className="p-6 rounded-[20px] flex items-center gap-4 transition-all hover:scale-[1.02]"
            style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(232,221,226,0.5)" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#5BA37A15" }}>
              <Store className="w-6 h-6" style={{ color: "#5BA37A" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#2A1F2D" }}>NOSH for Vendors</p>
              <p className="text-xs" style={{ color: "#7A6B75" }}>Heatmaps, deals, analytics</p>
            </div>
          </Link>
        </div>

        {/* Bottom */}
        <div className="text-center space-y-3">
          <p className="text-xl font-bold tracking-[6px]" style={{ color: "#D94878" }}>NOSH</p>
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: "#A89DA3" }}>
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/faq" className="hover:underline">FAQ</Link>
          </div>
          <p className="text-[10px]" style={{ color: "#A89DA3" }}>
            &copy; {new Date().getFullYear()} NOSH. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
