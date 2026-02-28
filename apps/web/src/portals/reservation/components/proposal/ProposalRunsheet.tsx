"use client";

import React from "react";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RunsheetItem {
  time: string;
  activity: string;
  notes: string;
}

interface ProposalRunsheetProps {
  runsheet: Array<RunsheetItem>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProposalRunsheet({ runsheet }: ProposalRunsheetProps) {
  if (runsheet.length === 0) return null;

  return (
    <section className="space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <CalendarClock className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Your Day</h2>
      </div>

      {/* Timeline */}
      <div className="relative ml-4 space-y-0">
        {runsheet.map((item, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === runsheet.length - 1;

          return (
            <div key={idx} className="relative flex gap-6 pb-8 last:pb-0">
              {/* Connecting line */}
              {!isLast && (
                <div
                  className="absolute left-[7px] top-[18px] w-px bg-border"
                  style={{ height: "calc(100% - 2px)" }}
                />
              )}

              {/* Dot */}
              <div className="relative z-10 flex-shrink-0 pt-0.5">
                <div
                  className={cn(
                    "h-[15px] w-[15px] rounded-full border-2",
                    isFirst
                      ? "border-primary bg-primary"
                      : "border-border bg-background",
                  )}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-1 pt-0">
                <div className="flex flex-wrap items-baseline gap-3">
                  <time className="flex-shrink-0 font-mono text-sm font-bold tracking-wide text-foreground">
                    {item.time}
                  </time>
                  <h3 className="text-base font-medium text-foreground">
                    {item.activity}
                  </h3>
                </div>
                {item.notes && (
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
