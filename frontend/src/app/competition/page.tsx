"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchAPI, formatRevenue, formatNumber, formatPrice } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell,
} from "recharts";
import { Swords, Crown, Users, TrendingDown } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";

interface CompetitionData {
  top_competition: { name: string; avg_merchants: number; products: number; revenue: number; avg_price: number }[];
  monopolies: { product_code: string; product_name: string; brand_name: string; category_name: string; sale_price: number; sale_qty: number; sale_amount: number; product_rate: number; image_url: string }[];
  scatter: { name: string; avg_price: number; avg_merchants: number; revenue: number; products: number }[];
  merchant_distribution: { range: string; count: number }[];
}

export default function CompetitionPage() {
  const [data, setData] = useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    fetchAPI<CompetitionData>("/api/competition")
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

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-kaspi-dark flex items-center gap-3">
          <Swords className="text-kaspi-red" size={32} />
          Анализ конкуренции
        </h1>
        <p className="text-kaspi-gray-500 mt-1">Кто доминирует, где монополии, и куда заходить</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top competitive categories */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-kaspi-red" />
            <h3 className="text-sm font-semibold text-kaspi-dark">Самые конкурентные категории</h3>
          </div>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={data.top_competition} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: tickColor }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10, fill: tickColor }} tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 20) + "…" : v} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-kaspi-dark text-white px-4 py-3 rounded-xl text-xs shadow-xl">
                    <p className="font-bold text-sm mb-1">{d.name}</p>
                    <p>Ср. продавцов: {d.avg_merchants}</p>
                    <p>Товаров: {formatNumber(d.products)}</p>
                    <p>Выручка: {formatRevenue(d.revenue)}</p>
                  </div>
                );
              }} />
              <Bar dataKey="avg_merchants" fill="#F14635" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Merchant distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={18} className="text-kaspi-red" />
            <h3 className="text-sm font-semibold text-kaspi-dark">Распределение по кол-ву продавцов</h3>
          </div>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={data.merchant_distribution}>
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: tickColor }} />
              <YAxis tick={{ fontSize: 11, fill: "#8E8E93" }} tickFormatter={(v: number) => formatNumber(v)} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-kaspi-dark text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                    <p className="font-medium">{payload[0].payload.range} продавцов</p>
                    <p>{formatNumber(payload[0].value as number)} товаров</p>
                  </div>
                );
              }} />
              <Bar dataKey="count" fill={isDark ? "#A1A1AA" : "#1D1D1F"} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scatter: Price vs Merchants */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100 mb-6">
        <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Средняя цена × Кол-во продавцов по категориям</h3>
        <ResponsiveContainer width="100%" height={450}>
          <ScatterChart margin={{ left: 20, right: 20 }}>
            <XAxis type="number" dataKey="avg_merchants" name="Продавцов" tick={{ fontSize: 11, fill: tickColor }}
              label={{ value: "Среднее кол-во продавцов →", position: "bottom", offset: -5, fontSize: 12, fill: "#8E8E93" }} />
            <YAxis type="number" dataKey="avg_price" name="Цена" tick={{ fontSize: 11, fill: tickColor }}
              tickFormatter={(v: number) => formatPrice(v)}
              label={{ value: "Средняя цена →", angle: -90, position: "insideLeft", offset: -5, fontSize: 12, fill: "#8E8E93" }} />
            <ZAxis type="number" dataKey="revenue" range={[30, 500]} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-kaspi-dark text-white px-4 py-3 rounded-xl text-xs shadow-xl">
                  <p className="font-bold text-sm mb-1">{d.name}</p>
                  <p>Ср. цена: {formatPrice(d.avg_price)}</p>
                  <p>Ср. продавцов: {d.avg_merchants}</p>
                  <p>Выручка: {formatRevenue(d.revenue)}</p>
                </div>
              );
            }} />
            <Scatter data={data.scatter.slice(0, 300)}>
              {data.scatter.slice(0, 300).map((_, i) => (
                <Cell key={i} fill={i < 50 ? "#F14635" : "#8E8E93"} fillOpacity={0.5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Monopoly products */}
      <div className="bg-white rounded-2xl shadow-sm border border-kaspi-gray-100 overflow-hidden">
        <div className="p-5 border-b border-kaspi-gray-100 flex items-center gap-2">
          <Crown size={18} className="text-yellow-500" />
          <h3 className="text-sm font-semibold text-kaspi-dark">Товары-монополисты (1 продавец, высокие продажи)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-5">
          {data.monopolies.map((p) => (
            <Link
              key={p.product_code}
              href={`/product/${p.product_code}`}
              className="rounded-xl border border-kaspi-gray-100 overflow-hidden card-hover group block"
            >
              <div className="relative aspect-square bg-kaspi-gray-50 p-2">
                {p.image_url ? (
                  <Image src={p.image_url} alt={p.product_name} fill className="object-contain p-2" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-kaspi-gray-300 text-xs">—</div>
                )}
                <span className="absolute top-1 left-1 bg-yellow-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">👑 1 продавец</span>
              </div>
              <div className="p-3">
                <p className="text-[10px] text-kaspi-gray-500">{p.brand_name}</p>
                <p className="text-xs font-medium text-kaspi-dark line-clamp-2 leading-4 h-8">{p.product_name}</p>
                <p className="text-sm font-bold text-kaspi-dark mt-1">{formatPrice(p.sale_price)}</p>
                <p className="text-[10px] text-kaspi-gray-500 mt-1">Продано: {formatNumber(p.sale_qty)} шт.</p>
                <p className="text-[10px] text-kaspi-gray-500">Выручка: {formatRevenue(p.sale_amount)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
