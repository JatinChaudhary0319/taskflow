import { useEffect, useRef, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import toast from "react-hot-toast";

import { taskEventsStreamUrl } from "@/lib/api";

type Params = {
  projectId: string | undefined;
  token: string | null | undefined;
  navigate: NavigateFunction;
  /** Debounced refetch (e.g. load project); must not bump global mutation locks. */
  onTaskEvent: () => void;
};

export function useProjectLiveEvents({ projectId, token, navigate, onTaskEvent }: Params) {
  const [live, setLive] = useState(false);
  const onTaskEventRef = useRef(onTaskEvent);

  useEffect(() => {
    onTaskEventRef.current = onTaskEvent;
  }, [onTaskEvent]);

  useEffect(() => {
    if (!projectId || !token) return;

    const url = taskEventsStreamUrl(projectId, token);
    const es = new EventSource(url);
    let debounce: ReturnType<typeof setTimeout> | undefined;

    es.addEventListener("open", () => setLive(true));

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as { type?: string };
        if (data.type === "project_deleted") {
          toast.error("This project was deleted");
          es.close();
          navigate("/projects", { replace: true });
          return;
        }
      } catch {
        /* ignore malformed */
      }
      clearTimeout(debounce);
      debounce = setTimeout(() => onTaskEventRef.current(), 280);
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
  }, [projectId, token, navigate]);

  return { live };
}
