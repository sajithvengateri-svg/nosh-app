"use client";

import React, { useRef } from "react";
import { differenceInDays, format } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaItem {
  url: string;
  media_type: "image" | "video";
  caption: string | null;
}

interface ProposalHeroProps {
  headline: string | null;
  subheadline: string | null;
  eventDate: string;
  venueName: string;
  venueLogoUrl: string | null;
  mediaItems: Array<MediaItem>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCountdown(eventDate: string): string {
  const days = differenceInDays(new Date(eventDate), new Date());
  if (days < 0) return "Event has passed";
  if (days === 0) return "Today!";
  if (days === 1) return "1 day to go";
  return `${days} days to go`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProposalHero({
  headline,
  subheadline,
  eventDate,
  venueName,
  venueLogoUrl,
  mediaItems,
}: ProposalHeroProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasMedia = mediaItems.length > 0;
  const firstMedia = mediaItems[0] ?? null;
  const imageItems = mediaItems.filter((m) => m.media_type === "image");
  const isCarousel = imageItems.length > 1;

  const scrollBy = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const formattedDate = format(new Date(eventDate), "EEEE, MMMM d, yyyy");
  const countdown = formatCountdown(eventDate);

  return (
    <section className="relative w-full overflow-hidden min-h-[70vh]">
      {/* ---------- Background ---------- */}
      {hasMedia ? (
        <>
          {isCarousel ? (
            /* Carousel of images */
            <div className="relative">
              <div
                ref={scrollRef}
                className="flex min-h-[70vh] snap-x snap-mandatory overflow-x-auto scroll-smooth"
                style={{ scrollbarWidth: "none" }}
              >
                {imageItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="h-full min-h-[70vh] w-full flex-shrink-0 snap-center"
                  >
                    <img
                      src={item.url}
                      alt={item.caption ?? `Venue photo ${idx + 1}`}
                      className="h-full min-h-[70vh] w-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Carousel controls */}
              <button
                onClick={() => scrollBy("left")}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scrollBy("right")}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : firstMedia?.media_type === "video" ? (
            /* Single video background */
            <video
              src={firstMedia.url}
              autoPlay
              muted
              loop
              playsInline
              className="min-h-[70vh] w-full object-cover"
            />
          ) : (
            /* Single image with Ken Burns effect */
            <div className="min-h-[70vh] w-full overflow-hidden">
              <img
                src={firstMedia!.url}
                alt={firstMedia!.caption ?? "Venue photo"}
                className="min-h-[70vh] w-full object-cover animate-ken-burns"
              />
            </div>
          )}
        </>
      ) : (
        /* No media fallback */
        <div className="min-h-[70vh] w-full bg-gradient-to-br from-vf-navy to-vf-navy/80" />
      )}

      {/* ---------- Gradient overlay ---------- */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5" />

      {/* ---------- Content overlay ---------- */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10">
        {/* Top row: venue logo + name */}
        <div className="flex items-center gap-3">
          {venueLogoUrl && (
            <img
              src={venueLogoUrl}
              alt={`${venueName} logo`}
              className="h-20 w-20 rounded-full border-2 border-white/30 object-cover shadow-xl shadow-black/20"
            />
          )}
          <div>
            <p className="text-sm font-medium text-white/70 uppercase tracking-widest">
              {venueName}
            </p>
          </div>
        </div>

        {/* Bottom row: text content */}
        <div className="space-y-4">
          {headline && (
            <h1 className="text-4xl font-bold leading-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl font-serif">
              {headline}
            </h1>
          )}

          {subheadline && (
            <p className="max-w-2xl text-xl text-white/80 drop-shadow-sm leading-relaxed">
              {subheadline}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-white/90">
              <CalendarDays className="h-4 w-4" />
              {formattedDate}
            </span>

            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
                differenceInDays(new Date(eventDate), new Date()) <= 7
                  ? "bg-amber-500/90 text-white"
                  : "bg-white/20 text-white backdrop-blur-sm",
              )}
            >
              {countdown}
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Scroll indicator ---------- */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <ChevronDown className="h-6 w-6 text-white/50 animate-bounce-subtle" />
      </div>
    </section>
  );
}
