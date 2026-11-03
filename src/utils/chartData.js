const NO_STAFF_LABEL = "Sem funcionário";
const NO_SERVICE_LABEL = "Serviço não informado";

/**
 * Valor líquido de um registro financeiro (mesma regra do PendingPaymentSection).
 */
export function getRecordAmount(record) {
  if (record?.finalAmount != null) {
    return Number(record.finalAmount) || 0;
  }

  const amount = Number(record?.amount ?? 0);
  const discount = Number(record?.discount ?? 0);

  return Math.max(amount - discount, 0);
}

export function getStaffName(record) {
  return record?.staffName || record?.staff?.name || NO_STAFF_LABEL;
}

export function getServiceName(record) {
  return record?.serviceName || record?.service?.name || NO_SERVICE_LABEL;
}

/**
 * Ordem decrescente por valor; empate resolvido em ordem alfabética (pt-BR).
 * @param {{ label: string, value: number }[]} items
 */
export function sortDistribution(items) {
  return [...items].sort(
    (a, b) =>
      b.value - a.value ||
      a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }),
  );
}

/**
 * Agrupa registros por rótulo somando `getValue` (padrão: conta 1 por registro).
 */
export function groupRecords(records, getLabel, getValue = () => 1) {
  const grouped = new Map();

  records.forEach((record) => {
    const label = getLabel(record);
    grouped.set(label, (grouped.get(label) ?? 0) + getValue(record));
  });

  const items = [...grouped].map(([label, value]) => ({
    label,
    // evita sujeira de ponto flutuante ao somar centavos
    value: Math.round(value * 100) / 100,
  }));

  return sortDistribution(items);
}

export function sumValues(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Monta as três séries do dashboard a partir dos registros PAGOS do período.
 */
export function buildDashboardData(paidRecords) {
  const records = Array.isArray(paidRecords) ? paidRecords : [];

  const byStaffCount = groupRecords(records, getStaffName);
  const byStaffAmount = groupRecords(records, getStaffName, getRecordAmount);
  const byService = groupRecords(records, getServiceName);

  return {
    byStaffCount,
    byStaffAmount,
    byService,
    totalCount: records.length,
    // soma das barras, para o total sempre bater com o gráfico
    totalAmount: sumValues(byStaffAmount),
  };
}

/**
 * Escala "bonita" para o eixo: sempre começa em 0 e usa passos 1/2/5 x 10^n.
 * Escolhe o maior passo que ainda gera pelo menos 3 intervalos.
 *
 * Ex.: max 9    -> 0, 2, 4, 6, 8, 10
 *      max 5    -> 0, 2, 4, 6
 *      max 2500 -> 0, 1000, 2000, 3000
 *
 * @param {number} maxValue maior valor da série
 * @param {{ integer?: boolean }} [options] integer: nunca usa passo fracionado
 * @returns {{ max: number, step: number, ticks: number[] }}
 */
export function getNiceScale(maxValue, { integer = false } = {}) {
  const max = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 0;

  if (max === 0) {
    return { max: 1, step: 1, ticks: [0, 1] };
  }

  const candidates = [];
  for (let exp = -2; exp <= 9; exp += 1) {
    for (const mult of [1, 2, 5]) {
      const step = Number((mult * 10 ** exp).toFixed(2));
      if (!integer || step >= 1) candidates.push(step);
    }
  }

  let step = candidates[0];
  for (const candidate of candidates) {
    if (Math.ceil(max / candidate - 1e-9) >= 3) step = candidate;
    else break;
  }

  const intervals = Math.ceil(max / step - 1e-9);
  const ticks = Array.from({ length: intervals + 1 }, (_, i) =>
    Number((i * step).toFixed(2)),
  );

  return { max: ticks[ticks.length - 1], step, ticks };
}

/**
 * Moeda sem centavos para o eixo (ex.: "R$ 1.000").
 */
export function formatCurrencyShort(value) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

/**
 * "1 atendimento" / "20 atendimentos".
 */
export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}
