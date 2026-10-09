import { useCallback, useEffect, useState } from "react";
import { getAppointments } from "../services/appointments";
import { getCurrentWeekRange, toDateKey, todayDateKey } from "../utils/date";

/**
 * Agrega os dados dos agendamentos usados na Home.
 * - Busca a semana inteira (segunda a domingo)
 * - Cards de métricas continuam contando só o dia de hoje
 * - Lista "Agendamentos da Semana" mostra a semana
 *
 * @param {string | undefined} role role do usuário autenticado (vem do useAuth)
 */
export function useHomeData(role) {
  const [weekAppointments, setWeekAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getCurrentWeekRange();
      const data = await getAppointments({ start, end });
      setWeekAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("[useHomeData] Erro ao carregar agendamentos:", err);
      setError(err);
      setWeekAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (role !== undefined && role !== null) {
      fetchData();
    }
  }, [fetchData, role]);

  const safeWeek = Array.isArray(weekAppointments) ? weekAppointments : [];

  // Só os de hoje -> usados nos cards "hoje"
  const today = todayDateKey();
  const todayAppointments = safeWeek.filter(
    (a) => a?.startAt && toDateKey(a.startAt) === today,
  );

  const scheduledCount = todayAppointments.filter(
    (a) => a?.status === "SCHEDULED",
  ).length;
  const doneCount = todayAppointments.filter(
    (a) => a?.status === "DONE",
  ).length;
  const canceledCount = todayAppointments.filter(
    (a) => a?.status === "CANCELED",
  ).length;
  const pendingCount = todayAppointments.filter(
    (a) => a?.status === "PENDING",
  ).length;

  // Semana inteira -> usada na lista da semana
  const nextAppointments = safeWeek
    .filter((a) => a?.status === "SCHEDULED")
    .sort((a, b) => new Date(a?.startAt) - new Date(b?.startAt));

  return {
    appointments: todayAppointments, // mantém o nome para não quebrar a Home
    weekAppointments: safeWeek,
    nextAppointments,
    scheduledCount,
    doneCount,
    canceledCount,
    pendingCount,
    loading,
    error,
    role,
    refetch: fetchData,
  };
}
