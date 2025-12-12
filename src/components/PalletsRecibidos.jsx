import React, { useState, useEffect } from "react";
import "./PalletsRecibidos.css";
import AlertModal from "./AlertModal";

const PalletsRecibidos = ({
  onBack,
  onLogout,
  isEmbedded = false,
  refreshTrigger,
  filtroUbicacion = null, // Nuevo prop para filtrar por ubicación específica
}) => {
  const [recibos, setRecibos] = useState([]);
  const [filtro, setFiltro] = useState("");
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
      const response = await fetch(
        `https://smartstockwms-a8p6.onrender.com/api/pallets-ground`
      );
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Pallets GROUND obtenidos:", data.length);
        console.log("Datos recibidos:", data);
        setRecibos(data);
      } else {
        console.error("Error fetching pallets GROUND - Status:", response.status);
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
    if (!filtro.trim()) {
      setAlertMessage({
        type: "error",
        text: "Por favor ingrese un código para buscar",
      });
      return;
    }
    
    setSearchActive(true);
    
    // Verificar si hay resultados después de filtrar
    const resultados = recibos.filter((r) => {
      return r.codigo?.toLowerCase().includes(filtro.toLowerCase());
    });
    
    if (resultados.length === 0) {
      setAlertMessage({
        type: "error",
        text: "Producto no recibido en turno actual",
      });
    }
  };

  const handleClearFilter = () => {
    setFiltro("");
    setSearchActive(false);
  };

  const filteredRecibos = searchActive 
    ? recibos.filter((r) => {
        if (!filtro) return true;
        return r.codigo?.toLowerCase().includes(filtro.toLowerCase());
      })
    : recibos;

  return (
    <div className={`pallets-recibidos-screen ${isEmbedded ? "embedded" : ""}`}>
      <div
        className={`main-container ${isEmbedded ? "embedded-container" : ""}`}
      >
        {!isEmbedded && <h2 className="page-title" style={{ fontSize: "1.5rem" }}>Pallets Recibidos</h2>}
        {isEmbedded && (
          <h3
            className="page-title"
            style={{ marginTop: 0, fontSize: "1.1rem" }}
          >
            Historial de Recibos
          </h3>
        )}

        <div className="search-section">
          <label className="search-label">Filtrar codigo</label>
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
            <button className="btn-search-icon" onClick={handleSearch}>
              <i className="fas fa-search"></i>
            </button>
            {searchActive && (
              <button 
                className="btn-clear-icon" 
                onClick={handleClearFilter}
                title="Limpiar filtro"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          
          {/* Mostrar turno actual en modo móvil */}
          {window.innerWidth < 1024 && (
            <div style={{ 
              textAlign: "center", 
              fontSize: "0.8rem", 
              color: "#666", 
              margin: "0",
              padding: "0",
              lineHeight: "1",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              Turno {obtenerTurnoActual()} Actual
            </div>
          )}
        </div>

        <div className="table-container">
          <table className="pallets-table">
            <thead>
              <tr>
                <th>CODIGO</th>
                <th>DESCRIPCION</th>
                <th>LOTE</th>
                <th>N° PALLETS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
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
                    <td>{item.n_pallet}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
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
