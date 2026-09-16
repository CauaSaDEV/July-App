import { useCallback, useEffect, useMemo, useState } from "react";
import { getAppointments } from "../services/appointments";
import { getMonthRange, toDateKey, todayDateKey } from "../utils/date";


const STATUS_DOT_COLOR = {
  SCHEDULED: "#D1779F",
  DONE: "#4CAF50",
  CANCELED: "#bbbbbb",
};

/**
 * Gerencia os dados da tela de Agendamentos:
 * - busca os agendamentos do mês visível no calendário
 * - monta o objeto markedDates pro react-native-calendars
 * - filtra a lista de agendamentos do dia selecionado
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
      setAppointments(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonth(currentMonth);
  }, [currentMonth, fetchMonth]);

  const markedDates = useMemo(() => {
    const marks = {};
    appointments.forEach((appt) => {
      const key = toDateKey(appt.startAt);
      if (!marks[key]) {
        marks[key] = { marked: true, dotColor: STATUS_DOT_COLOR[appt.status] ?? "#D1779F" };
      }
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: "#f4c5e9",
    };

    return marks;
  }, [appointments, selectedDate]);

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
    refetch: () => fetchMonth(currentMonth),
  };
}