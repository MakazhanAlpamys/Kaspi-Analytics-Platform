"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchAPI, formatNumber, formatRevenue, formatPrice } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Search, Package, DollarSign, ShoppingCart, Star, MessageSquare, Plus, X } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";

interface BrandData {
  name: string;
  metrics: {
    total_products: number;
    total_revenue: number;
    total_sold: number;
    avg_price: number;
    avg_rating: number;
    total_reviews: number;
  };
  categories: { name: string; revenue: number; products: number }[];
  top_products: {
    product_name: string;
    sale_price: number;
    sale_qty: number;
    sale_amount: number;
    product_rate: number;
    image_url: string;
  }[];
}

interface CompareData {
  name: string;
  products: number;
  revenue: number;
  avg_price: number;
  avg_rating: number;
  total_sold: number;
  total_reviews: number;
}

interface Filters {
  categories: string[];
  brands: string[];
  parent_categories: string[];
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-kaspi-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p className="text-[10px] text-kaspi-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-lg font-bold text-kaspi-dark">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [data, setData] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"detail" | "compare">("detail");
  const [compareBrands, setCompareBrands] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<CompareData[]>([]);
  const [compareInput, setCompareInput] = useState("");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#A1A1AA" : "#4A4A4C";
  const gridStroke = isDark ? "#3A3A3C" : "#F2F2F7";

  useEffect(() => {
    fetchAPI<Filters>("/api/filters").then((f) => setBrands(f.brands));
  }, []);

  useEffect(() => {
    if (!selected || tab !== "detail") return;
    setLoading(true);
    fetchAPI<BrandData>(`/api/brands/${encodeURIComponent(selected)}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selected, tab]);

  useEffect(() => {
    if (compareBrands.length < 2 || tab !== "compare") return;
    fetchAPI<CompareData[]>(`/api/brands/compare?brands=${encodeURIComponent(compareBrands.join(","))}`)
      .then(setCompareData)
      .catch(console.error);
  }, [compareBrands, tab]);

  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(searchInput.toLowerCase())
  );

  const addCompareBrand = (brand: string) => {
    if (compareBrands.length < 5 && !compareBrands.includes(brand)) {
      setCompareBrands([...compareBrands, brand]);
    }
  };

  const removeCompareBrand = (brand: string) => {
    setCompareBrands(compareBrands.filter((b) => b !== brand));
  };

  const radarData = compareData.length >= 2
    ? [
        { metric: "Товары", ...Object.fromEntries(compareData.map((d) => [d.name, normalize(d.products, compareData.map((x) => x.products))])) },
        { metric: "Выручка", ...Object.fromEntries(compareData.map((d) => [d.name, normalize(d.revenue, compareData.map((x) => x.revenue))])) },
        { metric: "Ср. цена", ...Object.fromEntries(compareData.map((d) => [d.name, normalize(d.avg_price, compareData.map((x) => x.avg_price))])) },
        { metric: "Рейтинг", ...Object.fromEntries(compareData.map((d) => [d.name, normalize(d.avg_rating, compareData.map((x) => x.avg_rating))])) },
        { metric: "Продажи", ...Object.fromEntries(compareData.map((d) => [d.name, normalize(d.total_sold, compareData.map((x) => x.total_sold))])) },
        { metric: "Отзывы", ...Object.fromEntries(compareData.map((d) => [d.name, normalize(d.total_reviews, compareData.map((x) => x.total_reviews))])) },
      ]
    : [];

  const COLORS = ["#F14635", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6"];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-kaspi-dark">Аналитика брендов</h1>
          <p className="text-kaspi-gray-500 mt-1">Детальный анализ и сравнение брендов</p>
        </div>
        <div className="flex bg-white rounded-xl border border-kaspi-gray-100 p-1">
          <button
            onClick={() => setTab("detail")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${tab === "detail" ? "bg-kaspi-red text-white" : "text-kaspi-gray-500 hover:text-kaspi-dark"}`}
          >
            Детальный
          </button>
          <button
            onClick={() => setTab("compare")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${tab === "compare" ? "bg-kaspi-red text-white" : "text-kaspi-gray-500 hover:text-kaspi-dark"}`}
          >
            Сравнение
          </button>
        </div>
      </div>

      {tab === "detail" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Brand List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-kaspi-gray-100 p-4 sticky top-6">
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kaspi-gray-300" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Поиск бренда..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-xs focus:outline-none focus:border-kaspi-red"
                />
              </div>
              <div className="max-h-[70vh] overflow-y-auto space-y-0.5">
                {filteredBrands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelected(b)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                      selected === b ? "bg-kaspi-red text-white font-medium" : "text-kaspi-gray-700 hover:bg-kaspi-gray-100"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Brand Details */}
          <div className="lg:col-span-3">
            {!selected && (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-kaspi-gray-100 text-center">
                <Search size={48} className="mx-auto text-kaspi-gray-300 mb-4" />
                <p className="text-kaspi-gray-500">Выберите бренд слева для анализа</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-kaspi-red/30 border-t-kaspi-red rounded-full animate-spin" />
              </div>
            )}

            {!loading && data && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
                  <h2 className="text-xl font-bold text-kaspi-dark">{data.name}</h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <MetricCard icon={Package} label="Товаров" value={formatNumber(data.metrics.total_products)} color="#3B82F6" />
                  <MetricCard icon={DollarSign} label="Выручка" value={formatRevenue(data.metrics.total_revenue)} color="#F14635" />
                  <MetricCard icon={ShoppingCart} label="Продано" value={formatNumber(data.metrics.total_sold)} color="#22C55E" />
                  <MetricCard icon={Star} label="Рейтинг" value={data.metrics.avg_rating.toFixed(2)} color="#F59E0B" />
                  <MetricCard icon={MessageSquare} label="Отзывов" value={formatNumber(data.metrics.total_reviews)} color="#8B5CF6" />
                  <MetricCard icon={DollarSign} label="Средняя цена" value={formatPrice(data.metrics.avg_price)} color="#06B6D4" />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
                  <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Категории бренда</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.categories} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: tickColor }} tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 20) + "…" : v} />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                            <p className="font-medium">{d.name}</p>
                            <p>Выручка: {formatRevenue(d.revenue)}</p>
                            <p>Товаров: {d.products}</p>
                          </div>
                        );
                      }} />
                      <Bar dataKey="revenue" fill="#F14635" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
                  <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Топ товары</h3>
                  <div className="space-y-3">
                    {data.top_products.map((p, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-kaspi-gray-50">
                        <span className="text-sm font-bold text-kaspi-gray-300 w-6">{i + 1}</span>
                        <div className="w-12 h-12 rounded-lg bg-white flex-shrink-0 overflow-hidden">
                          {p.image_url ? (
                            <Image src={p.image_url} alt="" width={48} height={48} className="w-full h-full object-contain" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-kaspi-gray-300 text-xs">—</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-kaspi-dark truncate">{p.product_name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-kaspi-gray-500">{formatPrice(p.sale_price)}</span>
                            <span className="text-[10px] text-kaspi-gray-500 flex items-center gap-0.5">
                              <Star size={10} className="text-yellow-400 fill-yellow-400" /> {p.product_rate}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-kaspi-dark">{formatRevenue(p.sale_amount)}</p>
                          <p className="text-[10px] text-kaspi-gray-500">{formatNumber(p.sale_qty)} шт.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "compare" && (
        <div className="space-y-6">
          {/* Brand Selector */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
            <h3 className="text-sm font-semibold text-kaspi-dark mb-3">Выберите бренды для сравнения (до 5)</h3>
            <div className="flex gap-2 flex-wrap mb-3">
              {compareBrands.map((b) => (
                <span key={b} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-kaspi-red/10 text-kaspi-red text-xs font-medium">
                  {b}
                  <button onClick={() => removeCompareBrand(b)}><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kaspi-gray-300" />
                <input
                  type="text"
                  value={compareInput}
                  onChange={(e) => setCompareInput(e.target.value)}
                  placeholder="Поиск бренда..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-xs focus:outline-none focus:border-kaspi-red"
                />
              </div>
            </div>
            {compareInput && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-kaspi-gray-100 rounded-xl">
                {brands
                  .filter((b) => b.toLowerCase().includes(compareInput.toLowerCase()) && !compareBrands.includes(b))
                  .slice(0, 20)
                  .map((b) => (
                    <button
                      key={b}
                      onClick={() => { addCompareBrand(b); setCompareInput(""); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-kaspi-gray-100 flex items-center gap-2"
                    >
                      <Plus size={12} className="text-kaspi-gray-300" /> {b}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {compareData.length >= 2 && (
            <>
              {/* Radar Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
                <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Сравнение брендов</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={gridStroke} />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: tickColor }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    {compareData.map((d, i) => (
                      <Radar
                        key={d.name}
                        name={d.name}
                        dataKey={d.name}
                        stroke={COLORS[i]}
                        fill={COLORS[i]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Compare Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-kaspi-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-kaspi-gray-100 bg-kaspi-gray-50">
                      <th className="text-left p-4 text-kaspi-gray-500 font-medium text-xs">Бренд</th>
                      <th className="text-right p-4 text-kaspi-gray-500 font-medium text-xs">Товаров</th>
                      <th className="text-right p-4 text-kaspi-gray-500 font-medium text-xs">Выручка</th>
                      <th className="text-right p-4 text-kaspi-gray-500 font-medium text-xs">Ср. цена</th>
                      <th className="text-center p-4 text-kaspi-gray-500 font-medium text-xs">Рейтинг</th>
                      <th className="text-right p-4 text-kaspi-gray-500 font-medium text-xs">Продано</th>
                      <th className="text-right p-4 text-kaspi-gray-500 font-medium text-xs">Отзывов</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareData.map((d, i) => (
                      <tr key={d.name} className="border-b border-kaspi-gray-100">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                            <span className="text-sm font-medium text-kaspi-dark">{d.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right text-sm">{formatNumber(d.products)}</td>
                        <td className="p-4 text-right text-sm font-medium">{formatRevenue(d.revenue)}</td>
                        <td className="p-4 text-right text-sm">{formatPrice(d.avg_price)}</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" /> {d.avg_rating}
                          </span>
                        </td>
                        <td className="p-4 text-right text-sm">{formatNumber(d.total_sold)}</td>
                        <td className="p-4 text-right text-sm">{formatNumber(d.total_reviews)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function normalize(value: number, all: number[]): number {
  const max = Math.max(...all);
  if (max === 0) return 0;
  return Math.round((value / max) * 100);
}
