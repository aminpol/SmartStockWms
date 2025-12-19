import React, { useState, useEffect } from "react";
import "./PalletsRecibidos.css";
import AlertModal from "./AlertModal";
import API_URL from "../apiConfig";

const PalletsRecibidos = ({
  onBack,
  onLogout,
  isEmbedded = false,
  refreshTrigger,
  filtroUbicacion = null, // Nuevo prop para filtrar por ubicación específica
}) => {
  const [recibos, setRecibos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroPlanta, setFiltroPlanta] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [filtroLote, setFiltroLote] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    fetchRecibos();
  }, [refreshTrigger, filtroUbicacion]); // Reload cuando cambian refreshTrigger o filtroUbicacion

  const obtenerTurnoActual = () => {
    const ahora = new Date();
    const hora = ahora.getHours();

    if (hora >= 0 && hora < 8) {
      return 1; // Turno 1: 12:00 AM - 7:59 AM
    } else if (hora >= 8 && hora < 16) {
      return 2; // Turno 2: 8:00 AM - 3:59 PM
    } else {
      return 3; // Turno 3: 4:00 PM - 11:59 PM
    }
  };

  const fetchRecibos = async () => {
    setLoading(true);
    try {
      console.log("Intentando obtener pallets de GROUND...");

      // Siempre obtener pallets de la tabla pallets_ground
      const response = await fetch(`${API_URL}/api/pallets-ground`);

      if (response.ok) {
        const data = await response.json();
        setRecibos(data);

        // Establecer filtros por defecto si no hay búsqueda activa
        if (!searchActive) {
          // Bogotá es UTC-5. Usamos -5h respecto a UTC para consistencia total.
          const nowUtc = new Date();
          const bogotaTime = new Date(nowUtc.getTime() - 5 * 60 * 60 * 1000);
          const hoy = bogotaTime.toISOString().split("T")[0];

          const turnoActual = obtenerTurnoActual();

          setFiltroFecha(hoy);
          setFiltroTurno(turnoActual.toString());
          setSearchActive(true);
        }
      } else {
        console.error(
          "Error fetching pallets GROUND - Status:",
          response.status
        );
        const errorText = await response.text();
        console.error("Error text:", errorText);
      }
    } catch (error) {
      console.error("Error conectando con servidor:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Activar el filtrado cuando se presiona el botón de búsqueda
    setSearchActive(true);

    // Verificar si hay resultados después de filtrar
    const resultados = getFilteredData();

    if (resultados.length === 0) {
      setAlertMessage({
        type: "error",
        text: "No se encontraron registros con los filtros aplicados",
      });
    }
  };

  const getFilteredData = () => {
    return recibos
      .filter((r) => {
        const coincideCodigo =
          !filtro.trim() ||
          r.codigo?.toLowerCase().includes(filtro.toLowerCase());

        // Extraer la parte de la fecha (YYYY-MM-DD) de forma directa del string
        // El servidor ya guarda la fecha en formato local de Bogotá (YYYY-MM-DD HH:mm:ss)
        let fechaRegistro = "";
        if (r.fecha) {
          // Tomamos la parte antes del espacio o la 'T'
          fechaRegistro = r.fecha.split(/[T ]/)[0];
        }

        const coincideFecha =
          !filtroFecha.trim() || fechaRegistro === filtroFecha;

        const coincidePlanta =
          !filtroPlanta.trim() ||
          r.planta?.toLowerCase() === filtroPlanta.toLowerCase();

        const coincideTurno =
          !filtroTurno || r.turno?.toString() === filtroTurno;

        const coincideLote =
          !filtroLote.trim() ||
          r.lote?.toLowerCase().includes(filtroLote.toLowerCase());

        return (
          coincideCodigo &&
          coincideFecha &&
          coincidePlanta &&
          coincideTurno &&
          coincideLote
        );
      })
      .sort((a, b) => {
        // Ordenar por número de pallet ascendente
        const numA = parseInt(a.numero_pallet) || 0;
        const numB = parseInt(b.numero_pallet) || 0;
        return numA - numB;
      });
  };

  const handleClearFilter = () => {
    setFiltro("");
    setFiltroFecha("");
    setFiltroPlanta("");
    setFiltroTurno("");
    setFiltroLote("");
    setSearchActive(false);
  };

  // Obtener lotes únicos basados en los OTROS filtros activos (Context-aware)
  const getContextualLots = () => {
    return [
      ...new Set(
        recibos
          .filter((r) => {
            // Filtrar por todo EXCEPTO por el mismo filtro de lote para ver opciones disponibles
            let fechaRegistro = r.fecha ? r.fecha.split(/[T ]/)[0] : "";
            const coincideFecha =
              !filtroFecha.trim() || fechaRegistro === filtroFecha;
            const coincidePlanta =
              !filtroPlanta.trim() ||
              r.planta?.toLowerCase() === filtroPlanta.toLowerCase();
            const coincideTurno =
              !filtroTurno || r.turno?.toString() === filtroTurno;
            return coincideFecha && coincidePlanta && coincideTurno;
          })
          .map((r) => r.lote)
          .filter(Boolean)
      ),
    ].sort();
  };

  const filteredRecibos = searchActive ? getFilteredData() : recibos;

  return (
    <div className={`pallets-recibidos-screen ${isEmbedded ? "embedded" : ""}`}>
      <div
        className={`main-container ${isEmbedded ? "embedded-container" : ""}`}
      >
        {!isEmbedded && (
          <h2 className="page-title" style={{ fontSize: "1.5rem" }}>
            Pallets Recibidos
          </h2>
        )}
        {isEmbedded && (
          <h3
            className="page-title"
            style={{ marginTop: 0, fontSize: "1.1rem" }}
          >
            Historial de Recibos
          </h3>
        )}

        <div className="search-section">
          <div className="search-row responsive-grid">
            {/* Codigo */}
            <div className="search-input-group">
              <div className="search-label-row">
                <label className="search-label">
                  <span className="label-prefix">Filtrar </span>codigo
                </label>
                <div className="search-actions">
                  <button
                    className="btn-search-icon"
                    onClick={handleSearch}
                    title="Buscar"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                  {searchActive && (
                    <button
                      className="btn-clear-icon-small"
                      onClick={handleClearFilter}
                      title="Limpiar"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Codigo"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
            </div>

            {/* Fecha */}
            <div className="search-input-group">
              <label className="search-label">
                <span className="label-prefix">Filtrar </span>fecha
              </label>
              <div className="search-input-wrapper">
                <input
                  type="date"
                  className="search-input"
                  value={filtroFecha}
                  onChange={(e) => {
                    setFiltroFecha(e.target.value);
                    setFiltroTurno("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
            </div>

            {/* Planta */}
            <div className="search-input-group">
              <label className="search-label">
                <span className="label-prefix">Filtrar </span>planta
              </label>
              <div className="search-input-wrapper">
                <select
                  className="search-input"
                  value={filtroPlanta}
                  onChange={(e) => setFiltroPlanta(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="UPF-22">UPF-22</option>
                  <option value="UPF-30">UPF-30</option>
                </select>
              </div>
            </div>

            {/* Turno */}
            <div className="search-input-group">
              <label className="search-label">
                <span className="label-prefix">Filtrar </span>turno
              </label>
              <div className="search-input-wrapper">
                <select
                  className="search-input"
                  value={filtroTurno}
                  onChange={(e) => setFiltroTurno(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="1">Turno 1</option>
                  <option value="2">Turno 2</option>
                  <option value="3">Turno 3</option>
                </select>
              </div>
            </div>
          </div>{" "}
          {/* Mostrar turno actual en modo móvil */}
          {window.innerWidth < 1024 && (
            <div
              style={{
                textAlign: "center",
                fontSize: "0.8rem",
                color: "#666",
                margin: "0",
                padding: "0",
                lineHeight: "1",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Turno {obtenerTurnoActual()} Actual - Registros:{" "}
              {filteredRecibos.length}
            </div>
          )}
        </div>

        <div className="table-container">
          <table className="pallets-table">
            <thead>
              <tr>
                <th>CODIGO</th>
                <th>DESCRIPCION</th>
                <th className="excel-th-filter">
                  <div className="excel-header-content">
                    <span>LOTE</span>
                    <div className="filter-icon-wrapper">
                      <i
                        className={`fas fa-filter ${
                          filtroLote ? "active-filter" : ""
                        }`}
                      ></i>
                      <select
                        className="invisible-header-select"
                        value={filtroLote}
                        onChange={(e) => {
                          setFiltroLote(e.target.value);
                          setSearchActive(true);
                        }}
                        title="Filtrar por lote"
                      >
                        <option value="">(Todos)</option>
                        {getContextualLots().map((lot) => (
                          <option key={lot} value={lot}>
                            {lot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </th>
                <th>N° PALL</th>
                <th className="col-kg">KG</th>
                {searchActive && (
                  <th>
                    <i className="fas fa-user" title="USUARIO"></i>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={searchActive ? 6 : 5}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    Cargando...
                  </td>
                </tr>
              ) : filteredRecibos.length > 0 ? (
                filteredRecibos.map((item) => (
                  <tr key={item.id}>
                    <td>{item.codigo}</td>
                    <td>{item.descripcion}</td>
                    <td>{item.lote}</td>
                    <td>{item.numero_pallet}</td>
                    <td style={{ fontWeight: "700" }}>{item.kg || 0}</td>
                    {searchActive && (
                      <td style={{ fontSize: "0.85rem" }}>{item.usuario}</td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={searchActive ? 6 : 5}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    No hay registros encontrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isEmbedded && (
          <div className="footer-buttons">
            <button className="btn-action btn-back-blue" onClick={onBack}>
              <i className="fas fa-arrow-left"></i>
              <span className="btn-text">Volver</span>
            </button>
            <button className="btn-action btn-logout-footer" onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span className="btn-text">Cerrar sesión</span>
            </button>
          </div>
        )}

        {/* Modal de alerta */}
        {alertMessage && (
          <AlertModal
            type={alertMessage.type}
            message={alertMessage.text}
            onClose={() => setAlertMessage(null)}
          />
        )}
      </div>
    </div>
  );
};

export default PalletsRecibidos;
