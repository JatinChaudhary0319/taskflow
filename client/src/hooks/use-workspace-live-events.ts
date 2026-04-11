import { useCallback, useEffect, useRef, useState } from "react";

import { workspaceStreamUrl } from "@/lib/api";

type Params = {
  token: string | null | undefined;
  /** Debounced refresh (e.g. silent reload of projects list). */
  onWorkspaceEvent: () => void;
};

export function useWorkspaceLiveEvents({ token, onWorkspaceEvent }: Params) {
  const [live, setLive] = useState(false);
  const onEventRef = useRef(onWorkspaceEvent);

  useEffect(() => {
    onEventRef.current = onWorkspaceEvent;
  }, [onWorkspaceEvent]);

  const stableNotify = useCallback(() => {
    onEventRef.current();
  }, []);

  useEffect(() => {
    if (!token) return;

    const url = workspaceStreamUrl(token);
    const es = new EventSource(url);
    let debounce: ReturnType<typeof setTimeout> | undefined;

    es.addEventListener("open", () => setLive(true));

    es.onmessage = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => stableNotify(), 280);
    };

    es.onerror = () => {
      setLive(false);
      es.close();
    };

    return () => {
      clearTimeout(debounce);
      setLive(false);
      es.close();
    };
  }, [token, stableNotify]);

  return { live };
}
