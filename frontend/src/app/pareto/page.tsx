"use client";

import { useEffect, useState } from "react";
import { fetchAPI, formatRevenue, formatNumber, formatPrice } from "../lib/api";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, PieChart, Pie, Cell,
} from "recharts";
import { PieChartIcon, TrendingUp, Package, Award } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";

interface ParetoPoint {
  product_pct: number;
  revenue_pct: number;
}

interface ABCClass {
  class: string;
  count: number;
  pct: number;
  revenue: number;
  revenue_pct: number;
}

interface TopProduct {
  product_name: string;
  brand_name: string;
  category_name: string;
  sale_amount: number;
  sale_qty: number;
  sale_price: number;
  abc_class: string;
}

interface ParetoData {
  pareto_points: ParetoPoint[];
  pct_80: number;
  pct_95: number;
  abc_breakdown: ABCClass[];
  top_products: TopProduct[];
  total_products: number;
  total_revenue: number;
}

const ABC_COLORS: Record<string, string> = {
  A: "#F14635",
  B: "#F59E0B",
  C: "#8E8E93",
};

export default function ParetoPage() {
  const [data, setData] = useState<ParetoData | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#A1A1AA" : "#4A4A4C";
  const gridStroke = isDark ? "#27272A" : "#F5F5F5";

  useEffect(() => {
    fetchAPI<ParetoData>("/api/abc-pareto")
      .then(setData)
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

  const abcA = data.abc_breakdown.find((x) => x.class === "A");
  const abcB = data.abc_breakdown.find((x) => x.class === "B");
  const abcC = data.abc_breakdown.find((x) => x.class === "C");

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-kaspi-dark flex items-center gap-3">
          <PieChartIcon className="text-kaspi-red" size={32} />
          ABC / Парето анализ
        </h1>
        <p className="text-kaspi-gray-500 mt-1">
          {formatNumber(data.total_products)} товаров генерируют {formatRevenue(data.total_revenue)} суммарной выручки
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 stagger">
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-lg">
          <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Класс A — Лидеры</p>
          <p className="text-4xl font-black mt-2">{(abcA?.pct ?? 0).toFixed(1)}%</p>
          <p className="text-sm text-white/80 mt-1">
            {formatNumber(abcA?.count || 0)} товаров = {(abcA?.revenue_pct ?? 0).toFixed(1)}% выручки
          </p>
          <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${abcA?.revenue_pct || 0}%` }} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-2xl p-6 shadow-lg">
          <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Класс B — Середняки</p>
          <p className="text-4xl font-black mt-2">{(abcB?.pct ?? 0).toFixed(1)}%</p>
          <p className="text-sm text-white/80 mt-1">
            {formatNumber(abcB?.count || 0)} товаров = {(abcB?.revenue_pct ?? 0).toFixed(1)}% выручки
          </p>
          <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${abcB?.revenue_pct || 0}%` }} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-2xl p-6 shadow-lg">
          <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Класс C — Балласт</p>
          <p className="text-4xl font-black mt-2">{(abcC?.pct ?? 0).toFixed(1)}%</p>
          <p className="text-sm text-white/80 mt-1">
            {formatNumber(abcC?.count || 0)} товаров = {(abcC?.revenue_pct ?? 0).toFixed(1)}% выручки
          </p>
          <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${abcC?.revenue_pct || 0}%` }} />
          </div>
        </div>
      </div>

      {/* 80/20 Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="text-kaspi-red" size={20} />
          <h3 className="text-sm font-semibold text-kaspi-dark">Правило Парето</h3>
        </div>
        <p className="text-kaspi-gray-500 text-sm">
          <span className="font-bold text-kaspi-red">{(data.pct_80 ?? 0).toFixed(1)}%</span> товаров генерируют <span className="font-bold text-kaspi-red">80%</span> выручки.{" "}
          <span className="font-bold text-amber-500">{(data.pct_95 ?? 0).toFixed(1)}%</span> товаров генерируют <span className="font-bold text-amber-500">95%</span> выручки.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pareto Curve */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
          <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Кривая Парето</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data.pareto_points} margin={{ left: 0, right: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="paretoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F14635" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F14635" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="product_pct"
                tick={{ fontSize: 11, fill: tickColor }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: tickColor }}
                tickFormatter={(v: number) => `${v}%`}
                domain={[0, 100]}
              />
              <ReferenceLine y={80} stroke="#F14635" strokeDasharray="6 3" label={{ value: "80%", fill: "#F14635", fontSize: 11, position: "right" }} />
              <ReferenceLine y={95} stroke="#F59E0B" strokeDasharray="6 3" label={{ value: "95%", fill: "#F59E0B", fontSize: 11, position: "right" }} />
              <ReferenceLine
                x={data.pct_80}
                stroke="#F14635"
                strokeDasharray="6 3"
              />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-kaspi-dark text-white px-4 py-2.5 rounded-xl text-xs shadow-xl">
                    <p>{d.product_pct}% товаров</p>
                    <p className="font-bold">{(d.revenue_pct ?? 0).toFixed(1)}% выручки</p>
                  </div>
                );
              }} />
              <Area
                type="monotone"
                dataKey="revenue_pct"
                stroke="#F14635"
                strokeWidth={2.5}
                fill="url(#paretoGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-kaspi-dark mb-4 self-start">ABC Структура</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.abc_breakdown}
                dataKey="revenue_pct"
                nameKey="class"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={4}
                label={(props: any) => {
                  const { cx, cy, midAngle, innerRadius, outerRadius, name } = props;
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                      {name}
                    </text>
                  );
                }}
                labelLine={false}
              >
                {data.abc_breakdown.map((entry) => (
                  <Cell key={entry.class} fill={ABC_COLORS[entry.class] || "#ddd"} />
                ))}
              </Pie>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-kaspi-dark text-white px-4 py-2.5 rounded-xl text-xs shadow-xl">
                    <p className="font-bold">Класс {d.class}</p>
                    <p>{d.count} товаров ({(d.pct ?? 0).toFixed(1)}%)</p>
                    <p>{formatRevenue(d.revenue)} ({(d.revenue_pct ?? 0).toFixed(1)}%)</p>
                  </div>
                );
              }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            {data.abc_breakdown.map((e) => (
              <div key={e.class} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ABC_COLORS[e.class] }} />
                <span className="text-xs text-kaspi-gray-500">{e.class} — {(e.revenue_pct ?? 0).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl shadow-sm border border-kaspi-gray-100 overflow-hidden">
        <div className="p-6 flex items-center gap-2">
          <Award size={18} className="text-kaspi-red" />
          <h3 className="text-sm font-semibold text-kaspi-dark">Топ-10 товаров по выручке (класс A)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-kaspi-gray-50 text-xs text-kaspi-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Товар</th>
                <th className="px-6 py-3 text-left">Бренд</th>
                <th className="px-6 py-3 text-right">Цена</th>
                <th className="px-6 py-3 text-right">Продано</th>
                <th className="px-6 py-3 text-right">Выручка</th>
                <th className="px-6 py-3 text-center">Класс</th>
              </tr>
            </thead>
            <tbody>
              {data.top_products.map((p, i) => (
                <tr key={i} className="border-t border-kaspi-gray-100 hover:bg-kaspi-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-kaspi-gray-300">{i + 1}</td>
                  <td className="px-6 py-4 text-sm font-medium text-kaspi-dark max-w-xs truncate">{p.product_name}</td>
                  <td className="px-6 py-4 text-sm text-kaspi-gray-500">{p.brand_name}</td>
                  <td className="px-6 py-4 text-sm text-kaspi-dark text-right">{formatPrice(p.sale_price)}</td>
                  <td className="px-6 py-4 text-sm text-kaspi-dark text-right">{formatNumber(p.sale_qty)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-kaspi-dark text-right">{formatRevenue(p.sale_amount)}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: ABC_COLORS[p.abc_class] }}
                    >
                      {p.abc_class}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
