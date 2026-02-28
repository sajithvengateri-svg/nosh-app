"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface ProposalUpsellBannerProps {
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
}

export default function ProposalUpsellBanner({
  title,
  description,
  ctaText,
  ctaUrl,
}: ProposalUpsellBannerProps) {
  return (
    <section className="bg-gradient-to-r from-vf-gold/5 via-vf-cream to-vf-gold/5 border-y border-vf-gold/10">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10 text-center space-y-4">
        <div className="inline-flex items-center gap-2 text-vf-gold">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">
            Special Offer
          </span>
        </div>

        <h3 className="text-2xl font-bold text-vf-navy sm:text-3xl">
          {title}
        </h3>

        <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
          {description}
        </p>

        {ctaText && ctaUrl && (
          <div className="pt-2">
            <Button
              asChild
              className="bg-vf-gold hover:bg-vf-gold/90 text-white"
            >
              <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
                {ctaText}
              </a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
