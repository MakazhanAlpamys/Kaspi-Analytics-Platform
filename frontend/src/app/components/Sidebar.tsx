"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";
import { fetchAPI, formatPrice } from "../lib/api";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Award,
  Brain,
  Target,
  Swords,
  Clock,
  Grid3X3,
  GitCompareArrows,
  Sun,
  Moon,
  Search,
  X,
  Calculator,
  PieChart,
  Lightbulb,
} from "lucide-react";

interface SearchResult {
  product_code?: string;
  product_name?: string;
  sale_price?: number;
  image_url?: string;
  name?: string;
  type: string;
}

const navItems = [
  { href: "/", label: "Дашборд", icon: LayoutDashboard },
  { href: "/products", label: "Товары", icon: Package },
  { href: "/categories", label: "Категории", icon: BarChart3 },
  { href: "/brands", label: "Бренды", icon: Award },
  { href: "/niches", label: "Поиск ниш", icon: Target },
  { href: "/competition", label: "Конкуренция", icon: Swords },
  { href: "/time", label: "Время", icon: Clock },
  { href: "/correlation", label: "Корреляция", icon: Grid3X3 },
  { href: "/compare", label: "Сравнение", icon: GitCompareArrows },
  { href: "/predict", label: "ML Прогнозы", icon: Brain },
  { href: "/calculator", label: "Ценовой калькулятор", icon: Calculator },
  { href: "/pareto", label: "ABC / Парето", icon: PieChart },
  { href: "/recommender", label: "Что продавать?", icon: Lightbulb },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<{ products: SearchResult[]; categories: SearchResult[]; brands: SearchResult[] }>({ products: [], categories: [], brands: [] });
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const doSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setResults({ products: [], categories: [], brands: [] });
      return;
    }
    setSearching(true);
    try {
      const data = await fetchAPI<typeof results>(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch {
      setResults({ products: [], categories: [], brands: [] });
    }
    setSearching(false);
  };

  const navigate = (path: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(path);
  };

  const hasResults = results.products.length > 0 || results.categories.length > 0 || results.brands.length > 0;

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-[260px] bg-kaspi-dark flex flex-col z-50">
        {/* Logo */}
        <div className="p-6 pb-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/kaspi-full.svg"
              alt="Kaspi"
              width={120}
              height={32}
              className="brightness-0 invert"
            />
          </Link>
          <p className="text-kaspi-gray-500 text-xs mt-2 tracking-wide uppercase flex items-center justify-between">
            Analytics Platform
            <button
              onClick={toggleTheme}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-kaspi-gray-500 hover:bg-white/10 hover:text-white transition-all"
              title={theme === "light" ? "Тёмная тема" : "Светлая тема"}
            >
              {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </p>
        </div>

        {/* Search Button */}
        <div className="px-3 pt-3">
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 text-kaspi-gray-500 text-xs hover:bg-white/10 transition-colors"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Поиск...</span>
            <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Ctrl+K</kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-kaspi-red text-white shadow-lg shadow-kaspi-red/25"
                      : "text-kaspi-gray-300 hover:bg-white/8 hover:text-white"
                  }
                `}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-kaspi-gray-300 text-xs">Данные</p>
            <p className="text-white text-lg font-bold">210 000</p>
            <p className="text-kaspi-gray-500 text-xs">товаров Kaspi.kz</p>
          </div>
        </div>
      </aside>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div ref={searchRef} className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl border border-kaspi-gray-100 overflow-hidden animate-fade-in">
            {/* Search input */}
            <div className="flex items-center gap-3 p-4 border-b border-kaspi-gray-100">
              <Search size={20} className="text-kaspi-gray-300 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => doSearch(e.target.value)}
                placeholder="Поиск товаров, категорий, брендов..."
                className="flex-1 text-sm outline-none bg-transparent text-kaspi-dark placeholder:text-kaspi-gray-300"
                autoFocus
              />
              <button onClick={() => setSearchOpen(false)} className="text-kaspi-gray-300 hover:text-kaspi-dark transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Results */}
            {hasResults && (
              <div className="max-h-[50vh] overflow-y-auto">
                {results.products.length > 0 && (
                  <div className="p-2">
                    <p className="text-[10px] uppercase tracking-wider text-kaspi-gray-500 px-2 py-1">Товары</p>
                    {results.products.map((r) => (
                      <button
                        key={r.product_code}
                        onClick={() => navigate(`/product/${r.product_code}`)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-kaspi-gray-100 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-kaspi-gray-50 flex-shrink-0 overflow-hidden">
                          {r.image_url ? (
                            <img src={r.image_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-kaspi-gray-300 text-[10px]">—</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-kaspi-dark truncate">{r.product_name}</p>
                          <p className="text-[10px] text-kaspi-gray-500">{formatPrice(r.sale_price || 0)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {results.categories.length > 0 && (
                  <div className="p-2 border-t border-kaspi-gray-100">
                    <p className="text-[10px] uppercase tracking-wider text-kaspi-gray-500 px-2 py-1">Категории</p>
                    {results.categories.map((r) => (
                      <button
                        key={r.name}
                        onClick={() => navigate(`/categories?selected=${encodeURIComponent(r.name || "")}`)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-kaspi-gray-100 transition-colors text-left"
                      >
                        <BarChart3 size={16} className="text-kaspi-gray-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-kaspi-dark">{r.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.brands.length > 0 && (
                  <div className="p-2 border-t border-kaspi-gray-100">
                    <p className="text-[10px] uppercase tracking-wider text-kaspi-gray-500 px-2 py-1">Бренды</p>
                    {results.brands.map((r) => (
                      <button
                        key={r.name}
                        onClick={() => navigate(`/brands?selected=${encodeURIComponent(r.name || "")}`)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-kaspi-gray-100 transition-colors text-left"
                      >
                        <Award size={16} className="text-kaspi-gray-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-kaspi-dark">{r.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No results */}
            {searchQuery.length >= 2 && !searching && !hasResults && (
              <div className="p-8 text-center">
                <p className="text-sm text-kaspi-gray-500">Ничего не найдено</p>
              </div>
            )}

            {/* Loading */}
            {searching && (
              <div className="p-6 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-kaspi-red/30 border-t-kaspi-red rounded-full animate-spin" />
              </div>
            )}

            {/* Hints */}
            {searchQuery.length < 2 && (
              <div className="p-6 text-center">
                <p className="text-xs text-kaspi-gray-500">Введите минимум 2 символа для поиска</p>
                <p className="text-[10px] text-kaspi-gray-300 mt-1">Esc для закрытия</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
