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
    document.title = "Dashboard - Hotel Plaza Trujillo";
  }, []);

  return (
    <div className="space-y-6">
      {/* 4 Tarjetas principales de métricas */}
      <EcommerceMetrics />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
        {/* Ingresos Mensuales - Ancho completo */}
          <MonthlySalesChart />
        </div>

        <div className="col-span-12">
          {/* Ingresos vs Gastos - Ancho completo */}
          <StatisticsChart />
        </div>

      </div>
      
      {/* Ingresos por Método de Pago y Tasa de Ocupación Semanal */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-4">
          <PaymentMethodChart />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <OccupancyRateChart />
        </div>
      </div>


      {/* Check-in y Check-out del día */}
      <CheckInOutCards />

      {/* Reservas Recientes */}
      <RecentOrders />
    </div>
  );
}
