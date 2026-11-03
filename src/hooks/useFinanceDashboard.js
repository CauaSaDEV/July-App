import { useCallback, useMemo, useState } from "react";
import { getFinanceRecords } from "../services/finance";
import { getCurrentMonthRange } from "../utils/date";
import { buildDashboardData } from "../utils/chartData";

export function useFinanceDashboard() {
  const [paidRecords, setPaidRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getCurrentMonthRange();

      const response = await getFinanceRecords({
        status: "PAID",
        receivedStart: start,
        receivedEnd: end,
      });

      // Segurança extra: só registros pagos entram nos gráficos.
      const paid = Array.isArray(response)
        ? response.filter((record) => record?.paymentStatus === "PAID")
        : [];

      setPaidRecords(paid);
      setUpdatedAt(new Date());
    } catch (err) {
      console.log(
        "[useFinanceDashboard] Erro ao carregar financeiro:",
        err?.response?.data || err,
      );
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const data = useMemo(() => buildDashboardData(paidRecords), [paidRecords]);

  return {
    ...data,
    loading,
    error,
    updatedAt,
    refetch,
  };
}
