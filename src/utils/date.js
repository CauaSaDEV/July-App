/**
 * Retorna o intervalo (início e fim) do mês atual em ISO-8601 UTC,
 * pronto para usar em GET /finance/summary?start=&end=.
 */
export function getCurrentMonthRange() {
  const now = new Date();
  return getMonthRange(now);
}
 
/**
 * Retorna o intervalo (início e fim) do mês de uma data qualquer, em ISO-8601 UTC.
 * @param {Date} date
 */
export function getMonthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}
 
/**
 * Formata um valor numérico como moeda BRL.
 */
export function formatCurrency(value) {
  const num = Number(value ?? 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
 
/**
 * Formata um datetime ISO como horário local (HH:mm).
 */
export function formatTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
 
/**
 * Converte um objeto Date para uma chave "YYYY-MM-DD" (fuso local),
 * no formato que o react-native-calendars usa.
 */
export function dateToKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
 
/**
 * Converte uma string ISO (ex: startAt de um agendamento) para "YYYY-MM-DD" local.
 */
export function toDateKey(isoString) {
  return dateToKey(new Date(isoString));
}
 
/**
 * Chave "YYYY-MM-DD" de hoje, no fuso local.
 */
export function todayDateKey() {
  return dateToKey(new Date());
}
 
/**
 * Combina uma chave de data ("YYYY-MM-DD") com um objeto Date que carrega
 * apenas o horário (horas/minutos), retornando um novo Date completo.
 * Use `.toISOString()` no resultado para mandar pro backend.
 */
export function combineDateAndTime(dateKey, timeDate) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, timeDate.getHours(), timeDate.getMinutes(), 0);
}
 