import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./RecibirDePlanta.css";
import PalletsRecibidos from "./PalletsRecibidos";

const RecibirDePlanta = ({ onBack, onLogout, user }) => {
  const navigate = useNavigate();
  // Inicializar planta desde localStorage
  const [planta, setPlanta] = useState(() => {
    return localStorage.getItem("selectedPlanta") || "";
  });

  const [codigo, setCodigo] = useState("");
  const [ubicacion, setUbicacion] = useState("");

  // Estados para datos extraidos del QR (ocultos o visibles, necesarios para guardar)
  const [descripcion, setDescripcion] = useState("");
  const [lote, setLote] = useState("");
  const [nPallet, setNPallet] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null); // Feedback message

  // Focus refs
  const codigoRef = useRef(null);
  const ubicacionRef = useRef(null);
  
  // Timeout para debounce de ubicación
  const ubicacionTimeoutRef = useRef(null);

  // Trigger para recargar la lista de pallets recibidos
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Guardar planta en localStorage cuando cambie
  useEffect(() => {
    if (planta) {
      localStorage.setItem("selectedPlanta", planta);
    }
  }, [planta]);

  useEffect(() => {
    // Auto-focus logic
    if (planta && !codigo) {
      setTimeout(() => codigoRef.current?.focus(), 100);
    }
  }, [planta]);

  const handleLogoutWrapper = () => {
    // Limpiar planta seleccionada al cerrar sesión
    localStorage.removeItem("selectedPlanta");
    onLogout();
  };

  const obtenerDescripcion = async (codigo) => {
    try {
      const response = await fetch(
        `https://smartstockwms-a8p6.onrender.com/api/materiales/descripcion/${codigo}`
      );
      if (response.ok) {
        const data = await response.json();
        setDescripcion(data.descripcion || "Sin descripción");
      } else {
        setDescripcion("Sin descripción");
      }
    } catch (error) {
      console.error("Error obteniendo descripción:", error);
      setDescripcion("Sin descripción");
    }
  };

  const parseQR = (value) => {
    // Formato esperado: P|CODIGO|LOTE|NUM_PALLET
    if (value.startsWith("P|")) {
      const parts = value.split("|");
      if (parts.length >= 4) {
        setCodigo(parts[1]);
        setLote(parts[2]);
        setNPallet(parts[3]);
        // La descripción se obtendrá de la tabla materiales usando el código
        obtenerDescripcion(parts[1]);
        return true;
      }
    }
    return false;
  };

  const handleCodigoChange = (e) => {
    const val = e.target.value;
    // Intentar parsear si es un QR completo pegado de golpe
    const isParsed = parseQR(val);

    if (isParsed) {
      // Si se parseó correctamente, mover foco a ubicación
      setTimeout(() => ubicacionRef.current?.focus(), 100);
    } else {
      // Si no, solo setear código (modo manual o MTE antiguo)
      setCodigo(val);
    }
  };

  const handleUbicacionChange = (e) => {
    const newUbicacion = e.target.value.toUpperCase();
    console.log("Ubicación escaneada:", newUbicacion); // Debug
    setUbicacion(newUbicacion);
    
    // Limpiar timeout anterior
    if (ubicacionTimeoutRef.current) {
      clearTimeout(ubicacionTimeoutRef.current);
    }
    
    // Solo auto-guardar si la ubicación parece completa y hay datos válidos
    if (newUbicacion.trim() && planta && codigo.trim()) {
      // Para ubicaciones cortas como "GR", esperar más tiempo
      // Para ubicaciones más largas, esperar menos tiempo
      const waitTime = newUbicacion.length >= 4 ? 800 : 1500;
      
      console.log("Configurando auto-guardado en", waitTime, "ms para:", newUbicacion); // Debug
      
      ubicacionTimeoutRef.current = setTimeout(() => {
        // Verificar que todavía tenemos los datos necesarios
        if (newUbicacion.trim() && planta && codigo.trim()) {
          console.log("Auto-guardando con ubicación final:", newUbicacion); // Debug
          handleSaveRecibo();
        }
      }, waitTime);
    }
  };

  const handleSaveRecibo = async () => {
    // Forzar lectura actual del estado
    const currentUbicacion = ubicacionRef.current?.value || ubicacion;
    
    console.log("Datos a guardar:", { planta, codigo, ubicacion: currentUbicacion, descripcion, lote, nPallet }); // Debug
    
    if (!planta || !codigo || !currentUbicacion) {
      console.log("Validación fallida - Datos faltantes:", { planta, codigo, ubicacion: currentUbicacion }); // Debug
      setMessage({
        type: "error",
        text: "Faltan datos obligatorios (Planta, Código, Ubicación)",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "https://smartstockwms-a8p6.onrender.com/api/recibos",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planta,
            codigo,
            descripcion: descripcion || "Sin descripción",
            lote: lote || "S/L",
            n_pallet: nPallet || "00",
            ubicacion: currentUbicacion,
            usuario: user?.usuario || "Desconocido",
          }),
        }
      );

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Recibo guardado correctamente",
        });
        // Limpiar campos excepto planta
        setCodigo("");
        setUbicacion("");
        setDescripcion("");
        setLote("");
        setNPallet("");
        setRefreshTrigger((prev) => prev + 1); // Actualizar lista
        setTimeout(() => codigoRef.current?.focus(), 100);
      } else {
        setMessage({ type: "error", text: "Error al guardar el recibo" });
      }
    } catch (error) {
      console.error("Error saving recibo:", error);
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setIsLoading(false);
      // Limpiar mensaje después de 3s
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUbicacionKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSaveRecibo();
    }
  };

  const handlePalletsRecibidosClick = () => {
    if (window.innerWidth >= 1024) {
      // En desktop, actualizar el trigger para mostrar pallets de GROUND
      setRefreshTrigger((prev) => prev + 1);
    } else {
      // En móvil, navegar a la página de pallets con filtro de GROUND
      navigate("/pallets-recibidos?ubicacion=GROUND");
    }
  };

  return (
    <div className="recibo-screen-split">
      {/* Panel Izquierdo: Formulario de Recibo */}
      <div className="recibo-container box-shadow-container">
        <h2 className="title">Recibo de Planta</h2>

        {message && (
          <div className={`message-banner ${message.type}`}>{message.text}</div>
        )}

        <div className="form-group custom-select-container">
          <label className="label-text">Planta</label>
          <div className="select-wrapper">
            <select
              value={planta}
              onChange={(e) => setPlanta(e.target.value)}
              className="custom-select"
            >
              <option value="">Seleccionar Planta</option>
              <option value="UPF-22">UPF-22</option>
              <option value="UPF-30">UPF-30</option>
            </select>
            <i className="fas fa-chevron-down select-icon"></i>
          </div>
        </div>

        <div className="input-group">
          <input
            ref={codigoRef}
            type="text"
            placeholder="Scannear codigo"
            value={codigo}
            onChange={handleCodigoChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Si se presionó enter y no se parseó automáticamente antes, intentar parsear
                parseQR(codigo);
                ubicacionRef.current?.focus();
              }
            }}
            className="input-field scanner-input"
          />
        </div>

        <div className="input-group">
          <input
            ref={ubicacionRef}
            type="text"
            placeholder="Scannera nueva ubicacion"
            value={ubicacion}
            onChange={handleUbicacionChange}
            onKeyDown={handleUbicacionKeyDown}
            className="input-field scanner-input"
            disabled={isLoading}
          />
        </div>

        <button
          className="btn-received mobile-only-btn"
          onClick={handlePalletsRecibidosClick}
        >
          <i className="fas fa-clipboard-check"></i>{" "}
          <span className="btn-text-pallets">Pallets Recibidos</span>
        </button>

        <div className="action-buttons">
          <button className="btn-action btn-back" onClick={onBack}>
            <i className="fas fa-arrow-left"></i>{" "}
            <span className="btn-text">Volver</span>
          </button>
          <button
            className="btn-action btn-logout-red"
            onClick={handleLogoutWrapper}
          >
            <i className="fas fa-sign-out-alt"></i>{" "}
            <span className="btn-text">Salir</span>
          </button>
        </div>
      </div>

      {/* Panel Derecho: Lista de Pallets (Solo Desktop) */}
      <div className="recibo-right-panel desktop-only-panel">
        <PalletsRecibidos
          onBack={() => {}} // No action needed here as we are in split view
          onLogout={onLogout}
          user={user}
          isEmbedded={true}
          refreshTrigger={refreshTrigger}
          filtroUbicacion="GROUND" // Filtrar solo pallets de GROUND
        />
      </div>
    </div>
  );
};

export default RecibirDePlanta;
