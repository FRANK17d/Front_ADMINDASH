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
      </div>
    </>
  );
}
