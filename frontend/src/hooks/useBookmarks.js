import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client.js";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBookmarks(query);
      setBookmarks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const isBookmarked = (id) => bookmarks.some((b) => b.hn_id === id);

  const toggle = async (story) => {
    if (isBookmarked(story.id)) {
      await api.removeBookmark(story.id);
    } else {
      await api.addBookmark(story);
    }
    load();
  };

  const remove = async (hnId) => {
    await api.removeBookmark(hnId);
    load();
  };

  return { bookmarks, query, setQuery, loading, isBookmarked, toggle, remove, refresh: load };
}
