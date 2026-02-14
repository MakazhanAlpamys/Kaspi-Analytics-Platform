"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "../lib/api";
import { Grid3X3 } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";

interface CorrelationData {
  matrix: { x: string; y: string; value: number; xi: number; yi: number }[];
  labels: string[];
}

export default function CorrelationPage() {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ x: string; y: string; value: number } | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchAPI<CorrelationData>("/api/correlation")
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
  const labelFill = isDark ? "#E5E5EA" : "#1D1D1F";
  const hoverStroke = isDark ? "#F2F2F7" : "#1D1D1F";

  const getColor = (value: number): string => {
    if (value >= 0.7) return "#166534";
    if (value >= 0.4) return "#22C55E";
    if (value >= 0.2) return "#86EFAC";
    if (value >= 0) return "#FEF3C7";
    if (value >= -0.2) return "#FDE68A";
    if (value >= -0.4) return "#F87171";
    return "#DC2626";
  };

  const getTextColor = (value: number): string => {
    if (Math.abs(value) >= 0.5) return "#FFFFFF";
    return "#1D1D1F";
  };

  const cellSize = 90;
  const labelWidth = 100;

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-kaspi-dark flex items-center gap-3">
          <Grid3X3 className="text-kaspi-red" size={32} />
          Корреляционная матрица
        </h1>
        <p className="text-kaspi-gray-500 mt-1">
          Связи между ценой, рейтингом, отзывами, продажами, продавцами и выручкой
        </p>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-kaspi-gray-100 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-medium text-kaspi-dark mb-2">Шкала корреляции</p>
            <div className="flex items-center gap-1">
              {[
                { value: -1, label: "-1.0", color: "#DC2626" },
                { value: -0.5, label: "-0.5", color: "#F87171" },
                { value: 0, label: "0", color: "#FEF3C7" },
                { value: 0.5, label: "0.5", color: "#22C55E" },
                { value: 1, label: "1.0", color: "#166534" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center">
                  <div className="w-12 h-6 rounded" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-kaspi-gray-500 mt-1">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          {hoveredCell && (
            <div className="bg-kaspi-dark text-white px-4 py-3 rounded-xl text-sm animate-fade-in">
              <span className="font-bold">{hoveredCell.x}</span> × <span className="font-bold">{hoveredCell.y}</span>:
              <span className="ml-2 font-mono text-lg">{hoveredCell.value.toFixed(3)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100 mb-6 overflow-x-auto">
        <div className="inline-block">
          <svg
            width={labelWidth + data.labels.length * cellSize + 20}
            height={labelWidth + data.labels.length * cellSize + 20}
          >
            {/* Column labels */}
            {data.labels.map((label, i) => (
              <text
                key={`col-${i}`}
                x={labelWidth + i * cellSize + cellSize / 2}
                y={labelWidth - 10}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill={labelFill}
              >
                {label}
              </text>
            ))}

            {/* Row labels */}
            {data.labels.map((label, i) => (
              <text
                key={`row-${i}`}
                x={labelWidth - 10}
                y={labelWidth + i * cellSize + cellSize / 2 + 4}
                textAnchor="end"
                fontSize={12}
                fontWeight={600}
                fill={labelFill}
              >
                {label}
              </text>
            ))}

            {/* Cells */}
            {data.matrix.map((cell, i) => (
              <g key={i}>
                <rect
                  x={labelWidth + cell.xi * cellSize}
                  y={labelWidth + cell.yi * cellSize}
                  width={cellSize - 2}
                  height={cellSize - 2}
                  rx={8}
                  fill={getColor(cell.value)}
                  stroke={hoveredCell?.x === cell.x && hoveredCell?.y === cell.y ? hoverStroke : "transparent"}
                  strokeWidth={2}
                  style={{ cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                />
                <text
                  x={labelWidth + cell.xi * cellSize + (cellSize - 2) / 2}
                  y={labelWidth + cell.yi * cellSize + (cellSize - 2) / 2 + 5}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={700}
                  fill={getTextColor(cell.value)}
                  style={{ pointerEvents: "none" }}
                >
                  {cell.value.toFixed(2)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-kaspi-gray-100">
        <h3 className="text-sm font-semibold text-kaspi-dark mb-4">Интерпретация</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="font-semibold text-green-800 mb-1">Сильная положительная корреляция (&gt;0.5)</p>
            <p className="text-green-700 text-xs">Переменные растут вместе. Например, количество отзывов и продаж обычно имеют высокую корреляцию.</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <p className="font-semibold text-red-800 mb-1">Отрицательная корреляция (&lt;-0.2)</p>
            <p className="text-red-700 text-xs">Когда одна переменная растёт, другая падает. Например, цена и количество продаж часто имеют отрицательную связь.</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <p className="font-semibold text-yellow-800 mb-1">Слабая корреляция (~0)</p>
            <p className="text-yellow-700 text-xs">Переменные практически не связаны. Изменение одной не влияет на другую.</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="font-semibold text-blue-800 mb-1">Диагональ = 1.0</p>
            <p className="text-blue-700 text-xs">Каждая переменная идеально коррелирует сама с собой — это нормально.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
