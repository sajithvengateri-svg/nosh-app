import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, org_id } = await req.json();

    if (!org_id) {
      return new Response(JSON.stringify({ error: "org_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUrl = url || "https://brisbanepowerhouse.org/whats-on/";

    // Fetch the webpage
    const pageRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ResOS/1.0; show-sync)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!pageRes.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch ${targetUrl}: ${pageRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await pageRes.text();

    // Parse shows from HTML
    // This is a generic parser that tries multiple common patterns
    const shows: Array<{
      title: string;
      show_date: string;
      curtain_time: string;
      doors_time?: string;
      end_time?: string;
      venue_name?: string;
      genre?: string;
      external_id?: string;
    }> = [];

    // Strategy 1: JSON-LD structured data (many event sites use this)
    const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(match[1]);
        const events = Array.isArray(jsonData) ? jsonData : jsonData["@graph"] || [jsonData];
        for (const event of events) {
          if (event["@type"] === "Event" || event["@type"] === "TheaterEvent" || event["@type"] === "MusicEvent") {
            const startDate = event.startDate ? new Date(event.startDate) : null;
            if (!startDate || isNaN(startDate.getTime())) continue;

            shows.push({
              title: event.name || "Untitled",
              show_date: startDate.toISOString().split("T")[0],
              curtain_time: startDate.toTimeString().slice(0, 5) + ":00",
              end_time: event.endDate ? new Date(event.endDate).toTimeString().slice(0, 5) + ":00" : undefined,
              venue_name: event.location?.name || undefined,
              genre: event.genre || event.additionalType || undefined,
              external_id: event.identifier || event.url || undefined,
            });
          }
        }
      } catch {
        // Invalid JSON-LD, skip
      }
    }

    // Strategy 2: Common HTML patterns for event listings
    if (shows.length === 0) {
      // Look for common event card patterns
      // Brisbane Powerhouse specific: articles with event data
      const eventPatterns = [
        // Pattern: <article> or <div class="event"> with h2/h3 title and date
        /<(?:article|div)[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div)>/gi,
        // Pattern: list items with event info
        /<li[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
      ];

      for (const pattern of eventPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const block = match[1];

          // Extract title
          const titleMatch = block.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
          const title = titleMatch
            ? titleMatch[1].replace(/<[^>]*>/g, "").trim()
            : null;

          // Extract date (look for various date formats)
          const dateMatch = block.match(
            /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4})/i
          ) || block.match(/(\d{4}-\d{2}-\d{2})/) || block.match(
            /(?:date|when)[^>]*>([^<]+)/i
          );

          // Extract time
          const timeMatch = block.match(/(\d{1,2}[:\.]\d{2}\s*(?:am|pm|AM|PM))/i)
            || block.match(/(\d{1,2}:\d{2})/);

          if (title && dateMatch) {
            let dateStr = dateMatch[1].trim();
            // Try to parse the date
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
              dateStr = parsed.toISOString().split("T")[0];
            } else {
              continue; // Skip unparseable dates
            }

            let curtainTime = "19:30:00"; // Default
            if (timeMatch) {
              let t = timeMatch[1].trim();
              // Convert 12h to 24h
              if (/pm/i.test(t)) {
                const parts = t.replace(/\s*(am|pm)/i, "").split(/[:\.]/);
                let h = parseInt(parts[0]);
                if (h < 12) h += 12;
                curtainTime = `${h}:${parts[1] || "00"}:00`;
              } else if (/am/i.test(t)) {
                const parts = t.replace(/\s*(am|pm)/i, "").split(/[:\.]/);
                curtainTime = `${parts[0].padStart(2, "0")}:${parts[1] || "00"}:00`;
              } else {
                curtainTime = t.length === 5 ? t + ":00" : t;
              }
            }

            shows.push({
              title,
              show_date: dateStr,
              curtain_time: curtainTime,
              external_id: `scraped_${dateStr}_${title.slice(0, 20).replace(/\W/g, "_")}`,
            });
          }
        }
      }
    }

    // Filter to only future shows (next 30 days)
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const futureShows = shows.filter(
      (s) => s.show_date >= today && s.show_date <= thirtyDaysOut
    );

    // Upsert into res_shows
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    let upsertedCount = 0;
    for (const show of futureShows) {
      const { error } = await sb.from("res_shows").upsert(
        {
          org_id,
          external_id: show.external_id || null,
          title: show.title,
          venue_name: show.venue_name || null,
          show_date: show.show_date,
          doors_time: show.doors_time || null,
          curtain_time: show.curtain_time,
          end_time: show.end_time || null,
          genre: show.genre || null,
          source: "website",
          source_url: targetUrl,
          is_suggestion: true,
          is_active: true,
        },
        { onConflict: "org_id,external_id" }
      );
      if (!error) upsertedCount++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_found: shows.length,
        future_shows: futureShows.length,
        upserted: upsertedCount,
        source_url: targetUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
