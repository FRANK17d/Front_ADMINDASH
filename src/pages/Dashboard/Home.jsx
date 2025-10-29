import { useEffect } from "react";
import EcommerceMetrics from "../../components/home/EcommerceMetrics";
import MonthlySalesChart from "../../components/home/MonthlySalesChart";
import StatisticsChart from "../../components/home/StatisticsChart";
import PaymentMethodChart from "../../components/home/PaymentMethodChart";
import OccupancyRateChart from "../../components/home/OccupancyRateChart";
import RecentOrders from "../../components/home/RecentOrders";
import CheckInOutCards from "../../components/home/CheckInOutCards";

export default function Home() {
  useEffect(() => {
    document.title = "Dashboard - Administrador - Hotel Plaza Trujillo";
  }, []);

  return (
    <div className="space-y-6">
      {/* 4 Tarjetas principales de métricas */}
      <EcommerceMetrics />

      {/* Sección de gráficos principales */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Ingresos Mensuales */}
        <div className="col-span-12 lg:col-span-8">
          <MonthlySalesChart />
        </div>

        {/* Ingresos por Método de Pago */}
        <div className="col-span-12 lg:col-span-4">
          <PaymentMethodChart />
        </div>
      </div>

      {/* Tasa de Ocupación Semanal e Ingresos vs Gastos */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-6">
          <OccupancyRateChart />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <StatisticsChart />
        </div>
      </div>

      {/* Check-in y Check-out del día */}
      <CheckInOutCards />

      {/* Reservas Recientes */}
      <RecentOrders />
    </div>
  );
}
