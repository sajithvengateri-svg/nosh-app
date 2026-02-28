"use client";

import React from "react";
import { MapPin, ExternalLink, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProposalVenueMapProps {
  venueName: string;
  address: string | null;
  parkingNotes: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProposalVenueMap({
  venueName,
  address,
  parkingNotes,
}: ProposalVenueMapProps) {
  return (
    <section className="space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Getting There</h2>
      </div>

      {/* Venue card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{venueName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address */}
          {address && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-base font-medium leading-relaxed">
                  {address}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={buildMapsUrl(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Maps
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Parking notes */}
          {parkingNotes && (
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4",
                "dark:border-blue-900 dark:bg-blue-950/30",
              )}
            >
              <Car className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Parking
                </p>
                <p className="mt-0.5 text-sm text-blue-800 dark:text-blue-400">
                  {parkingNotes}
                </p>
              </div>
            </div>
          )}

          {/* Fallback when no address */}
          {!address && (
            <p className="text-sm text-muted-foreground">
              Address details will be shared closer to the event.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
