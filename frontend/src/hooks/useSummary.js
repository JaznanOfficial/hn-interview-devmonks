import { useState } from "react";
import { api } from "../api/client.js";

export function useSummary() {
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const summarize = async (storyId, title) => {
    if (summaries[storyId]) return;
    setLoading((p) => ({ ...p, [storyId]: true }));
    setErrors((p) => ({ ...p, [storyId]: null }));
    try {
      const result = await api.summarize(storyId, title);
      setSummaries((p) => ({ ...p, [storyId]: result }));
    } catch (e) {
      setErrors((p) => ({ ...p, [storyId]: e.message }));
    } finally {
      setLoading((p) => ({ ...p, [storyId]: false }));
    }
  };

  return {
    getSummary: (id) => summaries[id],
    isLoading: (id) => !!loading[id],
    getError: (id) => errors[id],
    summarize,
    clear: (id) => setSummaries((p) => { const n = { ...p }; delete n[id]; return n; }),
  };
}
