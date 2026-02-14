"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchAPI, formatNumber, formatRevenue, formatPrice } from "../lib/api";
import { Brain, TrendingUp, Target, Zap, Star } from "lucide-react";

interface Filters {
  categories: string[];
  brands: string[];
  parent_categories: string[];
}

interface PredictionResult {
  predicted_sales: number;
  similar_products: {
    product_name: string;
    sale_price: number;
    sale_qty: number;
    product_rate: number;
    image_url: string;
  }[];
  price_recommendation: {
    min: number;
    median: number;
    max: number;
    optimal: number;
  };
}

export default function PredictPage() {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [category, setCategory] = useState("Смартфоны");
  const [brand, setBrand] = useState("Apple");
  const [price, setPrice] = useState(200000);
  const [merchants, setMerchants] = useState(10);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAPI<Filters>("/api/filters").then(setFilters);
  }, []);

  const predict = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<PredictionResult>("/api/predict", {
        method: "POST",
        body: JSON.stringify({ category, brand, price, merchants }),
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-kaspi-red/10 flex items-center justify-center">
            <Brain size={22} className="text-kaspi-red" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-kaspi-dark">ML Прогнозы</h1>
            <p className="text-kaspi-gray-500 text-sm">Предсказание продаж и рекомендация цены</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100 sticky top-6">
            <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Параметры товара</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-kaspi-gray-500 mb-1.5 block">Категория</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-sm focus:outline-none focus:border-kaspi-red"
                >
                  {filters?.categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-kaspi-gray-500 mb-1.5 block">Бренд</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-sm focus:outline-none focus:border-kaspi-red"
                >
                  {filters?.brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-kaspi-gray-500 mb-1.5 block">
                  Цена: {formatPrice(price)}
                </label>
                <input
                  type="range"
                  min={1000}
                  max={2000000}
                  step={1000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full accent-kaspi-red"
                />
                <div className="flex justify-between text-[10px] text-kaspi-gray-500 mt-1">
                  <span>1 000 ₸</span>
                  <span>2 000 000 ₸</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-kaspi-gray-500 mb-1.5 block">
                  Количество продавцов: {merchants}
                </label>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={merchants}
                  onChange={(e) => setMerchants(Number(e.target.value))}
                  className="w-full accent-kaspi-red"
                />
                <div className="flex justify-between text-[10px] text-kaspi-gray-500 mt-1">
                  <span>1</span>
                  <span>200</span>
                </div>
              </div>

              <button
                onClick={predict}
                disabled={loading}
                className="w-full bg-kaspi-red text-white py-3 rounded-xl text-sm font-semibold hover:bg-kaspi-red-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={16} />
                    Предсказать
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {!result && !loading && (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-kaspi-gray-100 text-center">
              <Brain size={64} className="mx-auto text-kaspi-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-kaspi-dark mb-2">Готово к прогнозированию</h3>
              <p className="text-kaspi-gray-500 text-sm max-w-md mx-auto">
                Заполните параметры слева и нажмите &quot;Предсказать&quot; для получения прогноза продаж и рекомендации цены
              </p>
              <div className="mt-6 flex justify-center gap-6 text-xs text-kaspi-gray-500">
                <span className="flex items-center gap-1"><TrendingUp size={14} className="text-kaspi-red" /> Прогноз продаж</span>
                <span className="flex items-center gap-1"><Target size={14} className="text-kaspi-red" /> Рекомендация цены</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-kaspi-red/30 border-t-kaspi-red rounded-full animate-spin mx-auto" />
                <p className="mt-4 text-kaspi-gray-500 text-sm">Модель анализирует данные...</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-fade-in">
              {/* Predicted Sales */}
              <div className="bg-gradient-to-br from-kaspi-red to-kaspi-red-dark rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp size={24} />
                  <h3 className="text-lg font-semibold">Прогноз продаж</h3>
                </div>
                <p className="text-5xl font-bold mt-3">{formatNumber(result.predicted_sales)}</p>
                <p className="text-white/70 mt-2 text-sm">единиц за период</p>
              </div>

              {/* Price Recommendation */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={18} className="text-kaspi-red" />
                  <h3 className="text-sm font-semibold text-kaspi-dark">Рекомендация по цене</h3>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Минимум (10%)", value: result.price_recommendation.min, color: "#EF4444" },
                    { label: "Оптимальная", value: result.price_recommendation.optimal, color: "#22C55E" },
                    { label: "Медиана", value: result.price_recommendation.median, color: "#3B82F6" },
                    { label: "Максимум (90%)", value: result.price_recommendation.max, color: "#F59E0B" },
                  ].map((item) => (
                    <div key={item.label} className="bg-kaspi-gray-50 rounded-xl p-4 text-center">
                      <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: item.color }} />
                      <p className="text-lg font-bold text-kaspi-dark">{formatPrice(item.value)}</p>
                      <p className="text-[10px] text-kaspi-gray-500 mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
                {/* Price Bar */}
                <div className="mt-4 relative h-3 bg-kaspi-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-gradient-to-r from-red-400 via-green-400 to-yellow-400 rounded-full"
                    style={{ left: "0%", width: "100%" }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-kaspi-dark border-2 border-white shadow-md"
                    style={{
                      left: `${Math.min(100, Math.max(0, ((price - result.price_recommendation.min) / (result.price_recommendation.max - result.price_recommendation.min)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-kaspi-gray-500 mt-2 text-center">
                  Ваша цена: {formatPrice(price)} — {price <= result.price_recommendation.optimal ? "ниже оптимальной ✅" : price <= result.price_recommendation.median ? "в оптимальном диапазоне ✅" : "выше медианы ⚠️"}
                </p>
              </div>

              {/* Similar Products */}
              {result.similar_products.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
                  <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Похожие товары (конкуренты)</h3>
                  <div className="space-y-3">
                    {result.similar_products.map((p, i) => (
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
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-kaspi-gray-500">{formatPrice(p.sale_price)}</span>
                            <span className="text-[10px] text-kaspi-gray-500 flex items-center gap-0.5">
                              <Star size={10} className="text-yellow-400 fill-yellow-400" /> {p.product_rate}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-kaspi-dark">{formatNumber(p.sale_qty)}</p>
                          <p className="text-[10px] text-kaspi-gray-500">продано</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
