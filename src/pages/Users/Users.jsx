import { useEffect, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";

export default function BasicTables() {

  useEffect(() => {
    document.title = "Usuarios - Administrador - Hotel Plaza Trujillo";
  }, []);

  const { isOpen: isAttendanceOpen, openModal: openAttendanceModal, closeModal: closeAttendanceModal } = useModal();
  const [attendanceHeader, setAttendanceHeader] = useState({ nombres: "", dni: "", puesto: "", horario: "", descanso: "", mes: "", anio: "" });
  const [attendanceRows, setAttendanceRows] = useState(Array.from({ length: 31 }, (_, i) => ({
    id: i + 1,
    dia: i + 1,
    entrada: "",
    firmaEntrada: "",
    refrigerio: "",
    salida: "",
    firmaSalida: "",
    observaciones: "",
  })));

  const handleAttendanceHeaderChange = (e) => {
    const { name, value } = e.target;
    setAttendanceHeader((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttendanceRowChange = (id, field, value) => {
    setAttendanceRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  return (
    <> 
      <div className="space-y-6">
        <ComponentCard title="Gestión de Usuarios">
          <BasicTableOne />
        </ComponentCard>
        <ComponentCard title="Registro de Asistencia del Personal">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-theme-sm">Control mensual de asistencia (DS N° 004-011-2000-TR)</p>
            <Button onClick={openAttendanceModal} className="bg-orange-500 hover:bg-orange-600 text-white">Nuevo Registro</Button>
          </div>
        </ComponentCard>
      </div>

      <Modal isOpen={isAttendanceOpen} onClose={closeAttendanceModal} className="max-w-[1000px] m-4">
        <div className="no-scrollbar relative w-full max-w-[1000px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Registro de Control de Asistencia</h4>
          </div>
          <div className="px-2 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Nombres y Apellidos</label>
                <input name="nombres" value={attendanceHeader.nombres} onChange={handleAttendanceHeaderChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 px-4" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">N° DNI</label>
                <input name="dni" value={attendanceHeader.dni} onChange={handleAttendanceHeaderChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 px-4" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Puesto</label>
                <input name="puesto" value={attendanceHeader.puesto} onChange={handleAttendanceHeaderChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 px-4" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Horario</label>
                <input name="horario" value={attendanceHeader.horario} onChange={handleAttendanceHeaderChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 px-4" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Descanso</label>
                <input name="descanso" value={attendanceHeader.descanso} onChange={handleAttendanceHeaderChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 px-4" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Mes</label>
                  <input name="mes" value={attendanceHeader.mes} onChange={handleAttendanceHeaderChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 px-4" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Año</label>
                  <input name="anio" value={attendanceHeader.anio} onChange={handleAttendanceHeaderChange} type="text" className="h-11 w-full rounded-lg border border-gray-300 px-4" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Día</th>
                    <th className="py-2 pr-4">Hora Entrada</th>
                    <th className="py-2 pr-4">Firma</th>
                    <th className="py-2 pr-4">Horario Refrigerio</th>
                    <th className="py-2 pr-4">Hora Salida</th>
                    <th className="py-2 pr-4">Firma</th>
                    <th className="py-2 pr-4">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {attendanceRows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-4">{r.dia}</td>
                      <td className="py-2 pr-4"><input type="time" value={r.entrada} onChange={(e) => handleAttendanceRowChange(r.id, "entrada", e.target.value)} className="h-10 w-28 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="text" value={r.firmaEntrada} onChange={(e) => handleAttendanceRowChange(r.id, "firmaEntrada", e.target.value)} className="h-10 w-36 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="text" value={r.refrigerio} onChange={(e) => handleAttendanceRowChange(r.id, "refrigerio", e.target.value)} className="h-10 w-36 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="time" value={r.salida} onChange={(e) => handleAttendanceRowChange(r.id, "salida", e.target.value)} className="h-10 w-28 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="text" value={r.firmaSalida} onChange={(e) => handleAttendanceRowChange(r.id, "firmaSalida", e.target.value)} className="h-10 w-36 rounded-lg border border-gray-300 px-3" /></td>
                      <td className="py-2 pr-4"><input type="text" value={r.observaciones} onChange={(e) => handleAttendanceRowChange(r.id, "observaciones", e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 px-3" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeAttendanceModal}>Cerrar</Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Guardar Registro</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
