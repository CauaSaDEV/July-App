import { useCallback, useEffect, useState } from "react";
import { getClients } from "../services/clients";

/**
 * Lista clientes, com busca textual (debounce de 400ms) via GET /clients?q=.
 */
export function useClients() {
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClients = useCallback(async (q) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClients(q ? { q } : {});
      setClients(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchClients(query);
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, fetchClients]);

  return {
    query,
    setQuery,
    clients,
    loading,
    error,
    refetch: () => fetchClients(query),
  };
}