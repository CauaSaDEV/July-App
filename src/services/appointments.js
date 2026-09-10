import api from "./api";

/**
 Lista agendamentos.
 * Sem parâmetros, o backend já aplica os defaults:
 * - dia atual (start/end)
 * - staff do token, se usuário for STAFF
 * - equipe toda, se usuário for MANAGER
 * - todos os status
 *
 * @param {{ start?: string, end?: string, staffId?: string, status?: string, q?: string }} params
 */


export async function getAppointments(params = {}) {
    const { data } = await api.get("/appointments", { params });
    return data; 
}

export async function finishAppointment(id, payload) {
    const { data } =  await api.post(`/appointments/${id}/finish`, payload);
    return data;
}

export async function cancelAppointment(id, payload) {
    const { data } = await api.patch(`/appointments/${id}/cancel`);
    return data;
}