"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchAPI, formatPrice, formatNumber, abcLabel, abcColor } from "../lib/api";
import { Search, SlidersHorizontal, Star, ChevronLeft, ChevronRight, ExternalLink, X, Download } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";

interface Product {
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
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface Filters {
  categories: string[];
  brands: string[];
  parent_categories: string[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [abc, setAbc] = useState<number | "">("");
  const [sortBy, setSortBy] = useState("sale_amount");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filters, setFilters] = useState<Filters | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const perPage = viewMode === "grid" ? 30 : 20;

  useEffect(() => {
    fetchAPI<Filters>("/api/filters").then(setFilters);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
    });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (abc !== "") params.set("abc", abc.toString());

    try {
      const data = await fetchAPI<ProductsResponse>(`/api/products?${params}`);
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [page, perPage, search, category, brand, abc, sortBy, sortOrder]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setCategory("");
    setBrand("");
    setAbc("");
    setPage(1);
  };

  const hasActiveFilters = search || category || brand || abc !== "";

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-kaspi-dark">Товары</h1>
          <p className="text-kaspi-gray-500 mt-1">
            {formatNumber(total)} товаров
            {hasActiveFilters && " (с фильтрами)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const params = new URLSearchParams({ format: "xlsx" });
              if (search) params.set("search", search);
              if (category) params.set("category", category);
              if (brand) params.set("brand", brand);
              if (abc !== "") params.set("abc", abc.toString());
              window.open(`http://localhost:8000/api/export/products?${params}`, "_blank");
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <Download size={14} />
            Excel
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams({ format: "csv" });
              if (search) params.set("search", search);
              if (category) params.set("category", category);
              if (brand) params.set("brand", brand);
              if (abc !== "") params.set("abc", abc.toString());
              window.open(`http://localhost:8000/api/export/products?${params}`, "_blank");
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Download size={14} />
            CSV
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-kaspi-red text-white" : isDark ? "bg-[#2C2C2E] text-kaspi-gray-500 hover:bg-[#3A3A3C]" : "bg-white text-kaspi-gray-500 hover:bg-kaspi-gray-100"}`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><rect width="7" height="7" rx="1.5"/><rect x="11" width="7" height="7" rx="1.5"/><rect y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-kaspi-red text-white" : isDark ? "bg-[#2C2C2E] text-kaspi-gray-500 hover:bg-[#3A3A3C]" : "bg-white text-kaspi-gray-500 hover:bg-kaspi-gray-100"}`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><rect width="18" height="3" rx="1.5"/><rect y="5" width="18" height="3" rx="1.5"/><rect y="10" width="18" height="3" rx="1.5"/><rect y="15" width="18" height="3" rx="1.5"/></svg>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-kaspi-gray-100 mb-6">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-kaspi-gray-300" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Поиск по названию или бренду..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-sm focus:outline-none focus:border-kaspi-red focus:ring-1 focus:ring-kaspi-red/20 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-kaspi-red text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-kaspi-red-dark transition-colors"
          >
            Найти
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              showFilters ? "bg-kaspi-dark text-white border-kaspi-dark" : isDark ? "bg-[#2C2C2E] text-kaspi-gray-300 border-[#3A3A3C] hover:border-kaspi-gray-300" : "bg-white text-kaspi-gray-700 border-kaspi-gray-100 hover:border-kaspi-gray-300"
            }`}
          >
            <SlidersHorizontal size={16} />
            Фильтры
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs text-kaspi-red hover:bg-kaspi-red/5 transition-colors">
              <X size={14} /> Сбросить
            </button>
          )}
        </div>

        {/* Expandable Filters */}
        {showFilters && filters && (
          <div className="mt-4 pt-4 border-t border-kaspi-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3 animate-fade-in">
            <div>
              <label className="text-xs font-medium text-kaspi-gray-500 mb-1 block">Категория</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-sm focus:outline-none focus:border-kaspi-red"
              >
                <option value="">Все категории</option>
                {filters.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-kaspi-gray-500 mb-1 block">Бренд</label>
              <select
                value={brand}
                onChange={(e) => { setBrand(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-sm focus:outline-none focus:border-kaspi-red"
              >
                <option value="">Все бренды</option>
                {filters.brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-kaspi-gray-500 mb-1 block">ABC класс</label>
              <select
                value={abc}
                onChange={(e) => { setAbc(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-sm focus:outline-none focus:border-kaspi-red"
              >
                <option value="">Все классы</option>
                <option value="1">A — Лидеры</option>
                <option value="2">B — Средние</option>
                <option value="3">C — Аутсайдеры</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-kaspi-gray-500 mb-1 block">Сортировка</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split("-");
                  setSortBy(sb);
                  setSortOrder(so);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-kaspi-gray-100 bg-kaspi-gray-50 text-sm focus:outline-none focus:border-kaspi-red"
              >
                <option value="sale_amount-desc">По выручке ↓</option>
                <option value="sale_amount-asc">По выручке ↑</option>
                <option value="sale_price-desc">По цене ↓</option>
                <option value="sale_price-asc">По цене ↑</option>
                <option value="product_rate-desc">По рейтингу ↓</option>
                <option value="sale_qty-desc">По продажам ↓</option>
                <option value="review_qty-desc">По отзывам ↓</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-kaspi-red/30 border-t-kaspi-red rounded-full animate-spin" />
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 stagger">
          {products.map((p, i) => (
            <ProductCard key={`${p.product_code}-${i}`} product={p} />
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-kaspi-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-kaspi-gray-100 bg-kaspi-gray-50">
                <th className="text-left p-3 text-kaspi-gray-500 font-medium text-xs">Товар</th>
                <th className="text-left p-3 text-kaspi-gray-500 font-medium text-xs">Бренд</th>
                <th className="text-right p-3 text-kaspi-gray-500 font-medium text-xs">Цена</th>
                <th className="text-center p-3 text-kaspi-gray-500 font-medium text-xs">Рейтинг</th>
                <th className="text-right p-3 text-kaspi-gray-500 font-medium text-xs">Продано</th>
                <th className="text-right p-3 text-kaspi-gray-500 font-medium text-xs">Выручка</th>
                <th className="text-center p-3 text-kaspi-gray-500 font-medium text-xs">ABC</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={`${p.product_code}-${i}`} className="border-b border-kaspi-gray-100 hover:bg-kaspi-gray-100 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-kaspi-gray-50 flex-shrink-0 overflow-hidden">
                        {p.image_url ? (
                          <Image src={p.image_url} alt="" width={40} height={40} className="w-full h-full object-contain" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-kaspi-gray-300 text-xs">—</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-kaspi-dark hover:text-kaspi-red line-clamp-2 transition-colors">
                          {p.product_name}
                        </a>
                        <p className="text-[10px] text-kaspi-gray-500 mt-0.5">{p.category_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-kaspi-gray-700">{p.brand_name}</td>
                  <td className="p-3 text-xs font-semibold text-right text-kaspi-dark">{formatPrice(p.sale_price)}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      {p.product_rate}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-right">{formatNumber(p.sale_qty)}</td>
                  <td className="p-3 text-xs text-right font-medium">{formatNumber(p.sale_amount)} ₸</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: abcColor(p.amount_abc) }}>
                      {abcLabel(p.amount_abc)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`p-2 rounded-xl border border-kaspi-gray-100 text-kaspi-gray-500 hover:border-kaspi-gray-300 disabled:opacity-30 transition-colors ${isDark ? "bg-[#2C2C2E]" : "bg-white"}`}
          >
            <ChevronLeft size={18} />
          </button>
          
          {getPageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-kaspi-gray-300 text-sm">...</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                  page === p
                    ? "bg-kaspi-red text-white"
                    : isDark ? "bg-[#2C2C2E] border border-kaspi-gray-100 text-kaspi-gray-300 hover:border-kaspi-gray-300" : "bg-white border border-kaspi-gray-100 text-kaspi-gray-700 hover:border-kaspi-gray-300"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`p-2 rounded-xl border border-kaspi-gray-100 text-kaspi-gray-500 hover:border-kaspi-gray-300 disabled:opacity-30 transition-colors ${isDark ? "bg-[#2C2C2E]" : "bg-white"}`}
          >
            <ChevronRight size={18} />
          </button>

          <span className="text-xs text-kaspi-gray-500 ml-3">
            Стр. {page} из {formatNumber(totalPages)}
          </span>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  return (
    <Link href={`/product/${p.product_code}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-kaspi-gray-100 card-hover group block">
      {/* Image */}
      <div className="relative aspect-square bg-kaspi-gray-50 p-3">
        {p.image_url ? (
          <Image src={p.image_url} alt={p.product_name} fill className="object-contain p-2" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-kaspi-gray-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          </div>
        )}
        {/* ABC Badge */}
        <span
          className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: abcColor(p.amount_abc) }}
        >
          {abcLabel(p.amount_abc)}
        </span>
        {/* Link */}
        {p.product_url && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(p.product_url, '_blank', 'noopener,noreferrer'); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ExternalLink size={13} className="text-kaspi-gray-700" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[10px] text-kaspi-gray-500 mb-1">{p.brand_name}</p>
        <h3 className="text-xs font-medium text-kaspi-dark line-clamp-2 leading-4 h-8">{p.product_name}</h3>

        <div className="flex items-center gap-1 mt-2">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-medium">{p.product_rate}</span>
          <span className="text-[10px] text-kaspi-gray-500">({formatNumber(p.review_qty)})</span>
        </div>

        <p className="text-base font-bold text-kaspi-dark mt-2">{formatPrice(p.sale_price)}</p>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-kaspi-gray-100">
          <span className="text-[10px] text-kaspi-gray-500">Продано: {formatNumber(p.sale_qty)}</span>
          <span className="text-[10px] text-kaspi-gray-500">{p.merchant_count} продавцов</span>
        </div>
      </div>
    </Link>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
