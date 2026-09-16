import { useEffect, useState, useCallback } from "react";
import { getMe } from "../services/Auth";

/**
 * Hook para acessar os dados do usuário autenticado (nome, role, etc.)
 * sem depender do email.
 *
 * Uso:
 *   const { user, loading, error, refetch } = useAuth();
 *   user?.name, user?.role
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMe();
      setUser(data);
    } catch (err) {
      setError(err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, refetch: fetchUser };
}