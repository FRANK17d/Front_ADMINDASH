import React, { useEffect, useState } from "react";
import { PlusIcon } from "../../icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";

const Lavanderia = () => {
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    document.title = "Control de Lavandería - Administrador - Hotel Plaza Trujillo";

    // Datos de ejemplo para el inventario de textiles
    setInventory([
      {
        id: 1,
        article: "Toallas",
        total: 450,
        disponible: 320,
        enLavanderia: 100,
        danado: 30,
        estado: "Normal",
      },
      {
        id: 2,
        article: "Sábanas",
        total: 380,
        disponible: 250,
        enLavanderia: 110,
        danado: 20,
        estado: "Normal",
      },
      {
        id: 3,
        article: "Fundas de Almohada",
        total: 520,
        disponible: 380,
        enLavanderia: 120,
        danado: 20,
        estado: "Normal",
      },
      {
        id: 4,
        article: "Cobertores",
        total: 180,
        disponible: 140,
        enLavanderia: 30,
        danado: 10,
        estado: "Normal",
      },
      {
        id: 5,
        article: "Mantas",
        total: 150,
        disponible: 120,
        enLavanderia: 20,
        danado: 10,
        estado: "Bajo Stock",
      },
    ]);

    // Datos de ejemplo para los últimos movimientos
    setMovements([
      {
        id: 1,
        fechaEnvio: "2025-01-15",
        habitacion: "101",
        toallas: 4,
        sabanas: 2,
        fundas: 4,
        estado: "En Lavandería",
        fechaRetorno: "-",
      },
      {
        id: 2,
        fechaEnvio: "2025-01-15",
        habitacion: "205",
        toallas: 6,
        sabanas: 3,
        fundas: 6,
        estado: "En Lavandería",
        fechaRetorno: "-",
      },
      {
        id: 3,
        fechaEnvio: "2025-01-14",
        habitacion: "302",
        toallas: 4,
        sabanas: 2,
        fundas: 4,
        estado: "Retornado",
        fechaRetorno: "2025-01-15",
      },
      {
        id: 4,
        fechaEnvio: "2025-01-14",
        habitacion: "110",
        toallas: 4,
        sabanas: 2,
        fundas: 4,
        estado: "Retornado",
        fechaRetorno: "2025-01-15",
      },
      {
        id: 5,
        fechaEnvio: "2025-01-13",
        habitacion: "201",
        toallas: 6,
        sabanas: 3,
        fundas: 6,
        estado: "Retornado",
        fechaRetorno: "2025-01-14",
      },
      {
        id: 6,
        fechaEnvio: "2025-01-13",
        habitacion: "105",
        toallas: 4,
        sabanas: 2,
        fundas: 4,
        estado: "Retornado",
        fechaRetorno: "2025-01-14",
      },
    ]);
  }, []);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Normal":
        return "success";
      case "Bajo Stock":
        return "warning";
      case "Crítico":
        return "error";
      case "En Lavandería":
        return "info";
      case "Retornado":
        return "success";
      default:
        return "light";
    }
  };

  const handleEnviarLavanderia = () => {
    // Función para enviar a lavandería
    console.log("Enviar a lavandería");
  };

  const handleRegistrarRetorno = () => {
    // Función para registrar retorno
    console.log("Registrar retorno");
  };

  return (
    <div className="space-y-6">
      {/* Header con botones */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Control de Lavandería
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Gestión de textiles y rotación
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRegistrarRetorno}
            variant="outline"
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Registrar Retorno
          </Button>
          <Button
            onClick={handleEnviarLavanderia}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5 fill-current" />
            Enviar a Lavandería
          </Button>
        </div>
      </div>

      {/* Tabla de Inventario de Textiles */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Inventario de Textiles
          </h3>
          <p className="text-gray-500 text-theme-sm dark:text-gray-400 mb-4">
            Control de stock y estado de los textiles del hotel
          </p>
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
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Total
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Disponible
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell"
                    >
                      En Lavandería
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                    >
                      Dañado
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                    >
                      Estado
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {item.article}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-gray-800 text-theme-sm dark:text-white/90 font-semibold">
                        {item.total}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-green-600 dark:text-green-400 text-theme-sm font-semibold">
                        {item.disponible}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-blue-600 dark:text-blue-400 text-theme-sm font-semibold hidden md:table-cell">
                        {item.enLavanderia}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-red-600 dark:text-red-400 text-theme-sm font-semibold hidden lg:table-cell">
                        {item.danado}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4">
                        <Badge size="sm" color={getStatusBadgeColor(item.estado)}>
                          {item.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Últimos Movimientos */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Últimos Movimientos
          </h3>
          <p className="text-gray-500 text-theme-sm dark:text-gray-400 mb-4">
            Historial de envíos y retornos de textiles
          </p>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Fecha Envío
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Habitación
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Toallas
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell"
                    >
                      Sábanas
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden lg:table-cell"
                    >
                      Fundas
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                    >
                      Estado
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3.5 px-2 sm:px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 hidden md:table-cell"
                    >
                      Fecha Retorno
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-gray-800 text-theme-sm dark:text-white/90">
                        {movement.fechaEnvio}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {movement.habitacion}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-gray-800 text-theme-sm dark:text-white/90 font-semibold">
                        {movement.toallas}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-gray-800 text-theme-sm dark:text-white/90 font-semibold hidden md:table-cell">
                        {movement.sabanas}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-gray-800 text-theme-sm dark:text-white/90 font-semibold hidden lg:table-cell">
                        {movement.fundas}
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4">
                        <Badge size="sm" color={getStatusBadgeColor(movement.estado)}>
                          {movement.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 px-2 sm:px-4 text-gray-500 text-theme-sm dark:text-gray-400 hidden md:table-cell">
                        {movement.fechaRetorno}
                      </TableCell>
                    </TableRow>
                  ))}
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