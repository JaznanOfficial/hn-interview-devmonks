import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client.js";

export function useStories() {
  const [feed, setFeed] = useState("top");
  const [page, setPage] = useState(1);
  const [stories, setStories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStories(feed, page);
      setStories(data.stories);
      setTotal(data.total);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [feed, page]);

  useEffect(() => { load(); }, [load]);

  const changeFeed = (f) => { setFeed(f); setPage(1); };

  return { stories, total, loading, error, feed, page, changeFeed, setPage, pageSize: 20 };
}
