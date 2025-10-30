import Chart from "react-apexcharts";
import { YapeIcon, DollarLineIcon, BoxIcon, PaperPlaneIcon } from "../../icons";

export default function PaymentMethodChart() {
  const series = [45, 30, 15, 10]; // Porcentajes para cada método de pago

  const options = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 220,
    },
    colors: ["#22C55E", "#3B82F6", "#5E0B72", "#FB6514"], // Verde, Azul, Morado, Naranja
    labels: ["Efectivo", "Tarjeta", "Yape", "Transferencia"],
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      fontFamily: "Outfit, sans-serif",
      markers: {
        width: 10,
        height: 10,
        radius: 10,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 5,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              fontWeight: 600,
              color: "#1D2939",
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: 700,
              color: "#1D2939",
              offsetY: 0,
              formatter: function (val) {
                return val + "%";
              },
            },
            total: {
              show: true,
              label: "Total",
              fontSize: "14px",
              fontWeight: 500,
              color: "#6B7280",
              formatter: function (w) {
                return "100%";
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
    tooltip: {
      y: {
        formatter: function (val) {
          return val + "%";
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-black sm:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Ingresos por Método de Pago
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Distribución de pagos del último mes
        </p>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Chart options={options} series={series} type="donut" height={220} />
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <DollarLineIcon className="w-5 h-5" style={{ color: "#22C55E" }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">Efectivo</span>
          </div>
          <span className="text-xs font-semibold text-gray-800 dark:text-white/90">S/ 20,376</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <BoxIcon className="w-5 h-5" style={{ color: "#3B82F6" }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">Tarjeta</span>
          </div>
          <span className="text-xs font-semibold text-gray-800 dark:text-white/90">S/ 13,584</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <YapeIcon className="w-5 h-5" style={{ color: "#5E0B72" }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">Yape</span>
          </div>
          <span className="text-xs font-semibold text-gray-800 dark:text-white/90">S/ 6,792</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <PaperPlaneIcon className="w-5 h-5" style={{ color: "#FB6514" }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">Transferencia</span>
          </div>
          <span className="text-xs font-semibold text-gray-800 dark:text-white/90">S/ 4,528</span>
        </div>
      </div>
    </div>
  );
}

