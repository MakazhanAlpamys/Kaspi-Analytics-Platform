const API_BASE = "http://localhost:8000";

export async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function formatPrice(price: number | undefined | null): string {
  if (price == null) return "0 ₸";
  return new Intl.NumberFormat("ru-RU").format(price) + " ₸";
}

export function formatNumber(num: number | undefined | null): string {
  if (num == null) return "0";
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + " млрд";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + " млн";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

export function formatRevenue(amount: number | undefined | null): string {
  if (amount == null) return "0 ₸";
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(2) + " млрд ₸";
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + " млн ₸";
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + "K ₸";
  return amount + " ₸";
}

export function abcLabel(abc: number): string {
  if (abc === 1) return "A";
  if (abc === 2) return "B";
  return "C";
}

export function abcColor(abc: number): string {
  if (abc === 1) return "#22C55E";
  if (abc === 2) return "#F59E0B";
  return "#EF4444";
}
