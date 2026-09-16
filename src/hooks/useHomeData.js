import { useCallback, useEffect, useState } from "react";
import { getAppointments } from "../services/appointments";
import { getFinanceSummary } from "../services/finance";
import { getCurrentMonthRange } from "../utils/date";

/**
 * Agrega os dados usados na Home:
 * - agendamentos do dia atual (todos os status; backend já filtra por staff/equipe)
 * - resumo financeiro do mês (apenas se role === "MANAGER" ou "STAFF")
 *
 * @param {string | undefined} role role do usuário autenticado (vem do useAuth)
 */
export function useHomeData(role) {
  const [appointments, setAppointments] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    console.log("[useHomeData] Disparando busca de dados (role atual:", role, ")");
    setLoading(true);
    setError(null);
    
    // Corrigido para CamelCase exato: hasFinanceAccess
    const hasFinanceAccess = role === "MANAGER" || role === "STAFF";

    try {
      // 1. Agendamentos sempre são buscados (independente de ser STAFF ou MANAGER)
      const tasks = [getAppointments()];

      // 2. Se a role for MANAGER ou STAFF, inclui o resumo financeiro
      if (hasFinanceAccess) {
        const { start, end } = getCurrentMonthRange();
        tasks.push(getFinanceSummary(start, end));
      }

      const results = await Promise.all(tasks);

      console.log("[useHomeData] Resposta recebida com sucesso.");
      setAppointments(Array.isArray(results[0]) ? results[0] : []);

      if (hasFinanceAccess) {
        setFinanceSummary(results[1] ?? null);
      } else {
        setFinanceSummary(null);
      }
    } catch (err) {
      console.log("[useHomeData] Erro capturado ao carregar dados:", err);
      setError(err);
      setAppointments([]);
      setFinanceSummary(null);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (role !== undefined && role !== null){
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
    financeSummary,
    loading,
    error,
    role,
    refetch: fetchData,
  };
}
