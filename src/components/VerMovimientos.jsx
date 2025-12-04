import React, { useState } from "react";
import "./VerMovimientos.css";
import { useConfig } from "../context/ConfigContext";

const VerMovimientos = () => {
  const { t } = useConfig();
  const [codigo, setCodigo] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleBuscar = async () => {
    if (!codigo.trim()) {
      setMessage({ type: "error", text: t("error") });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setMovimientos([]);

      let url = `https://smartstockwms-a8p6.onrender.com/api/historial/${encodeURIComponent(
        codigo.trim()
      )}`;

      // Agregar filtro si no es "Todos"
      if (tipoFiltro !== "Todos") {
        url += `?tipo=${tipoFiltro}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || t("error") });
        return;
      }

      setMovimientos(data);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: t("error") });
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
            className="ver-movimientos-select"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Entro">Entro</option>
            <option value="Salio">Salio</option>
            <option value="Movimiento">Movimiento</option>
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
        <div className={`ver-movimientos-message ${message.type}`}>
          {message.text}
        </div>
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
                <th>{t("movType")}</th>
                <th>ESTADO</th>
                <th>{t("movUser")}</th>
                <th>TURNO</th>
                <th>{t("movDate")}</th>
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
                  <td
                    className={
                      mov.T_movimi === "Salio"
                        ? "tipo-salio"
                        : mov.T_movimi === "Entro"
                        ? "tipo-entro"
                        : ""
                    }
                  >
                    {mov.T_movimi}
                  </td>
                  <td>{mov.Estado}</td>
                  <td>{mov.Usuario}</td>
                  <td>{mov.Turno}</td>
                  <td>{mov.Fecha}</td>
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
