import api from "./api";

// Todos os endpoints de /expenses exigem papel MANAGER.

export async function getExpenseCategories(params = {}) {
  const { data } = await api.get("/expenses/categories", { params });
  return data;
}

export async function createExpenseCategory(payload) {
  // payload: { name, description? }
  const { data } = await api.post("/expenses/categories", payload);
  return data;
}

export async function getExpenseEntries(params = {}) {
  // params: start, end, categoryId, paymentStatus, paymentMethod, q
  const { data } = await api.get("/expenses/entries", { params });
  return data;
}

export async function createExpenseEntry(payload) {
  const { data } = await api.post("/expenses/entries", payload);
  return data;
}

export async function cancelExpenseEntry(id) {
  const { data } = await api.patch(`/expenses/entries/${id}/cancel`);
  return data;
}

export async function getExpensesSummary(start, end, groupBy) {
  const params = { start, end };
  if (groupBy) params.groupBy = groupBy; // "category" | "month"
  const { data } = await api.get("/expenses/summary", { params });
  return data; // { start, end, total, byCategory?, byMonth? }
}