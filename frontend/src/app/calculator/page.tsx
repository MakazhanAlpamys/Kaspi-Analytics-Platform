"use client";

import { useEffect, useState } from "react";
import { fetchAPI, formatRevenue, formatNumber, formatPrice } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Calculator, TrendingUp, Users, Star, Zap, Crown } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";

interface Filters {
  categories: string[];
  brands: string[];
  parent_categories: string[];
}

interface PriceSegment {
  range: string;
  low: number;
  high: number;
  products: number;
  revenue: number;
  avg_merchants: number;
  avg_rating: number;
  total_sold: number;
}

interface Gap extends PriceSegment {
  gap_score: number;
}

interface CalcData {
  category: string;
  brand: string;
  cat_stats: {
    total_products: number;
    avg_price: number;
    median_price: number;
    total_revenue: number;
    avg_merchants: number;
    avg_rating: number;
  };
  brand_stats: {
    products: number;
    avg_price: number;
    min_price: number;
    max_price: number;
    total_revenue: number;
    total_sold: number;
    avg_rating: number;
  } | null;
  price_segments: PriceSegment[];
  gaps: Gap[];
  competitors: { name: string; revenue: number; products: number; avg_price: number }[];
}

export default function CalculatorPage() {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [data, setData] = useState<CalcData | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#A1A1AA" : "#4A4A4C";

  useEffect(() => {
    fetchAPI<Filters>("/api/filters").then((f) => {
      setFilters(f);
      if (f.categories.length > 0) setCategory(f.categories[0]);
    });
  }, []);

  const analyze = async () => {
    if (!category) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ category });
      if (brand) params.set("brand", brand);
      const result = await fetchAPI<CalcData>(`/api/price-calculator?${params}`);
      setData(result);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const gapColor = (score: number) => {
    if (score >= 0.5) return "#22C55E";
    if (score >= 0.3) return "#3B82F6";
    if (score >= 0.15) return "#F59E0B";
    return "#8E8E93";
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-kaspi-dark flex items-center gap-3">
          <Calculator className="text-kaspi-red" size={32} />
          Ценовой калькулятор
        </h1>
        <p className="text-kaspi-gray-500 mt-1">
          Найдите ценовые ниши с низкой конкуренцией и высоким спросом
        </p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-kaspi-gray-500 mb-1.5 block">Категория *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-sm focus:outline-none focus:border-kaspi-red"
            >
              <option value="">Выберите категорию</option>
              {filters?.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-kaspi-gray-500 mb-1.5 block">Бренд (опционально)</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-sm focus:outline-none focus:border-kaspi-red"
            >
              <option value="">Все бренды</option>
              {filters?.brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <button
            onClick={analyze}
            disabled={!category || loading}
            className="bg-kaspi-red text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-kaspi-red-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap size={16} />
                Анализировать
              </>
            )}
          </button>
        </div>
      </div>

      {!data && !loading && (
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-kaspi-gray-100 text-center">
          <Calculator size={64} className="text-kaspi-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-kaspi-dark mb-2">Выберите категорию</h3>
          <p className="text-kaspi-gray-500 text-sm max-w-md mx-auto">
            Выберите категорию и нажмите &quot;Анализировать&quot; чтобы увидеть ценовые ниши и возможности
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-kaspi-red/30 border-t-kaspi-red rounded-full animate-spin" />
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-kaspi-gray-100">
              <p className="text-kaspi-gray-500 text-xs font-medium uppercase tracking-wide">Товаров в категории</p>
              <p className="text-2xl font-bold mt-1 text-kaspi-dark">{formatNumber(data.cat_stats.total_products)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-kaspi-gray-100">
              <p className="text-kaspi-gray-500 text-xs font-medium uppercase tracking-wide">Выручка категории</p>
              <p className="text-2xl font-bold mt-1 text-kaspi-dark">{formatRevenue(data.cat_stats.total_revenue)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-kaspi-gray-100">
              <p className="text-kaspi-gray-500 text-xs font-medium uppercase tracking-wide">Средняя цена</p>
              <p className="text-2xl font-bold mt-1 text-kaspi-dark">{formatPrice(data.cat_stats.avg_price)}</p>
              <p className="text-xs text-kaspi-gray-500 mt-0.5">медиана: {formatPrice(data.cat_stats.median_price)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-kaspi-gray-100">
              <p className="text-kaspi-gray-500 text-xs font-medium uppercase tracking-wide">Ср. продавцов</p>
              <p className="text-2xl font-bold mt-1 text-kaspi-dark">{data.cat_stats.avg_merchants}</p>
              <p className="text-xs text-kaspi-gray-500 mt-0.5">рейтинг: ⭐ {data.cat_stats.avg_rating}</p>
            </div>
          </div>

          {/* Brand stats banner */}
          {data.brand_stats && (
            <div className="bg-gradient-to-r from-kaspi-red to-kaspi-red-dark text-white rounded-2xl p-6">
              <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Бренд: {data.brand}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs">Товаров</p>
                  <p className="text-lg font-bold">{formatNumber(data.brand_stats.products)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs">Ценовой диапазон</p>
                  <p className="text-lg font-bold">{formatPrice(data.brand_stats.min_price)} — {formatPrice(data.brand_stats.max_price)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs">Выручка</p>
                  <p className="text-lg font-bold">{formatRevenue(data.brand_stats.total_revenue)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs">Рейтинг</p>
                  <p className="text-lg font-bold">⭐ {data.brand_stats.avg_rating}</p>
                </div>
              </div>
            </div>
          )}

          {/* Price Distribution Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
            <h3 className="text-sm font-semibold text-kaspi-dark mb-4">
              Распределение товаров по ценовым сегментам
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.price_segments} margin={{ left: 10, right: 10, bottom: 5 }}>
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: tickColor }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: "#8E8E93" }} tickFormatter={(v: number) => formatNumber(v)} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-kaspi-dark text-white px-4 py-3 rounded-xl text-xs shadow-xl">
                      <p className="font-bold text-sm mb-1">{formatPrice(d.low)} — {formatPrice(d.high)}</p>
                      <p>Товаров: {formatNumber(d.products)}</p>
                      <p>Выручка: {formatRevenue(d.revenue)}</p>
                      <p>Продано: {formatNumber(d.total_sold)} шт.</p>
                      <p>Ср. продавцов: {d.avg_merchants}</p>
                      <p>Ср. рейтинг: ⭐ {d.avg_rating}</p>
                    </div>
                  );
                }} />
                <Bar dataKey="products" radius={[6, 6, 0, 0]}>
                  {data.price_segments.map((seg, i) => {
                    const gap = data.gaps.find(g => g.range === seg.range);
                    const score = gap?.gap_score || 0;
                    return <Cell key={i} fill={score >= 0.3 ? "#22C55E" : score >= 0.15 ? "#3B82F6" : "#F14635"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                <span className="text-xs text-kaspi-gray-500">Отличная ниша</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                <span className="text-xs text-kaspi-gray-500">Перспективная</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#F14635]" />
                <span className="text-xs text-kaspi-gray-500">Высокая конкуренция</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price Gaps */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={18} className="text-green-500" />
                <h3 className="text-sm font-semibold text-kaspi-dark">Лучшие ценовые ниши</h3>
              </div>
              <div className="space-y-3">
                {data.gaps.map((gap, i) => (
                  <div key={i} className="rounded-xl border border-kaspi-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: gapColor(gap.gap_score) }}>
                          #{i + 1}
                        </span>
                        <span className="text-sm font-semibold text-kaspi-dark">
                          {formatPrice(gap.low)} — {formatPrice(gap.high)}
                        </span>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: gapColor(gap.gap_score) }}
                      >
                        {(gap.gap_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-kaspi-gray-500">Товаров</p>
                        <p className="font-semibold text-kaspi-dark">{gap.products}</p>
                      </div>
                      <div>
                        <p className="text-kaspi-gray-500">Продавцов</p>
                        <p className="font-semibold text-kaspi-dark">{gap.avg_merchants}</p>
                      </div>
                      <div>
                        <p className="text-kaspi-gray-500">Выручка</p>
                        <p className="font-semibold text-kaspi-dark">{formatRevenue(gap.revenue)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitors */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Crown size={18} className="text-yellow-500" />
                <h3 className="text-sm font-semibold text-kaspi-dark">Топ конкуренты в категории</h3>
              </div>
              <div className="space-y-3">
                {data.competitors.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-4 p-3 rounded-xl border border-kaspi-gray-100">
                    <span className="text-lg font-bold text-kaspi-gray-300 w-8 text-center">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-kaspi-dark">{c.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-kaspi-gray-500">
                        <span>{formatNumber(c.products)} товаров</span>
                        <span>Ср. цена: {formatPrice(c.avg_price)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-kaspi-dark">{formatRevenue(c.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Recommendations */}
              <div className="mt-4 p-4 rounded-xl bg-kaspi-gray-100 border border-kaspi-gray-100">
                <div className="flex items-start gap-2">
                  <TrendingUp size={16} className="text-kaspi-red mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-kaspi-dark mb-1">Рекомендация</p>
                    <p className="text-xs text-kaspi-gray-500">
                      {data.gaps[0] && data.gaps[0].gap_score >= 0.3
                        ? `Лучшая ниша: ${formatPrice(data.gaps[0].low)} — ${formatPrice(data.gaps[0].high)}. Низкая конкуренция (${data.gaps[0].avg_merchants} продавцов) при хорошем спросе.`
                        : "Категория достаточно конкурентная. Для входа рекомендуется уникальный товар или более низкая цена."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
