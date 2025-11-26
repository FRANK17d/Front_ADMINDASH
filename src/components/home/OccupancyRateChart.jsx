import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { getOccupancyWeekly } from "../../api/dashboard";
import LoadingSpinner from "../common/LoadingSpinner";

export default function OccupancyRateChart() {
  const [occupancyData, setOccupancyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOccupancyWeekly();
        setOccupancyData(data.data || []);
      } catch (error) {
        console.error("Error fetching occupancy data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const options = {
    colors: ["#fb6514"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 320,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val + "%";
      },
      style: {
        fontSize: "10px",
        colors: ["#fff"],
      },
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: undefined,
      },
      max: 100,
      labels: {
        formatter: function (val) {
          return val + "%";
        },
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val}%`,
      },
    },
  };

  const series = [
    {
      name: "Ocupación",
      data: occupancyData,
    },
  ];

  // Calcular estadísticas
  const average = occupancyData.length > 0 
    ? (occupancyData.reduce((a, b) => a + b, 0) / occupancyData.length).toFixed(1)
    : 0;
  const maxValue = Math.max(...occupancyData);
  const maxIndex = occupancyData.indexOf(maxValue);
  const minValue = Math.min(...occupancyData);
  const minIndex = occupancyData.indexOf(minValue);
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-3 dark:border-gray-800 dark:bg-black sm:px-6 sm:pt-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-3 dark:border-gray-800 dark:bg-black sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Tasa de Ocupación Semanal
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Ocupación diaria de la última semana
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[450px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={280} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Promedio Semana
          </p>
          <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {average}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Día Pico
          </p>
          <p className="text-lg font-semibold" style={{ color: "#fb6514" }}>
            {maxValue.toFixed(1)}% ({dayNames[maxIndex]})
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Día Bajo
          </p>
          <p className="text-lg font-semibold" style={{ color: "#c4320a" }}>
            {minValue.toFixed(1)}% ({dayNames[minIndex]})
          </p>
        </div>
      </div>
    </div>
  );
}

