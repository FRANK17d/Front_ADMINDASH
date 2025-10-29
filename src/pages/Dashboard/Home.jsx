import { useEffect } from "react";
import EcommerceMetrics from "../../components/home/EcommerceMetrics";
import MonthlySalesChart from "../../components/home/MonthlySalesChart";
import StatisticsChart from "../../components/home/StatisticsChart";
import MonthlyTarget from "../../components/home/MonthlyTarget";
import RecentOrders from "../../components/home/RecentOrders";

export default function Home() {
  useEffect(() => {
    document.title = "Dashboard - Administrador - Hotel Plaza Trujillo";
  }, []);

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
  );
}
