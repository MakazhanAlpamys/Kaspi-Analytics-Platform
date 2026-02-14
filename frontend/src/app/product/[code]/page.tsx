"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchAPI, formatPrice, formatNumber, formatRevenue, abcLabel, abcColor } from "../../lib/api";
import { Star, ShoppingCart, Users, Tag, ArrowLeft, ExternalLink, Brain, TrendingUp } from "lucide-react";

interface ProductDetail {
  product_code: string;
  product_name: string;
  brand_name: string;
  category_name: string;
  parent_category: string;
  sale_price: number;
  product_rate: number;
  review_qty: number;
  sale_qty: number;
  sale_amount: number;
  merchant_count: number;
  amount_abc: number;
  image_url: string;
  product_url: string;
  created_dt: string | null;
  last_sale_date: string | null;
  similar_products: {
    product_code: string;
    product_name: string;
    brand_name: string;
    sale_price: number;
    product_rate: number;
    sale_qty: number;
    image_url: string;
  }[];
  predicted_sales: number | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const code = params.code as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetchAPI<ProductDetail>(`/api/product/${code}`)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-12 h-12 border-4 border-kaspi-red/30 border-t-kaspi-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!product || "error" in product) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <p className="text-kaspi-gray-500 mb-4">Товар не найден</p>
        <Link href="/products" className="text-kaspi-red hover:underline">← Вернуться к каталогу</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto animate-fade-in">
      {/* Back */}
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-kaspi-gray-500 hover:text-kaspi-red mb-6 transition-colors">
        <ArrowLeft size={16} />
        Назад к каталогу
      </Link>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Image */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-kaspi-gray-100 flex items-center justify-center">
          <div className="relative w-full aspect-square max-w-[400px]">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.product_name} fill className="object-contain" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-kaspi-gray-300">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              </div>
            )}
            {/* ABC badge */}
            <span
              className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
              style={{ backgroundColor: abcColor(product.amount_abc) }}
            >
              {abcLabel(product.amount_abc)}
            </span>
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="mb-2">
            <span className="text-xs text-kaspi-gray-500 uppercase tracking-wider">{product.brand_name}</span>
          </div>
          <h1 className="text-2xl font-bold text-kaspi-dark mb-4 leading-tight">{product.product_name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  className={s <= Math.round(product.product_rate) ? "text-yellow-400 fill-yellow-400" : "text-kaspi-gray-300"}
                />
              ))}
            </div>
            <span className="text-sm font-semibold">{product.product_rate}</span>
            <span className="text-sm text-kaspi-gray-500">({formatNumber(product.review_qty)} отзывов)</span>
          </div>

          {/* Price */}
          <div className="bg-kaspi-gray-50 rounded-2xl p-5 mb-4">
            <p className="text-3xl font-bold text-kaspi-red">{formatPrice(product.sale_price)}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl p-4 border border-kaspi-gray-100">
              <div className="flex items-center gap-2 text-kaspi-gray-500 mb-1">
                <ShoppingCart size={14} />
                <span className="text-xs">Продано</span>
              </div>
              <p className="text-lg font-bold text-kaspi-dark">{formatNumber(product.sale_qty)} шт.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-kaspi-gray-100">
              <div className="flex items-center gap-2 text-kaspi-gray-500 mb-1">
                <TrendingUp size={14} />
                <span className="text-xs">Выручка</span>
              </div>
              <p className="text-lg font-bold text-kaspi-dark">{formatRevenue(product.sale_amount)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-kaspi-gray-100">
              <div className="flex items-center gap-2 text-kaspi-gray-500 mb-1">
                <Users size={14} />
                <span className="text-xs">Продавцов</span>
              </div>
              <p className="text-lg font-bold text-kaspi-dark">{product.merchant_count}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-kaspi-gray-100">
              <div className="flex items-center gap-2 text-kaspi-gray-500 mb-1">
                <Tag size={14} />
                <span className="text-xs">Категория</span>
              </div>
              <p className="text-sm font-medium text-kaspi-dark truncate">{product.category_name}</p>
            </div>
          </div>

          {/* Dates */}
          {(product.created_dt || product.last_sale_date) && (
            <div className="flex gap-4 text-xs text-kaspi-gray-500 mb-4">
              {product.created_dt && <span>Добавлен: {product.created_dt}</span>}
              {product.last_sale_date && <span>Последняя продажа: {product.last_sale_date}</span>}
            </div>
          )}

          {/* ML Prediction */}
          {product.predicted_sales !== null && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Brain size={16} />
                <span className="text-xs font-medium text-white/80">ML Прогноз продаж</span>
              </div>
              <p className="text-2xl font-bold">{formatNumber(product.predicted_sales)} шт.</p>
            </div>
          )}

          {/* External link */}
          {product.product_url && (
            <a
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-kaspi-red text-white px-6 py-3 rounded-xl font-medium hover:bg-kaspi-red-dark transition-colors"
            >
              Открыть на Kaspi.kz
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Similar Products */}
      {product.similar_products.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
          <h2 className="text-lg font-bold text-kaspi-dark mb-4">Похожие товары</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.similar_products.map((sp) => (
              <Link
                key={sp.product_code}
                href={`/product/${sp.product_code}`}
                className="group rounded-xl border border-kaspi-gray-100 overflow-hidden card-hover"
              >
                <div className="relative aspect-square bg-kaspi-gray-50 p-2">
                  {sp.image_url ? (
                    <Image src={sp.image_url} alt={sp.product_name} fill className="object-contain p-2" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-kaspi-gray-300 text-xs">—</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-kaspi-gray-500">{sp.brand_name}</p>
                  <p className="text-xs font-medium text-kaspi-dark line-clamp-2 leading-4 h-8">{sp.product_name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs">{sp.product_rate}</span>
                  </div>
                  <p className="text-sm font-bold text-kaspi-dark mt-1">{formatPrice(sp.sale_price)}</p>
                  <p className="text-[10px] text-kaspi-gray-500">Продано: {formatNumber(sp.sale_qty)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
