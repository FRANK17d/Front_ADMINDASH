
export default function UserAddressCard() {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
          Información del Hotel
        </h4>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Nombre
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              Hotel Plaza Trujillo
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Ciudad/Región
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              Trujillo, La Libertad, Perú
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Dirección
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              Jr. Independencia 477, Trujillo
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Teléfono
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              +51 044 258888
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
