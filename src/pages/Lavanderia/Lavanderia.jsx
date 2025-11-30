import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import { getStock, upsertStock, updateDamage } from "../../api/lavanderia";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const CATEGORIES = [
  { key: "TOALLAS_GRANDE", label: "Toalla grande" },
  { key: "TOALLAS_MEDIANA", label: "Toalla mediana" },
  { key: "TOALLAS_CHICA", label: "Toalla chica" },
  { key: "SABANAS_MEDIA", label: "Sábana 1/2 plaza" },
  { key: "SABANAS_UNA", label: "Sábana 1 plaza" },
  { key: "CUBRECAMAS_MEDIA", label: "Cubrecama 1/2 plaza" },
  { key: "CUBRECAMAS_UNA", label: "Cubrecama 1 plaza" },
  { key: "FUNDAS", label: "Funda de almohada" },
];

const Lavanderia = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingValues, setEditingValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const st = await getStock();
      setStock(st);
      // Limpiar valores de edición después de actualizar
      setEditingValues({});
    } catch (e) {
      setError("No se pudo cargar lavandería");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Lavandería - Administrador - Hotel Plaza Trujillo";
    fetchAll();
  }, []);

  const stockMap = useMemo(() => {
    const map = {};
    stock.forEach((s) => {
      map[s.category] = {
        ...s,
        total: s.total || 0,
        disponible: s.disponible || 0,
        lavanderia: s.lavanderia || 0,
        danado: s.danado || 0,
      };
    });
    return map;
  }, [stock]);

  // Calcular totales para las tarjetas (suma de todos los artículos en la tabla)
  // Usa stockMap para asegurar que usa exactamente los mismos datos que se muestran en la tabla
  const totals = useMemo(() => {
    let totalInventario = 0;
    let totalDisponible = 0;
    let totalLavanderia = 0;
    let totalDanado = 0;
    
    // Sumar todos los valores de cada artículo en la tabla (usando las mismas categorías que se muestran)
    CATEGORIES.forEach((c) => {
      const s = stockMap[c.key] || { total: 0, disponible: 0, lavanderia: 0, danado: 0 };
      
      const total = Number(s.total) || 0;
      const disponible = Number(s.disponible) || 0;
      const lavanderia = Number(s.lavanderia) || 0;
      const danado = Number(s.danado) || 0;
      
      totalInventario += total;
      totalDisponible += disponible;
      totalLavanderia += lavanderia;
      totalDanado += danado;
    });
    
    return {
      total: totalInventario,
      disponible: totalDisponible,
      lavanderia: totalLavanderia,
      danado: totalDanado,
    };
  }, [stockMap]);

  // Tarjetas de resumen
  const summaryCards = [
    {
      id: 1,
      title: "Total Inventario",
      amount: totals.total,
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      id: 2,
      title: "Total Disponibles",
      amount: totals.disponible,
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      id: 3,
      title: "En Lavandería",
      amount: totals.lavanderia,
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      id: 4,
      title: "Dañados",
      amount: totals.danado,
      icon: (
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      bgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
  ];

  const handleInputChange = (category, field, value) => {
    // Guardar el valor temporal mientras el usuario escribe
    const key = `${category}_${field}`;
    // Permitir valores vacíos mientras se escribe
    setEditingValues((prev) => ({
      ...prev,
      [key]: value === "" ? "" : value,
    }));
  };

  const handleInputBlur = async (category, field, value) => {
    if (isSaving) return; // Evitar múltiples guardados simultáneos
    
    const key = `${category}_${field}`;
    const current = stockMap[category] || { category, total: 0, disponible: 0, lavanderia: 0, danado: 0 };
    
    // Convertir el valor a número, usando el valor actual si está vacío o es inválido
    let v;
    if (value === "" || value === null || value === undefined) {
      v = current[field];
    } else {
      const parsed = parseInt(value, 10);
      v = isNaN(parsed) ? current[field] : Math.max(0, parsed);
    }
    
    // Si el valor no cambió, solo limpiar el estado de edición
    if (current[field] === v) {
      setEditingValues((prev) => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });
      return;
    }
    
    setIsSaving(true);
    setError(""); // Limpiar errores previos
    
    // Limpiar el valor temporal antes de guardar
    setEditingValues((prev) => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
    
    // Validación básica en frontend
    if (field === "disponible") {
      // Validar que disponible no exceda el total
      if (v > current.total) {
        setError(`Disponibles (${v}) no puede exceder el total (${current.total})`);
        setIsSaving(false);
        return;
      }
    } else if (field === "lavanderia") {
      // Validar que sucias + dañadas no excedan el total
      if (v + current.danado > current.total) {
        setError(`La suma de sucias (${v}) y dañadas (${current.danado}) no puede exceder el total (${current.total})`);
        setIsSaving(false);
        return;
      }
    } else if (field === "danado") {
      // Validar que sucias + dañadas no excedan el total
      if (current.lavanderia + v > current.total) {
        setError(`La suma de sucias (${current.lavanderia}) y dañadas (${v}) no puede exceder el total (${current.total})`);
        setIsSaving(false);
        return;
      }
    }
    
    // Preparar el objeto para enviar (solo el campo que se está editando)
    const updatePayload = { category };
    updatePayload[field] = v;
    
    try {
      await upsertStock([updatePayload]);
      await fetchAll();
      setError(""); // Limpiar error si fue exitoso
    } catch (e) {
      const errorMsg = e?.response?.data?.error || e?.message || "No se pudo actualizar stock";
      setError(errorMsg);
      // Restaurar el valor en caso de error
      setEditingValues((prev) => ({
        ...prev,
        [key]: current[field],
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputKeyDown = (e, category, field) => {
    if (e.key === "Enter") {
      e.target.blur();
    } else if (e.key === "Escape") {
      // Cancelar edición
      const key = `${category}_${field}`;
      setEditingValues((prev) => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });
      e.target.blur();
    }
  };

  const handleDamage = async (category, quantity, action) => {
    try {
      await updateDamage(category, quantity, action);
      await fetchAll();
    } catch (e) {
      setError("No se pudo actualizar dañados");
    }
  };

  // Componente de placeholder para las tarjetas
  const CardSkeleton = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6 animate-pulse">
      <div className="flex items-center justify-center w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      <div className="flex items-end justify-between mt-5">
        <div className="w-full">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    </div>
  );

  // Componente de placeholder para las filas de la tabla
  const TableRowSkeleton = () => (
    <TableRow>
      <TableCell className="py-3.5 px-2 sm:px-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
      </TableCell>
      <TableCell className="py-3.5 px-2 sm:px-4 text-center">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto animate-pulse"></div>
      </TableCell>
      <TableCell className="py-3.5 px-2 sm:px-4 text-center">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto animate-pulse"></div>
      </TableCell>
      <TableCell className="py-3.5 px-2 sm:px-4 text-center">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto animate-pulse"></div>
      </TableCell>
      <TableCell className="py-3.5 px-2 sm:px-4 text-center">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto animate-pulse"></div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      {/* Header con botones */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Lavandería
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Administra el inventario de lavandería
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchAll}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading && stock.length === 0 ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          summaryCards.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-900 dark:bg-black md:p-6"
            >
              <div className={`flex items-center justify-center w-12 h-12 ${card.bgColor} rounded-xl`}>
                <div className={card.iconColor}>{card.icon}</div>
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {card.title}
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    {card.amount}
                  </h4>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabla de Stock */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Inventario de Stock
          </h3>
          <p className="text-gray-500 text-theme-sm dark:text-gray-400 mb-4">
            Gestión de disponibles, sucias y dañadas por artículo
          </p>

      {error && (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 dark:bg-red-900/30 dark:text-red-200 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="text-red-700 dark:text-red-200 hover:text-red-900"
              >
                ✕
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Artículo
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                    >
                      Total
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                    >
                      Disponibles
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                    >
                      Sucias
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                    >
                      Dañadas
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading && stock.length === 0 ? (
                    <>
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                    </>
                  ) : (
                    CATEGORIES.map((c) => {
                      const s = stockMap[c.key] || { total: 0, disponible: 0, lavanderia: 0, danado: 0 };
                      return (
                        <TableRow key={c.key}>
                          <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {c.label}
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 text-center">
                            <input
                              type="number"
                              min={0}
                              value={editingValues[`${c.key}_total`] !== undefined ? editingValues[`${c.key}_total`] : (s.total || 0)}
                              onChange={(e) => handleInputChange(c.key, "total", e.target.value)}
                              onBlur={(e) => handleInputBlur(c.key, "total", e.target.value)}
                              onKeyDown={(e) => handleInputKeyDown(e, c.key, "total")}
                              disabled={isSaving}
                              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-center text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-black dark:text-white dark:border-gray-700"
                              title="Total de inventario del hotel"
                            />
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 text-center">
                            <input
                              type="number"
                              min={0}
                              max={s.total || 0}
                              value={editingValues[`${c.key}_disponible`] !== undefined ? editingValues[`${c.key}_disponible`] : (s.disponible || 0)}
                              onChange={(e) => {
                                const val = parseInt(e.target.value || 0, 10);
                                const maxVal = s.total || 0;
                                if (val <= maxVal) {
                                  handleInputChange(c.key, "disponible", e.target.value);
                                }
                              }}
                              onBlur={(e) => handleInputBlur(c.key, "disponible", e.target.value)}
                              onKeyDown={(e) => handleInputKeyDown(e, c.key, "disponible")}
                              disabled={isSaving}
                              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-center text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-black dark:text-white dark:border-gray-700"
                              title={`Máximo: ${(s.total || 0)} (total del inventario)`}
                            />
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 text-center">
                            <input
                              type="number"
                              min={0}
                              value={editingValues[`${c.key}_lavanderia`] !== undefined ? editingValues[`${c.key}_lavanderia`] : (s.lavanderia || 0)}
                              onChange={(e) => handleInputChange(c.key, "lavanderia", e.target.value)}
                              onBlur={(e) => handleInputBlur(c.key, "lavanderia", e.target.value)}
                              onKeyDown={(e) => handleInputKeyDown(e, c.key, "lavanderia")}
                              disabled={isSaving}
                              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-center text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-black dark:text-white dark:border-gray-700"
                              title={`Máximo: ${(s.total || 0) - (s.danado || 0)} (total - dañadas)`}
                            />
                          </TableCell>
                          <TableCell className="py-3.5 px-2 sm:px-4 text-center">
                            <input
                              type="number"
                              min={0}
                              value={editingValues[`${c.key}_danado`] !== undefined ? editingValues[`${c.key}_danado`] : (s.danado || 0)}
                              onChange={(e) => handleInputChange(c.key, "danado", e.target.value)}
                              onBlur={(e) => handleInputBlur(c.key, "danado", e.target.value)}
                              onKeyDown={(e) => handleInputKeyDown(e, c.key, "danado")}
                              disabled={isSaving}
                              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-center text-gray-800 focus:border-orange-300 focus:outline-hidden focus:ring-3 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-black dark:text-white dark:border-gray-700"
                              title={`Máximo: ${(s.total || 0) - (s.lavanderia || 0)} (total - sucias)`}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
                  </div>
                </div>
              </div>
            </div>
    </div>
  );
};

export default Lavanderia;

