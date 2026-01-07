import React, { useState } from "react";
import "./VerMovimientos.css";
import API_URL from "../apiConfig";
import { useConfig } from "../context/ConfigContext";
import AlertModal from "./AlertModal";

const VerMovimientos = () => {
  const { t } = useConfig();
  const [codigo, setCodigo] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [plantaFiltro, setPlantaFiltro] = useState("Todos");
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [tieneIngresosPlanta, setTieneIngresosPlanta] = useState(false);

  const handleModalClose = () => {
    setMessage(null);
    setCodigo("");
    setMovimientos([]);
    setTieneIngresosPlanta(false);
    // Enfocar el input después de limpiar
    setTimeout(() => {
      document.querySelector(".ver-movimientos-input")?.focus();
    }, 100);
  };

  const handleBuscar = async () => {
    if (!codigo.trim()) {
      setMessage({ type: "error", text: "Ingrese un código" });
      return;
    }

    // Validar que el código sea numérico
    if (!/^\d+$/.test(codigo.trim())) {
      setMessage({
        type: "error",
        text: `${codigo.trim()} no es un código válido`,
      });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setMovimientos([]);
      setTieneIngresosPlanta(false);

      let url = `${API_URL}/api/historial/${encodeURIComponent(codigo.trim())}`;

      // Agregar filtros a la URL
      const params = [];
      if (tipoFiltro !== "Todos") {
        params.push(`tipo=${tipoFiltro}`);
      }
      // Solo agregar filtro de planta si es "Todos" o "Entro"
      if (
        plantaFiltro !== "Todos" &&
        (tipoFiltro === "Todos" || tipoFiltro === "Entro")
      ) {
        params.push(`planta=${plantaFiltro}`);
      }

      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Producto no ingresado",
        });
        return;
      }

      if (!data || data.length === 0) {
        setMessage({ type: "error", text: "Producto no ingresado" });
        return;
      }

      setMovimientos(data);

      // Verificar si hay ingresos de planta en los resultados
      const hayIngresosPlanta = data.some(
        (mov) =>
          mov.T_movimi === "Entro" &&
          (mov.planta === "UPF-22" || mov.planta === "UPF-30")
      );
      setTieneIngresosPlanta(hayIngresosPlanta);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "Producto no ingresado" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleBuscar();
    }
  };

  return (
    <div className="ver-movimientos-container">
      <h3 className="ver-movimientos-title">{t("movTitle")}</h3>

      <div className="ver-movimientos-search">
        <div className="search-row">
          <input
            type="text"
            className="ver-movimientos-input"
            placeholder={t("consInputLabel")}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
          />

          <select
            className="ver-movimientos-select tipo-select"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Entro">Entro</option>
            <option value="Salio" disabled={tieneIngresosPlanta}>
              Salio
            </option>
            <option value="Movimiento" disabled={tieneIngresosPlanta}>
              Movimiento
            </option>
          </select>

          <select
            className="ver-movimientos-select planta-select"
            value={plantaFiltro}
            onChange={(e) => setPlantaFiltro(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="UPF-22">UPF-22</option>
            <option value="UPF-30">UPF-30</option>
          </select>

          <button
            className="ver-movimientos-btn-buscar"
            onClick={handleBuscar}
            disabled={loading}
          >
            <i className="fas fa-search"></i>
            <span>{loading ? t("loading") : t("search")}</span>
          </button>
        </div>
      </div>

      {message && (
        <AlertModal
          type={message.type}
          message={message.text}
          onClose={handleModalClose}
        />
      )}

      {movimientos.length > 0 && (
        <div className="ver-movimientos-results">
          <table className="ver-movimientos-table">
            <thead>
              <tr>
                <th>{t("movCode")}</th>
                <th>{t("consTableDesc")}</th>
                <th>{t("movQty")}</th>
                <th>{t("prodUnit")}</th>
                <th>ESTADO</th>
                <th>{t("movUser")}</th>
                <th>TURNO</th>
                <th>{t("movDate")}</th>
                <th>LOTE</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov, idx) => (
                <tr key={idx}>
                  <td>{mov.Id_codigo}</td>
                  <td>{mov.Descripcion}</td>
                  <td
                    className={
                      (mov.Movimiento || "").startsWith("-")
                        ? "movimiento-negativo"
                        : (mov.Movimiento || "").startsWith("+")
                        ? "movimiento-positivo"
                        : ""
                    }
                  >
                    {mov.Movimiento || "N/A"}
                  </td>
                  <td>{mov.Unit}</td>
                  <td>{mov.Estado}</td>
                  <td>{mov.Usuario}</td>
                  <td>{mov.Turno}</td>
                  <td>{mov.Fecha}</td>
                  <td>{mov.lote || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VerMovimientos;
