import api from "./api";

/**
 * Lista agendamentos.
 * Sem parâmetros, o backend já aplica os defaults:
 * - dia atual (start/end)
 * - staff do token, se usuário for STAFF
 * - equipe toda, se usuário for MANAGER
 * - todos os status
 *
 * @param {{ start?: string, end?: string, staffId?: string, status?: string, q?: string }} [params]
 */
export async function getAppointments(params) {
  try {
    const response = await api.get("/appointments", { params });

    console.log("=== API: GET /appointments ===");
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.log("=== ERRO: GET /appointments ===");
    console.log("Status:", error?.response?.status);
    console.log("Mensagem/Dados:", error?.response?.data || error?.message);
    throw error;
  }
}

export async function createAppointment(payload) {
  const { data } = await api.post("/appointments", payload);
  return data;

}

export async function finishAppointment(id, payload) {
  try {
    const { data } = await api.post(`/appointments/${id}/finish`, payload);
    return data;
  } catch (error) {
    console.log(`=== ERRO: POST /appointments/${id}/finish ===`, error);
    throw error;
  }
}

export async function cancelAppointment(id) {
  try {
    const { data } = await api.patch(`/appointments/${id}/cancel`);
    return data;
  } catch (error) {
    console.log(`=== ERRO: PATCH /appointments/${id}/cancel ===`, error);
    throw error;
  }
}