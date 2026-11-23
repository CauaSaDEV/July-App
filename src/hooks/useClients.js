import { useCallback, useEffect, useRef, useState } from "react";
import { getClients } from "../services/clients";

export function useClients() {
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const fetchClients = useCallback(async (q) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await getClients(q ? { q } : {});
      if (id !== requestId.current) return; // resposta antiga, ignora
      setClients(data);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    const delay = q ? 400 : 0; // busca vazia carrega na hora
    const timeout = setTimeout(() => fetchClients(q), delay);
    return () => clearTimeout(timeout);
  }, [query, fetchClients]);

  // ao desmontar, invalida qualquer requisição pendente
  useEffect(() => {
    return () => {
      requestId.current++;
    };
  }, []);

  const refetch = useCallback(() => fetchClients(query.trim()), [fetchClients, query]);

  return { query, setQuery, clients, loading, error, refetch };
}