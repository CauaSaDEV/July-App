import { useCallback, useEffect, useState } from "react";
import { getUsers } from "../services/users";

/**
 * Lista usuários com busca (debounce de 400ms) via GET /users?q=.
 * @param {boolean} enabled só busca se true (evita 403 para STAFF)
 */
export function useUsers(enabled = true) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async (q) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers(q ? { q } : {});
      setUsers(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timeout = setTimeout(() => fetchUsers(query), 400);
    return () => clearTimeout(timeout);
  }, [query, enabled, fetchUsers]);

  return { query, setQuery, users, loading, error, refetch: () => fetchUsers(query) };
}