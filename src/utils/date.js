export function getCurrentMonthRange() {
    const now  = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1,0,0,0));
    const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));
    return { start: start.toISOString(), end: end.toISOString() };
}

export function formatCurrency(value) {
    const num = Number(value ?? 0);
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatTime(isoString) {
    if(!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaletimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}