import { useCallback, useState } from "react";

/**
 * Tracks overlapping async mutations so UI can disable actions while any request is in flight.
 * Does not replace loading spinners for initial fetch — use only for mutations.
 */
export function useMutationRun() {
  const [pending, setPending] = useState(0);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setPending((n) => n + 1);
    try {
      return await fn();
    } finally {
      setPending((n) => Math.max(0, n - 1));
    }
  }, []);

  return { run, busy: pending > 0 };
}
