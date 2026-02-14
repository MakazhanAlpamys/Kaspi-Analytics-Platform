"use client";

import { useEffect, useState } from "react";
import { fetchAPI, formatRevenue, formatNumber } from "../lib/api";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer,
  Cell, BarChart, Bar,
} from "recharts";
import { Lightbulb, TrendingUp, ShieldCheck, Star, Users, BarChart3 } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";

interface Recommendation {
  category: string;
  demand_score: number;
  competition_score: number;
  margin_score: number;
  efficiency_score: number;
  rating_score: number;
  entry_score: number;
  avg_price: number;
  total_revenue: number;
  product_count: number;
  avg_merchants: number;
  avg_rating: number;
  median_sale_qty: number;
}

interface ScatterPoint {
  category: string;
  demand: number;
  competition: number;
  revenue: number;
  entry_score: number;
}

interface ScoreDistItem {
  range: string;
  count: number;
}

interface RecommenderData {
  recommendations: Recommendation[];
  scatter: ScatterPoint[];
  score_distribution: ScoreDistItem[];
}

const medalColors = ["#F14635", "#F59E0B", "#6366F1"];
const barColors = ["#F14635", "#F59E0B", "#22C55E", "#3B82F6", "#8B5CF6"];

export default function RecommenderPage() {
  const [data, setData] = useState<RecommenderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#A1A1AA" : "#4A4A4C";

  useEffect(() => {
    fetchAPI<RecommenderData>("/api/recommender")
      .then((d) => {
        setData(d);
        if (d.recommendations.length > 0) setSelected(d.recommendations[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-kaspi-red/30 border-t-kaspi-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const scoreColor = (s: number) => {
    if (s >= 0.7) return "#22C55E";
    if (s >= 0.5) return "#3B82F6";
    if (s >= 0.3) return "#F59E0B";
    return "#EF4444";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 0.7) return "Отлично";
    if (s >= 0.5) return "Хорошо";
    if (s >= 0.3) return "Средне";
    return "Слабо";
  };

  const metrics = [
    { key: "demand_score" as const, label: "Спрос", icon: TrendingUp, desc: "Медиана продаж, общая выручка" },
    { key: "competition_score" as const, label: "Конкуренция", icon: Users, desc: "Мало продавцов = лучше" },
    { key: "margin_score" as const, label: "Маржа", icon: BarChart3, desc: "Выручка на товар" },
    { key: "efficiency_score" as const, label: "Эффективность", icon: ShieldCheck, desc: "Продажи на продавца" },
    { key: "rating_score" as const, label: "Рейтинг", icon: Star, desc: "Средний рейтинг" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-kaspi-dark flex items-center gap-3">
          <Lightbulb className="text-kaspi-red" size={32} />
          Что продавать?
        </h1>
        <p className="text-kaspi-gray-500 mt-1">
          ML-рекомендации лучших категорий для входа на основе 5 ключевых метрик
        </p>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 stagger">
        {data.recommendations.slice(0, 3).map((rec, i) => (
          <button
            key={rec.category}
            onClick={() => setSelected(rec)}
            className={`text-left rounded-2xl p-6 shadow-lg transition-all border-2 ${
              selected?.category === rec.category
                ? "border-kaspi-red scale-[1.02]"
                : "border-transparent hover:scale-[1.01]"
            }`}
            style={{
              background: i === 0
                ? "linear-gradient(135deg, #F14635, #D93025)"
                : i === 1
                ? "linear-gradient(135deg, #F59E0B, #D97706)"
                : "linear-gradient(135deg, #6366F1, #4F46E5)",
              color: "white",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl font-black text-white/30">#{i + 1}</span>
              <span
                className="px-3 py-1.5 rounded-full text-sm font-bold bg-white/20 backdrop-blur-sm"
              >
                {(rec.entry_score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-lg font-bold leading-tight mb-2 line-clamp-2">{rec.category}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
              <div>
                <p className="text-white/50">Выручка</p>
                <p className="font-semibold text-white">{formatRevenue(rec.total_revenue)}</p>
              </div>
              <div>
                <p className="text-white/50">Товаров</p>
                <p className="font-semibold text-white">{formatNumber(rec.product_count)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Category Ranking List */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-kaspi-gray-100 overflow-hidden">
          <div className="p-4 border-b border-kaspi-gray-100">
            <h3 className="text-sm font-semibold text-kaspi-dark">Рейтинг категорий</h3>
          </div>
          <div className="divide-y divide-kaspi-gray-100 max-h-[500px] overflow-y-auto">
            {data.recommendations.map((rec, i) => (
              <button
                key={rec.category}
                onClick={() => setSelected(rec)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  selected?.category === rec.category
                    ? "bg-kaspi-red/5"
                    : "hover:bg-kaspi-gray-50"
                }`}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: i < 3 ? medalColors[i] : "#8E8E93" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-kaspi-dark truncate">{rec.category}</p>
                  <p className="text-xs text-kaspi-gray-500">
                    {formatRevenue(rec.total_revenue)} · {formatNumber(rec.product_count)} товаров
                  </p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-md text-xs font-bold"
                  style={{ color: scoreColor(rec.entry_score), backgroundColor: `${scoreColor(rec.entry_score)}15` }}
                >
                  {(rec.entry_score * 100).toFixed(0)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-kaspi-dark">{selected.category}</h3>
                    <p className="text-xs text-kaspi-gray-500 mt-0.5">
                      {formatNumber(selected.product_count)} товаров · Ср. цена {formatRevenue(selected.avg_price)} · Рейтинг ⭐ {selected.avg_rating}
                    </p>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black"
                      style={{ backgroundColor: scoreColor(selected.entry_score) }}
                    >
                      {(selected.entry_score * 100).toFixed(0)}
                    </div>
                    <p className="text-xs text-kaspi-gray-500 mt-1 font-medium">{getScoreLabel(selected.entry_score)}</p>
                  </div>
                </div>

                {/* 5 Metrics */}
                <div className="space-y-3">
                  {metrics.map(({ key, label, icon: Icon, desc }) => {
                    const val = selected[key];
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Icon size={14} className="text-kaspi-gray-500" />
                            <span className="text-xs font-medium text-kaspi-dark">{label}</span>
                            <span className="text-[10px] text-kaspi-gray-400">{desc}</span>
                          </div>
                          <span className="text-xs font-bold" style={{ color: scoreColor(val) }}>
                            {(val * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-kaspi-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${val * 100}%`, backgroundColor: scoreColor(val) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-kaspi-gray-100 text-center">
                  <p className="text-xs text-kaspi-gray-500">Выручка</p>
                  <p className="text-lg font-bold text-kaspi-dark">{formatRevenue(selected.total_revenue)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-kaspi-gray-100 text-center">
                  <p className="text-xs text-kaspi-gray-500">Медиана продаж</p>
                  <p className="text-lg font-bold text-kaspi-dark">{formatNumber(selected.median_sale_qty)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-kaspi-gray-100 text-center">
                  <p className="text-xs text-kaspi-gray-500">Ср. продавцов</p>
                  <p className="text-lg font-bold text-kaspi-dark">{selected.avg_merchants}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-kaspi-gray-100 text-center">
                  <p className="text-xs text-kaspi-gray-500">Ср. рейтинг</p>
                  <p className="text-lg font-bold text-kaspi-dark">⭐ {selected.avg_rating}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scatter Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
          <h3 className="text-sm font-semibold text-kaspi-dark mb-4">
            Спрос vs Конкуренция (размер = выручка)
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ left: 0, right: 10, bottom: 5 }}>
              <XAxis
                dataKey="demand"
                name="Спрос"
                tick={{ fontSize: 11, fill: tickColor }}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                label={{ value: "Спрос →", position: "insideBottomRight", offset: -5, fontSize: 11, fill: tickColor }}
              />
              <YAxis
                dataKey="competition"
                name="Конкуренция"
                tick={{ fontSize: 11, fill: tickColor }}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                label={{ value: "Низкая конкуренция →", angle: -90, position: "insideLeft", fontSize: 11, fill: tickColor }}
              />
              <ZAxis dataKey="revenue" range={[40, 500]} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-kaspi-dark text-white px-4 py-3 rounded-xl text-xs shadow-xl max-w-[250px]">
                    <p className="font-bold text-sm mb-1 line-clamp-2">{d.category}</p>
                    <p>Спрос: {(d.demand * 100).toFixed(0)}%</p>
                    <p>Конкуренция: {(d.competition * 100).toFixed(0)}%</p>
                    <p>Итоговый балл: {(d.entry_score * 100).toFixed(0)}%</p>
                  </div>
                );
              }} />
              <Scatter data={data.scatter}>
                {data.scatter.map((point, i) => (
                  <Cell
                    key={i}
                    fill={scoreColor(point.entry_score)}
                    fillOpacity={selected?.category === point.category ? 1 : 0.6}
                    stroke={selected?.category === point.category ? "#1D1D1F" : "none"}
                    strokeWidth={2}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-kaspi-gray-400 text-center mt-2">
            💡 Лучшие ниши — правый верхний угол (высокий спрос, мало конкурентов)
          </p>
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
          <h3 className="text-sm font-semibold text-kaspi-dark mb-4">
            Распределение баллов по категориям
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.score_distribution} margin={{ left: 0, right: 10, bottom: 5 }}>
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: tickColor }} />
              <YAxis tick={{ fontSize: 11, fill: tickColor }} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-kaspi-dark text-white px-4 py-2.5 rounded-xl text-xs shadow-xl">
                    <p className="font-bold">{d.range}</p>
                    <p>{d.count} категорий</p>
                  </div>
                );
              }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.score_distribution.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
