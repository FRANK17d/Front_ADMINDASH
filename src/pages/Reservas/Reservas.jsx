import "moment/locale/es";
import { useEffect, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import HuespedesTable from "../../components/tables/HuespedesTable/HuespedesTable";

export default function Reservas() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    document.title = "Pasajeros - Hotel Plaza Trujillo";
  }, []);

  return (
    <div className="space-y-6">
      <ComponentCard 
        title="Gestión de Pasajeros" 
        headerRight={<span>Registros: {count}</span>}
      >
        <HuespedesTable onCountChange={setCount} />
      </ComponentCard>
    </div>
  );
}
