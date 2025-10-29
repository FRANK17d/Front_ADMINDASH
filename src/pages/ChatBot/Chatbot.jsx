import { useEffect } from "react";

export default function Chatbot() {
    useEffect(() => {
        document.title = "Chatbot - Administrador - Hotel Plaza Trujillo";
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold text-white">Chatbot</h1>
        </div>
    );
}