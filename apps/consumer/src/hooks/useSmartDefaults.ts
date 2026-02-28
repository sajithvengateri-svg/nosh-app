import { useEffect, useRef, useState } from "react";
import {
  buildSmartDefaults,
  type SmartDefaults,
} from "../lib/engines/smartDefaultsEngine";

/**
 * Loads smart defaults once on mount.
 * Caches result so multiple consumers don't re-fetch.
 */
export function useSmartDefaults() {
  const [defaults, setDefaults] = useState<SmartDefaults | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    buildSmartDefaults().then((d) => {
      setDefaults(d);
      setIsLoaded(true);
    });
  }, []);

  return { defaults, isLoaded };
}
