import api from "./api";

// GET /finance/records
export async function getFinanceRecords(params = {}) {
  const { data } = await api.get("/finance/records", {
    params,
  });

  return data;
}

// PATCH /finance/records/{id}/mark-paid
export async function markRecordPaid(
  id,
  { paymentMethod, receivedAt, notes } = {}
) {
  const body = {
    paymentMethod,
  };

  if (receivedAt) {
    body.receivedAt = receivedAt;
  }

  if (notes) {
    body.notes = notes;
  }

  const { data } = await api.patch(
    `/finance/records/${id}/mark-paid`,
    body
  );

  return data;
}

// GET /finance/summary
export async function getFinanceSummary(start, end) {
  const { data } = await api.get("/finance/summary", {
    params: {
      start,
      end,
    },
  });

  return data;
}