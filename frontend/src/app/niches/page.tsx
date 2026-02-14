"use client";

import { useEffect, useState } from "react";
import { fetchAPI, formatRevenue, formatNumber, formatPrice } from "../lib/api";
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis, Cell,
} from "recharts";
import { Target, TrendingUp, Users, Trophy } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";

interface Niche {
  name: string;
  revenue: number;
  products: number;
  sold: number;
  avg_price: number;
  avg_merchants: number;
  avg_rating: number;
  niche_score: number;
}

export default function NichesPage() {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxMerchants, setMaxMerchants] = useState(20);
  const [minRevenue, setMinRevenue] = useState(0);
  const [selected, setSelected] = useState<Niche | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#A1A1AA" : "#4A4A4C";

  const loadNiches = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<{ niches: Niche[] }>(
        `/api/niches?min_revenue=${minRevenue}&max_merchants=${maxMerchants}`
      );
      setNiches(data.niches);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNiches();
  }, [maxMerchants, minRevenue]);

  const scoreColor = (score: number) => {
    if (score >= 0.7) return "#22C55E";
    if (score >= 0.4) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-kaspi-dark flex items-center gap-3">
          <Target className="text-kaspi-red" size={32} />
          Поиск ниш
        </h1>
        <p className="text-kaspi-gray-500 mt-1">
          Категории с высокой выручкой и низкой конкуренцией — лучшие точки входа на маркетплейс
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-kaspi-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-kaspi-dark mb-2 block">
              Макс. среднее кол-во продавцов: <span className="text-kaspi-red font-bold">{maxMerchants}</span>
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={maxMerchants}
              onChange={(e) => setMaxMerchants(Number(e.target.value))}
              className="w-full accent-kaspi-red"
            />
            <div className="flex justify-between text-xs text-kaspi-gray-500 mt-1">
              <span>1 (минимум)</span>
              <span>100</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-kaspi-dark mb-2 block">
              Мин. выручка: <span className="text-kaspi-red font-bold">{formatRevenue(minRevenue)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={5000000000}
              step={100000000}
              value={minRevenue}
              onChange={(e) => setMinRevenue(Number(e.target.value))}
              className="w-full accent-kaspi-red"
            />
            <div className="flex justify-between text-xs text-kaspi-gray-500 mt-1">
              <span>0</span>
              <span>5 млрд ₸</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scatter Plot */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100 mb-6">
        <h3 className="text-sm font-semibold text-kaspi-dark mb-4">
          Карта ниш: Конкуренция × Выручка (размер = продажи)
        </h3>
        {!loading && niches.length > 0 && (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
              <XAxis
                type="number"
                dataKey="avg_merchants"
                name="Среднее продавцов"
                tick={{ fontSize: 11, fill: tickColor }}
                label={{ value: "Среднее кол-во продавцов →", position: "bottom", offset: -5, fontSize: 12, fill: "#8E8E93" }}
              />
              <YAxis
                type="number"
                dataKey="revenue"
                name="Выручка"
                tick={{ fontSize: 11, fill: tickColor }}
                tickFormatter={(v: number) => formatRevenue(v)}
                label={{ value: "Выручка →", angle: -90, position: "insideLeft", offset: -5, fontSize: 12, fill: "#8E8E93" }}
              />
              <ZAxis type="number" dataKey="sold" range={[50, 800]} name="Продано" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-kaspi-dark text-white px-4 py-3 rounded-xl text-xs shadow-xl">
                      <p className="font-bold text-sm mb-1">{d.name}</p>
                      <p>Выручка: {formatRevenue(d.revenue)}</p>
                      <p>Ср. продавцов: {d.avg_merchants}</p>
                      <p>Продано: {formatNumber(d.sold)} шт.</p>
                      <p>Товаров: {formatNumber(d.products)}</p>
                      <p>Niche Score: <span className="font-bold" style={{ color: scoreColor(d.niche_score) }}>{(d.niche_score * 100).toFixed(0)}%</span></p>
                    </div>
                  );
                }}
              />
              <Scatter data={niches} onClick={(d: any) => setSelected(d)}>
                {niches.map((n, i) => (
                  <Cell key={i} fill={scoreColor(n.niche_score)} fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Selected niche detail */}
      {selected && (
        <div className="bg-gradient-to-r from-kaspi-red to-kaspi-red-dark text-white rounded-2xl p-6 mb-6 animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Выбранная ниша</p>
              <h2 className="text-xl font-bold">{selected.name}</h2>
            </div>
            <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white text-lg">✕</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-xs">Выручка</p>
              <p className="text-lg font-bold">{formatRevenue(selected.revenue)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-xs">Ср. продавцов</p>
              <p className="text-lg font-bold">{selected.avg_merchants}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-xs">Продано</p>
              <p className="text-lg font-bold">{formatNumber(selected.sold)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-xs">Niche Score</p>
              <p className="text-lg font-bold">{(selected.niche_score * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Niche Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-kaspi-gray-100 overflow-hidden">
        <div className="p-4 border-b border-kaspi-gray-100 flex items-center gap-2">
          <Trophy size={18} className="text-kaspi-red" />
          <h3 className="text-sm font-semibold text-kaspi-dark">Рейтинг ниш ({niches.length})</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-kaspi-red/30 border-t-kaspi-red rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-kaspi-gray-50 border-b border-kaspi-gray-100">
                  <th className="text-left p-3 text-kaspi-gray-500 font-medium text-xs">#</th>
                  <th className="text-left p-3 text-kaspi-gray-500 font-medium text-xs">Категория</th>
                  <th className="text-right p-3 text-kaspi-gray-500 font-medium text-xs">Выручка</th>
                  <th className="text-right p-3 text-kaspi-gray-500 font-medium text-xs">Продавцов</th>
                  <th className="text-right p-3 text-kaspi-gray-500 font-medium text-xs">Товаров</th>
                  <th className="text-right p-3 text-kaspi-gray-500 font-medium text-xs">Ср. цена</th>
                  <th className="text-center p-3 text-kaspi-gray-500 font-medium text-xs">Рейтинг</th>
                  <th className="text-center p-3 text-kaspi-gray-500 font-medium text-xs">Score</th>
                </tr>
              </thead>
              <tbody>
                {niches.slice(0, 50).map((n, i) => (
                  <tr
                    key={n.name}
                    className="border-b border-kaspi-gray-100 hover:bg-kaspi-gray-100 cursor-pointer transition-colors"
                    onClick={() => setSelected(n)}
                  >
                    <td className="p-3 text-kaspi-gray-500 font-mono text-xs">{i + 1}</td>
                    <td className="p-3 font-medium text-kaspi-dark">{n.name}</td>
                    <td className="p-3 text-right font-semibold">{formatRevenue(n.revenue)}</td>
                    <td className="p-3 text-right">{n.avg_merchants}</td>
                    <td className="p-3 text-right">{formatNumber(n.products)}</td>
                    <td className="p-3 text-right">{formatPrice(n.avg_price)}</td>
                    <td className="p-3 text-center">⭐ {n.avg_rating}</td>
                    <td className="p-3 text-center">
                      <span
                        className="inline-flex px-2 py-1 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: scoreColor(n.niche_score) }}
                      >
                        {(n.niche_score * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
