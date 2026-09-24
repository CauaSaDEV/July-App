import { useCallback, useEffect, useState } from "react";
import { getServiceCatalog } from "../services/catalog";

/**
 * Lista serviços do catálogo, com busca textual (debounce de 400ms) via GET /services?q=.
 */
export function useServiceCatalog() {
  const [query, setQuery] = useState("");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async (q) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServiceCatalog(q ? { q } : {});
      setServices(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchServices(query);
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, fetchServices]);

  return {
    query,
    setQuery,
    services,
    loading,
    error,
    refetch: () => fetchServices(query),
  };
}