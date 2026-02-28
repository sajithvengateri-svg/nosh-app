"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Phone, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavLink {
  id: string;
  label: string;
}

interface ProposalTopBarProps {
  venueName: string;
  venueLogoUrl: string | null;
  phone: string | null;
  navLinks: NavLink[];
  showAcceptCta: boolean;
  onAcceptClick: () => void;
}

export default function ProposalTopBar({
  venueName,
  venueLogoUrl,
  phone,
  navLinks,
  showAcceptCta,
  onAcceptClick,
}: ProposalTopBarProps) {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Show bar after scrolling past hero
  useEffect(() => {
    const hero = document.getElementById("proposal-hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  // Track active section
  useEffect(() => {
    const ids = navLinks.map((l) => l.id);
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-30% 0px -60% 0px" },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [navLinks]);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none",
      )}
    >
      <div className="backdrop-blur-md bg-white/95 border-b border-vf-gold/10 shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left: logo + name */}
          <div className="flex items-center gap-2.5 min-w-0">
            {venueLogoUrl && (
              <img
                src={venueLogoUrl}
                alt={`${venueName} logo`}
                className="h-8 w-8 rounded-full object-cover border border-vf-gold/20"
              />
            )}
            <span className="text-sm font-semibold text-vf-navy truncate">
              {venueName}
            </span>
          </div>

          {/* Center: nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                  activeSection === link.id
                    ? "bg-vf-gold/10 text-vf-gold"
                    : "text-gray-500 hover:text-vf-navy hover:bg-gray-100",
                )}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right: phone + CTA */}
          <div className="flex items-center gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-vf-navy transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                {phone}
              </a>
            )}
            {showAcceptCta && (
              <Button
                size="sm"
                onClick={onAcceptClick}
                className="bg-vf-gold hover:bg-vf-gold/90 text-white text-xs h-8 px-4"
              >
                Accept Proposal
              </Button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 text-gray-500"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={cn(
                  "block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                  activeSection === link.id
                    ? "bg-vf-gold/10 text-vf-gold font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                {link.label}
              </button>
            ))}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
