import { useCallback, useEffect, useState } from "react";
import { getAppointments } from "../services/appointments";

/**
 * Agrega os dados dos agendamentos usados na Home.
 *
 * @param {string | undefined} role role do usuário autenticado (vem do useAuth)
 */
export function useHomeData(role) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    console.log("[useHomeData] Disparando busca de agendamentos (role atual:", role, ")");
    setLoading(true);
    setError(null);

    try {
      const data = await getAppointments();

      console.log("[useHomeData] Agendamentos recebidos com sucesso.");
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("[useHomeData] Erro capturado ao carregar agendamentos:", err);
      setError(err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (role !== undefined && role !== null) {
      fetchData();
    }
  }, [fetchData, role]);

  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  const scheduledCount = safeAppointments.filter((a) => a?.status === "SCHEDULED").length;
  const doneCount = safeAppointments.filter((a) => a?.status === "DONE").length;
  const canceledCount = safeAppointments.filter((a) => a?.status === "CANCELED").length;

  const nextAppointments = safeAppointments
    .filter((a) => a?.status === "SCHEDULED")
    .sort((a, b) => new Date(a?.startAt) - new Date(b?.startAt));

  return {
    appointments: safeAppointments,
    nextAppointments,
    scheduledCount,
    doneCount,
    canceledCount,
    loading,
    error,
    role,
    refetch: fetchData,
  };
}