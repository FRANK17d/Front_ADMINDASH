import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { getMonthlyRevenue } from "../../api/dashboard";

export default function MonthlySalesChart() {
  const [monthlyData, setMonthlyData] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMonthlyRevenue();
        setMonthlyData(data.data || []);
      } catch (error) {
        console.error("Error fetching monthly revenue:", error);
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
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
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
      x: {
        show: false,
      },
      y: {
        formatter: (val) => `S/ ${val.toLocaleString()}`,
      },
    },
  };
  const series = [
    {
      name: "Ingresos",
      data: monthlyData,
    },
  ];
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-black sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
          <div className="w-6 h-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
        </div>
        <div className="w-full pb-2">
          <div className="h-[350px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-end justify-between px-4 pb-4">
            {/* Placeholder bars */}
            <div className="flex items-end gap-2 w-full">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-300 dark:bg-gray-700 rounded-t"
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    animationDelay: `${i * 50}ms`
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-black sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Ingresos Mensuales
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Ver Más
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Eliminar
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="w-full pb-2 overflow-x-auto">
        <div className="min-w-[720px] sm:min-w-0">
          <Chart options={options} series={series} type="bar" height={350} />
        </div>
      </div>
    </div>
  );
}
