import api from "./api";
/**
 * Resumo financeiro por período. Somente MANAGER (o backend retorna 403 pra STAFF).
 * @param {string} start ISO-8601
 * @param {string} end ISO-8601
 */

export async function getFinancialSummary(start, end){
    const { data } = await api.get("/finance/summary", { params: { start, end } });
    return data;
    // { start, end, totalReceived, totalPending, totalDiscount,
  //   appointmentsCount, pendingAppointmentsCount, totalByMethod }

}



