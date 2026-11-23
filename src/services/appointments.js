import api from "./api";

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


export async function finishAppointment(id, finishData = {}) {
  const payload = {
    amount: finishData.amount ?? undefined,
    discount: finishData.discount ?? 0,
    paymentMethod: finishData.paymentMethod ?? undefined,
    paymentStatus: finishData.paymentStatus ?? "PAID",
    notes: finishData.notes ?? undefined,
  };
   console.log(JSON.stringify(payload))

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

export async function createRetroactiveAppointment(data) {

  const response = await api.post("/appointments/retroactive", data);
  return response.data;
}