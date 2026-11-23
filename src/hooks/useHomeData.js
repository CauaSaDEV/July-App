import { useCallback, useEffect, useState } from "react";
import { getAppointments } from "../services/appointments";
import { getCurrentMonthRange, getCurrentWeekRange, getCurrentDayRange, toDateKey, todayDateKey } from "../utils/date";

function getRangeByViewMode(viewMode) {
  if (viewMode === "DAY"){
    return getCurrentDayRange();
}

if (viewMode === "MONTH"){
  return getCurrentMonthRange();
}

return getCurrentWeekRange();
}


export function useHomeData(role, viewMode = "WEEK") {
  const [periodAppointments, setPeriodAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getRangeByViewMode(viewMode);
      const data = await getAppointments({ start, end });
      setPeriodAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("[useHomeData] Erro ao carregar agendamentos:", err);
      setError(err);
      setPeriodAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [role, viewMode]);

  useEffect(() => {
    if (role !== undefined && role !== null) {
      fetchData();
    }
  }, [fetchData, role]);

  const safeWeek = Array.isArray( periodAppointments) ? periodAppointments : [];

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
