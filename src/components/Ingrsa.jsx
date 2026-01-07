import React, { useState, useEffect } from "react";
import "./Ingresa.css";
import AlertModal from "./AlertModal";
import { useConfig } from "../context/ConfigContext";
import API_URL from "../apiConfig";

const Ingresa = ({ onBack, onLogout, user }) => {
  const { t } = useConfig();
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [position, setPosition] = useState("");
  const [lote, setLote] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Función para validar si una ubicación existe en la base de datos
  const validateUbicacion = async (ubicacion) => {
    try {
      const response = await fetch(
        `${API_URL}/api/ubicaciones/validar/${encodeURIComponent(ubicacion)}`
      );
      return response.ok;
    } catch (error) {
      console.error("Error validando ubicación:", error);
      return false;
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSave = async () => {
    // Validar campos requeridos
    const camposFaltantes = [];
    if (!code.trim()) camposFaltantes.push("Código de Material");
    if (!quantity || quantity.trim() === "") camposFaltantes.push("Cantidad");
    if (!position.trim()) camposFaltantes.push("Posición");

    if (camposFaltantes.length > 0) {
      setErrorMsg(`Faltan campos por llenar: ${camposFaltantes.join(", ")}`);
      return;
    }

    // Validar que la ubicación exista en la base de datos
    setLoading(true);
    try {
      const ubicacionValida = await validateUbicacion(position.trim());

      if (!ubicacionValida) {
        setErrorMsg(`La ubicación "${position}" no existe en la base de datos`);
        setLoading(false);
        return;
      }
    } catch (error) {
      setErrorMsg("Error al validar ubicación. Intente nuevamente.");
      setLoading(false);
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("La cantidad debe ser un número mayor a cero");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Extraer el nombre de usuario si user es un objeto, sino usar el string directamente
      const userName =
        typeof user === "object" && user !== null
          ? user.usuario
          : user || "Usuario Desconocido";

      const response = await fetch(`${API_URL}/api/stock/ingresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          quantity: qty,
          position: position.trim(),
          lote: lote.trim(), // Agregar lote
          user: userName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData && errorData.error ? errorData.error : t("error");
        console.error("Error del servidor:", errorData);
        setErrorMsg(message);
        return;
      }

      const data = await response.json();

      setSuccessMsg({
        text: t("ingSuccess"),
        total: data.cantidadTotal,
      });

      // Limpiar campos después de guardar
      setCode("");
      setQuantity("");
      setPosition("");
      setLote(""); // Limpiar lote
    } catch (err) {
      console.error("Error en handleSave:", err);
      setErrorMsg(err.message || t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ingresa-container">
      <div className="ingresa-header">
        <h3 className="ingresa-title">{t("ingTitle")}</h3>
        {isDesktop && (
          <button
            className="ingresa-save-btn"
            onClick={handleSave}
            disabled={loading}
          >
            <i className="fas fa-save"></i>
            <span>{loading ? t("loading") : t("save")}</span>
          </button>
        )}
      </div>

      <div className="ingresa-form-col">
        <label className="ingresa-label">{t("ingCode")}</label>
        <div className="ingresa-row">
          <input
            type="text"
            className="ingresa-input"
            placeholder={t("consInputLabel")}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>

        <label className="ingresa-label">{t("ingQty")}</label>
        <div className="ingresa-row">
          <input
            type="number"
            min="0"
            className="ingresa-input"
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <label className="ingresa-label">Lote</label>
        <div className="ingresa-row">
          <input
            type="text"
            className="ingresa-input"
            placeholder="Número de lote (opcional)"
            value={lote}
            onChange={(e) => setLote(e.target.value.toUpperCase())}
          />
        </div>

        <label className="ingresa-label">{t("ingPos")}</label>
        <div className="ingresa-row">
          <input
            type="text"
            className="ingresa-input"
            placeholder={t("ingPos")}
            value={position}
            onChange={(e) => {
              const newPosition = e.target.value.toUpperCase();
              setPosition(newPosition);
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && position.trim()) {
                handleSave();
              }
            }}
          />
        </div>

        {/* Botón Guardar solo en móvil */}
        {!isDesktop && (
          <div className="ingresa-actions-row">
            <button
              className="ingresa-save-btn"
              onClick={handleSave}
              disabled={loading}
            >
              <i className="fas fa-save"></i>
              <span>{loading ? t("loading") : t("save")}</span>
            </button>
          </div>
        )}

        {(onBack || onLogout) && (
          <div className="ingresa-back-row">
            {!isDesktop && onBack && (
              <button
                className="btn-action"
                onClick={() => {
                  setCode("");
                  setQuantity("");
                  setPosition("");
                  setLote("");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  onBack();
                }}
              >
                <i className="fas fa-arrow-left"></i>
                <span className="btn-text">{t("back")}</span>
              </button>
            )}
            {!isDesktop && onLogout && (
              <button className="btn-action btn-logout" onClick={onLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span className="btn-text">{t("logout")}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de éxito */}
      {successMsg && (
        <AlertModal
          type="success"
          message={successMsg.text}
          extra={{ "Cantidad total en ubicación": successMsg.total }}
          onClose={() => setSuccessMsg(null)}
        />
      )}

      {/* Modal de error */}
      {errorMsg && (
        <AlertModal
          type="error"
          message={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}
    </div>
  );
};

export default Ingresa;
