"use client";

import { useEffect, useState } from "react";
import { fetchAPI, formatNumber, formatRevenue } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { Clock, Skull, Activity, CalendarDays } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";

interface TimeData {
  products_by_month: { month: string; products: number; revenue: number }[];
  dead_count: number;
  active_count: number;
  total_with_dates: number;
  dead_categories: { name: string; count: number }[];
  activity_distribution: { range: string; count: number }[];
  by_day_of_week: { day: string; count: number }[];
  weak_threshold: number;
}

const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#F14635", "#8B5CF6", "#EC4899"];

export default function TimeAnalysisPage() {
  const [data, setData] = useState<TimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    fetchAPI<TimeData>("/api/time-analysis")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-12 h-12 border-4 border-kaspi-red/30 border-t-kaspi-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const isDark = theme === "dark";
  const tickColor = isDark ? "#A1A1AA" : "#4A4A4C";

  const alivePercent = data.total_with_dates > 0
    ? ((data.active_count / data.total_with_dates) * 100).toFixed(1)
    : "0";

  const pieData = [
    { name: "Сильные", value: data.active_count },
    { name: "Слабые (≤" + (data.weak_threshold) + " продаж)", value: data.dead_count },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-kaspi-dark flex items-center gap-3">
          <Clock className="text-kaspi-red" size={32} />
          Временной анализ
        </h1>
        <p className="text-kaspi-gray-500 mt-1">Когда добавляются товары, распределение продаж, сезонность</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-kaspi-gray-100">
          <div className="flex items-center gap-2 text-kaspi-gray-500 mb-1">
            <Activity size={16} className="text-green-500" />
            <span className="text-xs uppercase tracking-wider">Активные</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatNumber(data.active_count)}</p>
          <p className="text-xs text-kaspi-gray-500 mt-1">{alivePercent}% от всех</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-kaspi-gray-100">
          <div className="flex items-center gap-2 text-kaspi-gray-500 mb-1">
            <Skull size={16} className="text-red-500" />
            <span className="text-xs uppercase tracking-wider">Слабые</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatNumber(data.dead_count)}</p>
          <p className="text-xs text-kaspi-gray-500 mt-1">&le;{data.weak_threshold} продаж</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-kaspi-gray-100">
          <div className="flex items-center gap-2 text-kaspi-gray-500 mb-1">
            <CalendarDays size={16} className="text-blue-500" />
            <span className="text-xs uppercase tracking-wider">Месяцев данных</span>
          </div>
          <p className="text-2xl font-bold text-kaspi-dark">{data.products_by_month.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-kaspi-gray-100">
          <div className="flex items-center gap-2 text-kaspi-gray-500 mb-1">
            <Clock size={16} className="text-purple-500" />
            <span className="text-xs uppercase tracking-wider">С датами</span>
          </div>
          <p className="text-2xl font-bold text-kaspi-dark">{formatNumber(data.total_with_dates)}</p>
        </div>
      </div>

      {/* Products over time */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100 mb-6">
        <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Товары добавленные по месяцам</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data.products_by_month} margin={{ left: 10, right: 10 }}>
            <defs>
              <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F14635" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F14635" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: tickColor }} tickFormatter={(v: string) => v.slice(2)} />
            <YAxis tick={{ fontSize: 11, fill: "#8E8E93" }} tickFormatter={(v: number) => formatNumber(v)} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-kaspi-dark text-white px-4 py-3 rounded-xl text-xs shadow-xl">
                  <p className="font-bold text-sm mb-1">{d.month}</p>
                  <p>Добавлено: {formatNumber(d.products)} товаров</p>
                  <p>Выручка: {formatRevenue(d.revenue)}</p>
                </div>
              );
            }} />
            <Area type="monotone" dataKey="products" stroke="#F14635" strokeWidth={2} fill="url(#colorProducts)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Activity distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
          <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Распределение по объёму продаж</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.activity_distribution}>
              <XAxis dataKey="range" tick={{ fontSize: 9, fill: tickColor }} />
              <YAxis tick={{ fontSize: 11, fill: "#8E8E93" }} tickFormatter={(v: number) => formatNumber(v)} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                    <p className="font-medium">{payload[0].payload.range}</p>
                    <p>{formatNumber(payload[0].value as number)} товаров</p>
                  </div>
                );
              }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.activity_distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alive vs dead pie */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
          <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Сильные vs Слабые товары</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value">
                <Cell fill="#22C55E" />
                <Cell fill="#EF4444" />
              </Pie>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                    <p className="font-medium">{payload[0].name}</p>
                    <p>{formatNumber(payload[0].value as number)}</p>
                  </div>
                );
              }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 -mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-kaspi-gray-700">Сильные</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-kaspi-gray-700">Слабые</span>
            </div>
          </div>
        </div>

        {/* By day of week */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
          <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Добавление по дням недели</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.by_day_of_week}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: tickColor }} />
              <YAxis tick={{ fontSize: 11, fill: "#8E8E93" }} tickFormatter={(v: number) => formatNumber(v)} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                    <p className="font-medium">{payload[0].payload.day}</p>
                    <p>{formatNumber(payload[0].value as number)} товаров</p>
                  </div>
                );
              }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dead categories */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Skull size={18} className="text-red-500" />
          <h3 className="text-sm font-semibold text-kaspi-dark">Топ категорий со слабыми товарами (≤{data.weak_threshold} продаж)</h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.dead_categories} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11, fill: tickColor }} tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 25) + "…" : v} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                  <p className="font-medium">{payload[0].payload.name}</p>
                    <p>{formatNumber(payload[0].value as number)} слабых товаров</p>
                </div>
              );
            }} />
            <Bar dataKey="count" fill="#EF4444" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
