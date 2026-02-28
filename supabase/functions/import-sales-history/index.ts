import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    values.push(current.trim());
    return values;
  });
  return { headers, rows };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { orgId, fileBase64, fileName } = await req.json();
    if (!orgId || !fileBase64) throw new Error("Missing orgId or fileBase64");

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    // Decode base64 CSV
    const decoded = atob(fileBase64);
    const { headers, rows } = parseCSV(decoded);

    if (rows.length === 0) throw new Error("CSV file is empty");

    // Find column indexes (flexible naming)
    const dateIdx = headers.findIndex((h) => ["date", "sale_date", "order_date"].includes(h));
    const itemIdx = headers.findIndex((h) => ["item_name", "item", "name", "dish", "product"].includes(h));
    const qtyIdx = headers.findIndex((h) => ["quantity_sold", "quantity", "qty", "sold", "count"].includes(h));
    const revIdx = headers.findIndex((h) => ["revenue", "total", "amount", "sales"].includes(h));
    const coversIdx = headers.findIndex((h) => ["covers", "pax", "guests"].includes(h));

    if (dateIdx === -1 || itemIdx === -1) {
      throw new Error("CSV must have 'date' and 'item_name' columns. Found: " + headers.join(", "));
    }

    // Create import record
    const { data: importRecord, error: importErr } = await serviceClient
      .from("data_imports")
      .insert({
        org_id: orgId,
        source_type: "manual",
        data_type: "sales_history",
        status: "received",
        metadata: { file_name: fileName, row_count: rows.length, headers },
      })
      .select("id")
      .single();

    if (importErr) throw importErr;
    const importId = importRecord.id;

    // Parse rows and batch insert
    const salesRows: any[] = [];
    const errors: string[] = [];
    let minDate = "9999-99-99";
    let maxDate = "0000-00-00";
    const uniqueItems = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const date = row[dateIdx]?.trim();
      const item = row[itemIdx]?.trim();
      const qty = qtyIdx >= 0 ? parseInt(row[qtyIdx]) : 1;
      const rev = revIdx >= 0 ? parseFloat(row[revIdx]) : 0;
      const cov = coversIdx >= 0 ? parseInt(row[coversIdx]) : 0;

      if (!date || !item) { errors.push(`Row ${i + 2}: missing date or item`); continue; }
      if (isNaN(qty) || qty <= 0) { errors.push(`Row ${i + 2}: invalid quantity`); continue; }

      // Normalize date to YYYY-MM-DD
      let normalizedDate = date;
      if (date.includes("/")) {
        const parts = date.split("/");
        if (parts.length === 3) {
          // Try DD/MM/YYYY and MM/DD/YYYY
          const [a, b, c] = parts;
          normalizedDate = c.length === 4 ? `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}` : date;
        }
      }

      if (normalizedDate < minDate) minDate = normalizedDate;
      if (normalizedDate > maxDate) maxDate = normalizedDate;
      uniqueItems.add(item);

      salesRows.push({
        org_id: orgId,
        sale_date: normalizedDate,
        item_name: item,
        quantity_sold: qty,
        revenue: isNaN(rev) ? 0 : rev,
        covers: isNaN(cov) ? 0 : cov,
        source: "manual",
        import_id: importId,
      });
    }

    // Batch insert (chunks of 500)
    let inserted = 0;
    for (let i = 0; i < salesRows.length; i += 500) {
      const chunk = salesRows.slice(i, i + 500);
      const { error: insertErr } = await serviceClient
        .from("historical_sales_daily")
        .upsert(chunk, { onConflict: "org_id,sale_date,item_name,source" });
      if (insertErr) {
        errors.push(`Batch ${Math.floor(i / 500) + 1}: ${insertErr.message}`);
      } else {
        inserted += chunk.length;
      }
    }

    // Update import status
    await serviceClient
      .from("data_imports")
      .update({
        status: "processed",
        metadata: { file_name: fileName, rows_imported: inserted, date_range: `${minDate} to ${maxDate}`, unique_items: uniqueItems.size, errors: errors.slice(0, 10) },
      })
      .eq("id", importId);

    return new Response(JSON.stringify({
      rows_imported: inserted,
      date_range: { start: minDate, end: maxDate },
      unique_items: uniqueItems.size,
      errors: errors.slice(0, 10),
      import_id: importId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-sales-history error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
