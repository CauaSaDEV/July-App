import { useCallback, useEffect, useState } from "react";
import { getAppointments } from "../services/appointments";
import { getFinanceSummary } from "../services/finance";
import { getCurrentMonthRange } from "../utils/date";

/**
 * Agrega os dados usados na Home:
 * - agendamentos do dia atual (todos os status; backend já filtra por staff/equipe)
 * - resumo financeiro do mês (apenas se role === "MANAGER")
 *
 * @param {string | undefined} role role do usuário autenticado (vem do useAuth)
 */
 export function useHomeData(role) {
    const [appointments, setAppointments] = useState([]);
    const [financeSummary, setFinanceSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const tasks = [getAppointments()];

            if(role === "MANAGER"){
                const { start, end } = getCurrentMonthRange();
                tasks.push(getFinanceSummary(start, end));
            }

            const results = await Promise.all(tasks);

            setAppointments(results[0]);
            if(role === "MANAGER") {
             setFinanceSummary(results[1]);
            } else {
                setFinanceSummary(null);
            }
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        if (role) {
            fetchData();
        }
    }, [role, fetchData]);

    const scheduledCout =  appointments.filter((a) => a.status === "SCHEDULED").length;
    const doneCount = appointments.filter((a)=> a.status === "DONE").length;
    const canceledCount = appointments.filter((a)=> a.status === "CANCELED").length;

    const nextAppointments = appointments
    .filter((a) => a.status === "SCHEDULED")
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

    return {
        appointments,
        nextAppointments,
        scheduledCout,
        doneCount,
        canceledCount,
        financeSummary,
        loading,
        error,
        refetch: fetchData,
    };
}