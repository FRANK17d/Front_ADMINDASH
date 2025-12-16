export default function SidebarWidget() {
  return (
    <div className="pb-20">
      <div
        className={`
          mx-auto w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.06]`}
      >
        <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
          Hotel Plaza Trujillo
        </h3>
        <p className="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
          Sistema de administración para la gestión integral del hotel.
        </p>
      </div>
    </div>
  );
}
