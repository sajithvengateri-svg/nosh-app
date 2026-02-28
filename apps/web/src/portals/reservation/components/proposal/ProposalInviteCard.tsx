"use client";

import React, { useCallback, useState } from "react";
import { format } from "date-fns";
import { Share2, Copy, Check, MapPin, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProposalInviteCardProps {
  eventName: string;
  eventDate: string;
  venueName: string;
  venueAddress: string | null;
  message: string | null;
  shareUrl: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProposalInviteCard({
  eventName,
  eventDate,
  venueName,
  venueAddress,
  message,
  shareUrl,
}: ProposalInviteCardProps) {
  const [copied, setCopied] = useState(false);

  const formattedDate = format(new Date(eventDate), "EEEE, MMMM d, yyyy");

  const handleShare = useCallback(async () => {
    const shareData: ShareData = {
      title: eventName,
      text: `You're invited to ${eventName} at ${venueName} on ${formattedDate}`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed -- fall through silently
      }
    } else {
      // Fallback: copy to clipboard
      await handleCopyLink();
    }
  }, [eventName, venueName, formattedDate, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [shareUrl]);

  return (
    <section className="space-y-8">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br from-vf-navy to-vf-navy/90 p-8 shadow-xl",
          "sm:p-10",
        )}
      >
        {/* Decorative background circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/5" />

        {/* Content */}
        <div className="relative z-10 space-y-6">
          {/* Event name */}
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {eventName}
          </h2>

          {/* Date */}
          <div className="flex items-center gap-2 text-white/80">
            <CalendarDays className="h-5 w-5" />
            <span className="text-lg font-medium">{formattedDate}</span>
          </div>

          {/* Venue */}
          <div className="space-y-1">
            <p className="text-lg font-semibold text-white">{venueName}</p>
            {venueAddress && (
              <div className="flex items-start gap-2 text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{venueAddress}</span>
              </div>
            )}
          </div>

          {/* Custom message */}
          {message && (
            <div className="rounded-lg border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
              <p className="text-sm italic leading-relaxed text-white/90">
                &ldquo;{message}&rdquo;
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleShare}
              className="bg-white text-vf-navy hover:bg-white/90"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
