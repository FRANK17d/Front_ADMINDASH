import { useEffect } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {

  useEffect(() => {
    document.title = "Usuarios - Hotel Plaza Trujillo";
  }, []);

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
