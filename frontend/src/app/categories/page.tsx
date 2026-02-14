"use client";

import { useEffect, useState } from "react";
import { fetchAPI, formatNumber, formatRevenue, formatPrice } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, CartesianGrid,
} from "recharts";
import { Search, Package, DollarSign, ShoppingCart, Star, Users, TrendingUp } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";

interface CategoryData {
  name: string;
  metrics: {
    total_products: number;
    total_revenue: number;
    total_sold: number;
    avg_price: number;
    avg_rating: number;
    avg_merchants: number;
  };
  top_brands: { name: string; revenue: number; products: number; avg_price: number }[];
  price_range: { min: number; max: number };
  scatter: { rating: number; sales: number; price: number; name: string }[];
  abc: { A: number; B: number; C: number };
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#A1A1AA" : "#4A4A4C";
  const gridStroke = isDark ? "#3A3A3C" : "#F2F2F7";

  useEffect(() => {
    fetchAPI<Filters>("/api/filters").then((f) => setCategories(f.categories));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetchAPI<CategoryData>(`/api/categories/${encodeURIComponent(selected)}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selected]);

  const filteredCats = categories.filter((c) =>
    c.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-kaspi-dark">Аналитика категорий</h1>
        <p className="text-kaspi-gray-500 mt-1">Детальный разбор по категориям товаров</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-kaspi-gray-100 p-4 sticky top-6">
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kaspi-gray-300" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Поиск категории..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-xs focus:outline-none focus:border-kaspi-red"
              />
            </div>
            <div className="max-h-[70vh] overflow-y-auto space-y-0.5">
              {filteredCats.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                    selected === c
                      ? "bg-kaspi-red text-white font-medium"
                      : "text-kaspi-gray-700 hover:bg-kaspi-gray-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Details */}
        <div className="lg:col-span-3">
          {!selected && (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-kaspi-gray-100 text-center">
              <Search size={48} className="mx-auto text-kaspi-gray-300 mb-4" />
              <p className="text-kaspi-gray-500">Выберите категорию слева для анализа</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-kaspi-red/30 border-t-kaspi-red rounded-full animate-spin" />
            </div>
          )}

          {!loading && data && (
            <div className="space-y-6 animate-fade-in">
              {/* Category Name */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
                <h2 className="text-xl font-bold text-kaspi-dark">{data.name}</h2>
                <p className="text-xs text-kaspi-gray-500 mt-1">
                  Ценовой диапазон: {formatPrice(data.price_range.min)} — {formatPrice(data.price_range.max)}
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard icon={Package} label="Товаров" value={formatNumber(data.metrics.total_products)} color="#3B82F6" />
                <MetricCard icon={DollarSign} label="Выручка" value={formatRevenue(data.metrics.total_revenue)} color="#F14635" />
                <MetricCard icon={ShoppingCart} label="Продано" value={formatNumber(data.metrics.total_sold)} color="#22C55E" />
                <MetricCard icon={TrendingUp} label="Средняя цена" value={formatPrice(data.metrics.avg_price)} color="#F59E0B" />
                <MetricCard icon={Star} label="Рейтинг" value={data.metrics.avg_rating.toFixed(2)} color="#F59E0B" />
                <MetricCard icon={Users} label="Продавцов (сред.)" value={data.metrics.avg_merchants.toFixed(0)} color="#8B5CF6" />
              </div>

              {/* ABC */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
                <h3 className="text-sm font-semibold text-kaspi-dark mb-3">ABC Анализ</h3>
                <div className="flex gap-4">
                  {[
                    { label: "A — Лидеры", value: data.abc.A, color: "#22C55E" },
                    { label: "B — Средние", value: data.abc.B, color: "#F59E0B" },
                    { label: "C — Аутсайдеры", value: data.abc.C, color: "#EF4444" },
                  ].map((item) => (
                    <div key={item.label} className="flex-1 bg-kaspi-gray-50 rounded-xl p-4 text-center">
                      <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: item.color }}>
                        {item.label[0]}
                      </div>
                      <p className="text-lg font-bold text-kaspi-dark">{formatNumber(item.value)}</p>
                      <p className="text-[10px] text-kaspi-gray-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Brands */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
                <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Топ бренды в категории</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.top_brands} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: tickColor }} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                          <p className="font-medium">{d.name}</p>
                          <p>Выручка: {formatRevenue(d.revenue)}</p>
                          <p>Товаров: {d.products}</p>
                          <p>Сред. цена: {formatPrice(d.avg_price)}</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="revenue" fill="#F14635" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Scatter: Rating vs Sales */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
                <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Рейтинг vs Продажи</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart margin={{ left: 10, right: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" dataKey="rating" name="Рейтинг" domain={[0, 5]} tick={{ fontSize: 11, fill: tickColor }} />
                    <YAxis type="number" dataKey="sales" name="Продажи" tick={{ fontSize: 11, fill: tickColor }} tickFormatter={(v: number) => formatNumber(v)} />
                    <ZAxis type="number" dataKey="price" range={[30, 300]} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg max-w-xs">
                          <p className="font-medium">{d.name}</p>
                          <p>Рейтинг: {d.rating} | Продажи: {formatNumber(d.sales)}</p>
                          <p>Цена: {formatPrice(d.price)}</p>
                        </div>
                      );
                    }} />
                    <Scatter data={data.scatter} fill="#F14635" fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
