"use client";

import { useEffect, useState } from "react";
import { fetchAPI, formatNumber, formatRevenue, formatPrice } from "./lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Package, DollarSign, ShoppingCart, Star, MessageSquare,
  Building2, FolderOpen, TrendingUp,
} from "lucide-react";
import { useTheme } from "./components/ThemeProvider";

interface DashboardData {
  kpi: {
    total_products: number;
    total_revenue: number;
    total_sold: number;
    avg_price: number;
    avg_rating: number;
    total_reviews: number;
    unique_brands: number;
    unique_categories: number;
  };
  abc_data: { name: string; value: number; abc: number }[];
  top_categories: { name: string; revenue: number; products: number }[];
  top_brands: { name: string; revenue: number; products: number; avg_rating: number }[];
  top_categories_qty: { name: string; sold: number }[];
  price_distribution: { range: string; count: number }[];
  rating_distribution: { range: string; count: number }[];
  parent_categories: { name: string; revenue: number; products: number; sold: number }[];
}

const ABC_COLORS = ["#22C55E", "#F59E0B", "#EF4444"];
const CHART_COLORS = ["#F14635", "#FF6B5B", "#FF8A7A", "#FFB4A9", "#1D1D1F", "#4A4A4C", "#8E8E93", "#C7C7CC", "#F59E0B", "#3B82F6"];

function KPICard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm card-hover border border-kaspi-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-kaspi-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1 text-kaspi-dark">{value}</p>
          {sub && <p className="text-kaspi-gray-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
      <h3 className="text-sm font-semibold text-kaspi-dark mb-4">{title}</h3>
      {children}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg">
      <p className="font-medium">{label}</p>
      <p>{formatNumber(payload[0].value)}</p>
    </div>
  );
};

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    fetchAPI<DashboardData>("/api/dashboard")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-kaspi-red/30 border-t-kaspi-red rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-kaspi-gray-500 text-sm">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p className="text-kaspi-gray-500">Ошибка загрузки. Убедитесь, что backend запущен на порту 8000.</p>
      </div>
    );
  }

  const { kpi } = data;
  const isDark = theme === "dark";
  const tickColor = isDark ? "#A1A1AA" : "#4A4A4C";
  const labelColor = isDark ? "#E5E5EA" : "#1D1D1F";
  const chartColors = isDark
    ? ["#F14635", "#FF6B5B", "#FF8A7A", "#FFB4A9", "#A1A1AA", "#9CA3AF", "#71717A", "#C7C7CC", "#F59E0B", "#3B82F6"]
    : CHART_COLORS;

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-kaspi-dark">Дашборд</h1>
        <p className="text-kaspi-gray-500 mt-1">Обзор рынка Kaspi.kz — 210 000 товаров</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        <KPICard icon={DollarSign} label="Выручка" value={formatRevenue(kpi.total_revenue)} color="#F14635" />
        <KPICard icon={Package} label="Товаров" value={formatNumber(kpi.total_products)} color="#3B82F6" />
        <KPICard icon={ShoppingCart} label="Продано" value={formatNumber(kpi.total_sold)} sub="штук" color="#22C55E" />
        <KPICard icon={TrendingUp} label="Средняя цена" value={formatPrice(kpi.avg_price)} color="#F59E0B" />
        <KPICard icon={Star} label="Средний рейтинг" value={kpi.avg_rating.toFixed(2)} sub="из 5.0" color="#F59E0B" />
        <KPICard icon={MessageSquare} label="Отзывов" value={formatNumber(kpi.total_reviews)} color="#8B5CF6" />
        <KPICard icon={Building2} label="Брендов" value={formatNumber(kpi.unique_brands)} color="#EC4899" />
        <KPICard icon={FolderOpen} label="Категорий" value={formatNumber(kpi.unique_categories)} color="#06B6D4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ChartCard title="ABC Анализ товаров">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.abc_data} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value">
                {data.abc_data.map((_, i) => (<Cell key={i} fill={ABC_COLORS[i]} />))}
              </Pie>
              <Tooltip formatter={(v) => formatNumber(v as number)} />
              <Legend verticalAlign="bottom" height={36} formatter={(value: string) => <span className="text-xs" style={{ color: isDark ? "#C7C7CC" : "#4A4A4C" }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Топ-10 категорий по выручке">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.top_categories} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: tickColor }} tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (<div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg"><p className="font-medium">{d.name}</p><p>Выручка: {formatRevenue(d.revenue)}</p><p>Товаров: {formatNumber(d.products)}</p></div>);
              }} />
              <Bar dataKey="revenue" fill="#F14635" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Топ-10 брендов по выручке">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.top_brands} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: tickColor }} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (<div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg"><p className="font-medium">{d.name}</p><p>Выручка: {formatRevenue(d.revenue)}</p><p>Рейтинг: {d.avg_rating}</p></div>);
              }} />
              <Bar dataKey="revenue" fill={isDark ? "#A1A1AA" : "#1D1D1F"} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Распределение цен">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.price_distribution}>
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: tickColor }} />
              <YAxis tick={{ fontSize: 11, fill: "#8E8E93" }} tickFormatter={(v: number) => formatNumber(v)} />
              <Tooltip content={CustomTooltip} />
              <Bar dataKey="count" fill="#F14635" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Распределение рейтингов">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.rating_distribution}>
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: tickColor }} />
              <YAxis tick={{ fontSize: 11, fill: "#8E8E93" }} tickFormatter={(v: number) => formatNumber(v)} />
              <Tooltip content={CustomTooltip} />
              <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Родительские категории по выручке">
        <ResponsiveContainer width="100%" height={Math.max(400, data.parent_categories.length * 36)}>
          <BarChart data={data.parent_categories} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={180}
              tick={{ fontSize: 12, fill: labelColor, fontWeight: 500 }}
            />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-kaspi-dark text-white px-4 py-3 rounded-xl text-xs shadow-xl">
                  <p className="font-bold text-sm mb-1">{d.name}</p>
                  <p>Выручка: {formatRevenue(d.revenue)}</p>
                  <p>Товаров: {formatNumber(d.products)}</p>
                  <p>Продано: {formatNumber(d.sold)} шт.</p>
                </div>
              );
            }} />
            <Bar dataKey="revenue" radius={[0, 8, 8, 0]} label={(props: any) => {
              const x = Number(props.x || 0), y = Number(props.y || 0), w = Number(props.width || 0), h = Number(props.height || 0), v = Number(props.value || 0);
              return (<text x={x + w - 8} y={y + h / 2} textAnchor="end" dominantBaseline="central" fill="#fff" fontSize={11} fontWeight="600">{formatRevenue(v)}</text>);
            }}>
              {data.parent_categories.map((_, i) => (
                <Cell key={i} fill={chartColors[i % chartColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="mt-6">
        <ChartCard title="Топ-10 категорий по количеству продаж">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.top_categories_qty}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} tickFormatter={(v: string) => v.length > 15 ? v.slice(0, 15) + "…" : v} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#8E8E93" }} tickFormatter={(v: number) => formatNumber(v)} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (<div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg"><p className="font-medium">{payload[0].payload.name}</p><p>Продано: {formatNumber(payload[0].value as number)} шт.</p></div>);
              }} />
              <Bar dataKey="sold" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
