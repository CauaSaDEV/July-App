import api from "./api";
/**
 * Resumo financeiro por período. Somente MANAGER (o backend retorna 403 pra STAFF).
 * @param {string} start ISO-8601
 * @param {string} end ISO-8601
 */

export async function getFinancialSummary(start, end){
    try {
      const { data } = await api.get("/finance/summary", { params: { start, end } });
      return data;
    } catch (error) {
      console.log("=== ERRO: GET /finance/summary ===");
      console.log("Status:", error?.response?.status);
      console.log("Mensagem/Dados:", error?.response?.data || error?.message);
      throw error;
    }
}


