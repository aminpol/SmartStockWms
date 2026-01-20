import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./RecibirDePlanta.css";
import PalletsRecibidos from "./PalletsRecibidos";
import API_URL from "../apiConfig";
import AlertModal from "./AlertModal";

const RecibirDePlanta = ({ onBack, onLogout, user }) => {
  const navigate = useNavigate();
  // Inicializar planta desde localStorage
  const [planta, setPlanta] = useState(() => {
    return localStorage.getItem("selectedPlanta") || "";
  });

  const [codigo, setCodigo] = useState("");
  const [ubicacion, setUbicacion] = useState("GROUND");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");

  // Estados para datos extraidos del QR (ocultos o visibles, necesarios para guardar)
  const [descripcion, setDescripcion] = useState("");
  const [lote, setLote] = useState("");
  const [nPallet, setNPallet] = useState("");

  // Nuevos estados para el formato completo del QR
  const [codigoInterno, setCodigoInterno] = useState("");
  const [peso, setPeso] = useState("");
  const [kg, setKg] = useState(""); // Nuevo estado para peso manual KG

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
    if (planta && !codigo && !showModal) {
      setTimeout(() => codigoRef.current?.focus(), 100);
    }
  }, [planta, showModal, codigo]);

  // Auto-close modal after 1.5 seconds
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        setShowModal(false);
        setTimeout(() => codigoRef.current?.focus(), 100);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const handleLogoutWrapper = () => {
    // Limpiar planta seleccionada al cerrar sesión
    localStorage.removeItem("selectedPlanta");
    onLogout();
  };

  const obtenerDescripcion = async (codigo) => {
    try {
      const response = await fetch(`${API_URL}/api/materiales/${codigo}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Material de backend:", data);
        setDescripcion(data.description || "Sin descripción");
      } else {
        console.warn("Material no encontrado o error:", response.status);
        setDescripcion("Sin descripción");
      }
    } catch (error) {
      console.error("Error obteniendo descripción:", error);
      setDescripcion("Sin descripción");
    }
  };

  const parseQR = (value) => {
    // Formato esperado: REFERENCIA|CODIGO|N_PALLET|LOTE|PESO
    // Ejemplo: 25120001|6180001|34|NOV25DF014|1152
    const parts = value.split("|");

    if (parts.length >= 4) {
      // parts[0]: Código interno
      // parts[1]: Código principal
      // parts[2]: Número de pallet
      // parts[3]: Lote
      // parts[4]: Peso (opcional)

      setCodigoInterno(parts[0]); // Código interno
      setCodigo(parts[1]); // Código principal
      setNPallet(parts[2]); // Número de pallet
      setLote(parts[3]); // Lote
      setPeso(parts[4] || ""); // Peso (opcional)

      // Obtener descripción usando el código principal
      obtenerDescripcion(parts[1]);

      console.log("QR parseado:", {
        codigoInterno: parts[0],
        codigo: parts[1],
        nPallet: parts[2],
        lote: parts[3],
        peso: parts[4] || "",
      });

      return {
        codigoInterno: parts[0],
        codigo: parts[1],
        nPallet: parts[2],
        lote: parts[3],
        peso: parts[4] || "",
      };
    }

    return null;
  };

  const handleCodigoChange = (e) => {
    const val = e.target.value;
    // Intentar parsear si es un QR completo pegado de golpe
    const parsedData = parseQR(val);

    if (parsedData) {
      // Si se parseó correctamente, guardar automáticamente en GROUND
      console.log("QR parseado correctamente, iniciando auto-guardado...");
      // Pasamos los datos parseados directamente
      handleSaveRecibo(parsedData);
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

      console.log(
        "Configurando auto-guardado en",
        waitTime,
        "ms para:",
        newUbicacion,
      ); // Debug

      ubicacionTimeoutRef.current = setTimeout(() => {
        // Verificar que todavía tenemos los datos necesarios
        if (newUbicacion.trim() && planta && codigo.trim()) {
          console.log("Auto-guardando con ubicación final:", newUbicacion); // Debug
          handleSaveRecibo();
        }
      }, waitTime);
    }
  };

  const handleSaveRecibo = async (data = null) => {
    // Si vienen datos directos (del parseo automático), usarlos. Si no, usar el estado.
    const currentCodigo = data ? data.codigo : codigo;
    const currentCodigoInterno = data ? data.codigoInterno : codigoInterno;
    const currentNPallet = data ? data.nPallet : nPallet;
    const currentLote = data ? data.lote : lote;
    const currentPeso = data ? data.peso : peso;

    // Forzar lectura actual del estado
    const currentUbicacion = ubicacionRef.current?.value || ubicacion;

    console.log("Datos a guardar:", {
      planta,
      codigo,
      ubicacion: currentUbicacion,
      codigoInterno: currentCodigoInterno,
      nPallet: currentNPallet,
      lote: currentLote,
      peso: currentPeso,
    }); // Debug

    if (!planta || !currentCodigo || !currentUbicacion) {
      console.log("Validación fallida - Datos faltantes:", {
        planta,
        codigo: currentCodigo,
        ubicacion: currentUbicacion,
      }); // Debug
      setMessage({
        type: "error",
        text: "Faltan datos obligatorios (Planta, Código, Ubicación)",
      });
      return;
    }

    // Solo guardar si la ubicación es GROUND y tenemos datos completos del QR
    if (currentUbicacion !== "GROUND") {
      setMessage({
        type: "error",
        text: "Solo se permite guardar en la ubicación GROUND",
      });
      return;
    }

    if (
      !currentCodigoInterno ||
      !currentCodigo ||
      !currentNPallet ||
      !currentLote
    ) {
      setModalType("error");
      setModalMessage("Se requiere escanear un QR completo");
      setShowModal(true);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Guardando pallet en GROUND con datos completos:", {
        codigoInterno: currentCodigoInterno,
        codigo: currentCodigo,
        nPallet: currentNPallet,
        lote: currentLote,
        peso: currentPeso,
        kg,
      });

      const groundResponse = await fetch(`${API_URL}/api/pallets-ground`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_interno: currentCodigoInterno,
          codigo: currentCodigo,
          numero_pallet: currentNPallet,
          lote: currentLote,
          peso: currentPeso,
          planta: planta,
          kg: parseInt(kg) || 0, // Enviar kg manual
          usuario: user?.usuario || "Desconocido",
        }),
      });

      if (groundResponse.ok) {
        // Mostrar modal de éxito
        setModalType("success");
        setModalMessage("Pallet ingresado");
        setShowModal(true);

        // Limpiar campos excepto planta y ubicación (GROUND se mantiene)
        setCodigo("");
        setDescripcion("");
        setLote("");
        setNPallet("");
        setCodigoInterno("");
        setPeso("");
        // No limpiamos kg si el usuario quiere que siga funcionando como está,
        // pero usualmente para un nuevo pallet se debería limpiar o mantener según flujo.
        // El usuario dijo "dejalo como esta actual mente", así que si antes se limpiaba, se limpia.
        setKg("");
        setRefreshTrigger((prev) => prev + 1); // Actualizar lista

        // El foco debe volver a código
        setTimeout(() => codigoRef.current?.focus(), 100);
      } else {
        const errorData = await groundResponse.json().catch(() => ({}));

        if (groundResponse.status === 409) {
          setModalType("error");
          setModalMessage("Este pallet ya fue ingresado");
          setShowModal(true);
        } else {
          setModalType("error");
          setModalMessage(errorData.error || "Error al guardar pallet");
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error("Error saving recibo:", error);
      setModalType("error");
      setModalMessage("Error de conexión");
      setShowModal(true);
    } finally {
      setIsLoading(false);
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
      <div className="recibo-container box-shadow-container">
        <h2 className="title">Recibo de Planta</h2>

        {showModal && (
          <AlertModal
            type={modalType}
            message={modalMessage}
            onClose={() => {
              setShowModal(false);
              setTimeout(() => codigoRef.current?.focus(), 100);
            }}
          />
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
          <label className="label-text">Peso Bruto</label>
          <div className="input-wrapper">
            <input
              type="number"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              placeholder="Ingrese Kilos"
              className="scanner-input"
            />
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

        {/* Campo de ubicación eliminado ya que se guarda en GROUND automáticamente */}

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
        />
      </div>
    </div>
  );
};

export default RecibirDePlanta;
