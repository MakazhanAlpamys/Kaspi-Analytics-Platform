"use client";

import { useState } from "react";
import Image from "next/image";
import { fetchAPI, formatPrice, formatNumber, formatRevenue, abcLabel, abcColor } from "../lib/api";
import { Search, X, GitCompareArrows, Star, Plus } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";

interface SearchResult {
  product_code: string;
  product_name: string;
  sale_price: number;
  image_url: string;
  type: string;
}

interface CompareProduct {
  product_code: string;
  product_name: string;
  brand_name: string;
  category_name: string;
  sale_price: number;
  product_rate: number;
  review_qty: number;
  sale_qty: number;
  sale_amount: number;
  merchant_count: number;
  amount_abc: number;
  image_url: string;
}

export default function ComparePage() {
  const [codes, setCodes] = useState<string[]>([]);
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleSearch = async (q: string) => {
    setSearchInput(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await fetchAPI<{ products: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data.products.filter((p) => !codes.includes(p.product_code)));
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const addProduct = async (code: string) => {
    if (codes.length >= 5 || codes.includes(code)) return;
    const newCodes = [...codes, code];
    setCodes(newCodes);
    setSearchInput("");
    setSearchResults([]);
    setLoading(true);
    try {
      const data = await fetchAPI<CompareProduct[]>(`/api/products/compare?codes=${newCodes.join(",")}`);
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const removeProduct = async (code: string) => {
    const newCodes = codes.filter((c) => c !== code);
    setCodes(newCodes);
    if (newCodes.length === 0) {
      setProducts([]);
      return;
    }
    try {
      const data = await fetchAPI<CompareProduct[]>(`/api/products/compare?codes=${newCodes.join(",")}`);
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const metrics: { key: keyof CompareProduct; label: string; format: (v: any) => string }[] = [
    { key: "brand_name", label: "Бренд", format: (v) => v },
    { key: "category_name", label: "Категория", format: (v) => v },
    { key: "sale_price", label: "Цена", format: (v) => formatPrice(v) },
    { key: "product_rate", label: "Рейтинг", format: (v) => `⭐ ${v}` },
    { key: "review_qty", label: "Отзывы", format: (v) => formatNumber(v) },
    { key: "sale_qty", label: "Продано", format: (v) => formatNumber(v) + " шт." },
    { key: "sale_amount", label: "Выручка", format: (v) => formatRevenue(v) },
    { key: "merchant_count", label: "Продавцов", format: (v) => v.toString() },
    { key: "amount_abc", label: "ABC класс", format: (v) => abcLabel(v) },
  ];

  const getBest = (key: keyof CompareProduct): string | null => {
    if (products.length < 2) return null;
    const numericKeys = ["sale_price", "product_rate", "review_qty", "sale_qty", "sale_amount"];
    if (!numericKeys.includes(key)) return null;
    const sorted = [...products].sort((a, b) => {
      const va = a[key] as number;
      const vb = b[key] as number;
      return key === "sale_price" ? va - vb : vb - va;
    });
    return sorted[0].product_code;
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-kaspi-dark flex items-center gap-3">
          <GitCompareArrows className="text-kaspi-red" size={32} />
          Сравнение товаров
        </h1>
        <p className="text-kaspi-gray-500 mt-1">Сравните до 5 товаров бок о бок</p>
      </div>

      {/* Search to add */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-kaspi-gray-100 mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-kaspi-gray-300" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Найдите товар для сравнения..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-sm focus:outline-none focus:border-kaspi-red focus:ring-1 focus:ring-kaspi-red/20 transition-all"
            disabled={codes.length >= 5}
          />
          {codes.length >= 5 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-kaspi-gray-500">Максимум 5 товаров</span>
          )}
        </div>

        {/* Dropdown results */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-white border border-kaspi-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-fade-in">
            {searchResults.map((r) => (
              <button
                key={r.product_code}
                onClick={() => addProduct(r.product_code)}
                className="w-full flex items-center gap-3 p-3 hover:bg-kaspi-gray-100 transition-colors text-left border-b border-kaspi-gray-100 last:border-b-0"
              >
                <div className="w-10 h-10 rounded-lg bg-kaspi-gray-50 flex-shrink-0 overflow-hidden">
                  {r.image_url ? (
                    <Image src={r.image_url} alt="" width={40} height={40} className="w-full h-full object-contain" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-kaspi-gray-300 text-xs">—</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-kaspi-dark truncate">{r.product_name}</p>
                  <p className="text-xs text-kaspi-gray-500">{formatPrice(r.sale_price)}</p>
                </div>
                <Plus size={16} className="text-kaspi-red flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {products.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-kaspi-gray-100 overflow-x-auto animate-fade-in">
          <table className="w-full">
            {/* Header with product images and names */}
            <thead>
              <tr className="border-b border-kaspi-gray-100">
                <th className="p-4 text-left text-xs font-medium text-kaspi-gray-500 w-32 sticky left-0 z-10" style={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}>Параметр</th>
                {products.map((p) => (
                  <th key={p.product_code} className="p-4 min-w-[200px]">
                    <div className="relative">
                      <button
                        onClick={() => removeProduct(p.product_code)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                      <div className="w-24 h-24 mx-auto bg-kaspi-gray-50 rounded-xl overflow-hidden mb-2">
                        {p.image_url ? (
                          <Image src={p.image_url} alt={p.product_name} width={96} height={96} className="w-full h-full object-contain" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-kaspi-gray-300 text-xs">—</div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-kaspi-dark line-clamp-2 text-center leading-4">{p.product_name}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const bestCode = getBest(m.key);
                return (
                  <tr key={m.key} className="border-b border-kaspi-gray-100 hover:bg-kaspi-gray-100/50">
                    <td className="p-4 text-xs font-medium text-kaspi-gray-500 sticky left-0" style={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}>{m.label}</td>
                    {products.map((p) => {
                      const isBest = bestCode === p.product_code;
                      const value = p[m.key];
                      return (
                        <td key={p.product_code} className="p-4 text-center">
                          <span className={`text-sm ${isBest ? "font-bold text-green-600" : "text-kaspi-dark"}`}>
                            {m.key === "amount_abc" ? (
                              <span
                                className="inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: abcColor(value as number) }}
                              >
                                {m.format(value)}
                              </span>
                            ) : (
                              m.format(value)
                            )}
                          </span>
                          {isBest && <span className="ml-1 text-green-500 text-xs">✓</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {products.length === 0 && !loading && (
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-kaspi-gray-100 text-center">
          <GitCompareArrows size={48} className="text-kaspi-gray-300 mx-auto mb-4" />
          <p className="text-kaspi-gray-500 text-sm">Добавьте товары для сравнения через поиск выше</p>
          <p className="text-kaspi-gray-300 text-xs mt-1">Можно сравнить до 5 товаров одновременно</p>
        </div>
      )}
    </div>
  );
}
