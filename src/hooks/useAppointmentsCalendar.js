import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  getAppointments, 
  finishAppointment, 
  cancelAppointment 
} from "../services/appointments";
import { getMonthRange, toDateKey, todayDateKey } from "../utils/date";

const STATUS_DOT_COLOR = {
  SCHEDULED: "#D1779F",
  DONE: "#4CAF50",
  CANCELED: "#bbbbbb",
};

/**
 * Gerencia a agenda mensal do aplicativo:
 * - Busca agendamentos do mês visível no calendário
 * - Gera marcadores para o componente Calendar
 * - Filtra e ordena a lista de agendamentos do dia selecionado
 * - Oferece mutações para finalizar (POST /finish) e cancelar (PATCH /cancel)
 */
export function useAppointmentsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayDateKey());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMonth = useCallback(async (monthDate) => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = getMonthRange(monthDate);
      const data = await getAppointments({ start, end });
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonth(currentMonth);
  }, [currentMonth, fetchMonth]);

  // Finaliza o agendamento na API (POST /appointments/{id}/finish)
  const confirmAppointment = useCallback(async (id, paymentDetails = {}) => {
    try {
      await finishAppointment(id, paymentDetails);
      await fetchMonth(currentMonth);
      return true;
    } catch (err) {
      throw err;
    }
  }, [currentMonth, fetchMonth]);

  // Cancela o agendamento na API (PATCH /appointments/{id}/cancel)
  const handleCancelAppointment = useCallback(async (id) => {
    try {
      await cancelAppointment(id);
      await fetchMonth(currentMonth);
      return true;
    } catch (err) {
      throw err;
    }
  }, [currentMonth, fetchMonth]);

  // Marcadores do calendário (calculados antes do retorno)
  const markedDates = useMemo(() => {
    const marks = {};
    appointments.forEach((appt) => {
      const key = toDateKey(appt.startAt);
      if (!marks[key]) {
        marks[key] = { 
          marked: true, 
          dotColor: STATUS_DOT_COLOR[appt.status] ?? "#D1779F" 
        };
      }
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: "#f4c5e9",
    };

    return marks;
  }, [appointments, selectedDate]);

  // Filtra e ordena os agendamentos do dia selecionado por horário de início
  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => toDateKey(a.startAt) === selectedDate)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  }, [appointments, selectedDate]);

  return {
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    appointments,
    markedDates,
    dayAppointments,
    loading,
    error,
    confirmAppointment,
    cancelAppointment: handleCancelAppointment,
    refetch: () => fetchMonth(currentMonth),
  };
}