import api from "./api";

export async function getExpensesSummary(start, end) {
  const res = await api.get("/expenses/summary", { params: { start, end } });
  return res.data;
}

export async function getExpenseEntries(params = {}) {
  const res = await api.get("/expenses/entries", { params });
  return res.data;
}

export async function createExpenseEntry(body) {
  const res = await api.post("/expenses/entries", body);
  return res.data;
}

export async function cancelExpenseEntry(id) {
  const res = await api.patch(`/expenses/entries/${id}/cancel`);
  return res.data;
}

export async function getExpenseCategories(params = {}) {
  const res = await api.get("/expenses/categories", { params });
  return res.data;
}

export async function createExpenseCategory(body) {
  const res = await api.post("/expenses/categories", body);
  return res.data;
}