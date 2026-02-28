import { useState } from "react";
import { supabase } from "../lib/supabase";

type ScannerState = "idle" | "capturing" | "processing" | "results" | "error";

// Edge functions use different parameter names for the base64 image
const PARAM_MAP: Record<string, string> = {
  "extract-invoice": "image_base64",
  "scan-docket": "image_base64",
  "read-temp-display": "image_base64",
  "scan-ingredient": "imageBase64",
  "scan-asset-label": "imageBase64",
  "extract-ingredients-list": "image_base64",
};

export function useScanner<T = any>(edgeFunctionName: string) {
  const [state, setState] = useState<ScannerState>("idle");
  const [results, setResults] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = async (base64Image: string, extraBody?: Record<string, any>) => {
    setState("processing");
    setError(null);
    try {
      const paramKey = PARAM_MAP[edgeFunctionName] || "image_base64";
      const body: Record<string, any> = {
        [paramKey]: base64Image,
        file_type: "image/jpeg",
        ...extraBody,
      };

      const { data, error: fnError } = await supabase.functions.invoke(edgeFunctionName, { body });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const parsed = data?.data ?? data;
      setResults(parsed as T);
      setState("results");
      return parsed as T;
    } catch (e: any) {
      const msg = e.message || "Scan failed";
      setError(msg);
      setState("error");
      throw e;
    }
  };

  const reset = () => {
    setState("idle");
    setResults(null);
    setError(null);
  };

  return { state, scan, results, error, reset, scanning: state === "processing" };
}
