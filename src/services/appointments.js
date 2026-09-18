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
  try {
    const { data } = await api.post("/appointments", payload);
    return data;
  } catch (error) {
    console.log("=== ERRO: POST /appointments ===");
    console.log("Status:", error?.response?.status);
    console.log("Mensagem/Dados:", error?.response?.data || error?.message);
    throw error;
  }
}

/**
 * Finaliza o agendamento (marca como DONE e gera financeiro)
 */
export async function finishAppointment(id, finishData = {}) {
  const payload = {
    amount: finishData.amount ?? undefined,
    discount: finishData.discount ?? 0,
    paymentMethod: finishData.paymentMethod ?? "PIX",
    paymentStatus: finishData.paymentStatus ?? "PAID",
    notes: finishData.notes ?? undefined,
  };

  const response = await api.post(`/appointments/${id}/finish`, payload);
  return response.data;
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

/**
 * Lança um atendimento retroativo (Exclusivo para MANAGER)
 * @param {Object} data
 */
export async function createRetroactiveAppointment(data) {
  // Exemplo de formato aceito pelo backend:
  // {
  //   clientId: "uuid",
  //   staffId: "uuid",
  //   serviceItemId: "uuid", // opcional
  //   startAt: "2026-02-20T14:00:00Z",
  //   endAt: "2026-02-20T15:00:00Z",
  //   appointmentNotes: "Atendimento de ontem",
  //   amount: 150.00,
  //   discount: 0,
  //   paymentMethod: "PIX",
  //   paymentStatus: "PAID",
  //   receivedAt: "2026-02-20T15:00:00Z",
  //   paymentNotes: "Pago no local"
  // }
  const response = await api.post("/appointments/retroactive", data);
  return response.data;
}