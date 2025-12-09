import React, { useRef, useState } from "react";
import "./Movimientos.css";
import AlertModal from "./AlertModal";
import { useConfig } from "../context/ConfigContext";

const Movimientos = ({ onBack, onLogout, user }) => {
  const { t } = useConfig();
  // Cargar estado inicial (sin persistencia)
  const [fromPosition, setFromPosition] = useState("");
  const [quantity, setQuantity] = useState("");
  const [toPosition, setToPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fromRef = useRef(null);
  const qtyRef = useRef(null);
  const toRef = useRef(null);

  const focusFrom = () => {
    if (fromRef.current) {
      fromRef.current.focus();
    }
  };

  const handleFromKeyDown = (e) => {
    if (e.key === "Enter") {
      // Al presionar Enter en Ubicación, pasar al input de cantidad
      if (qtyRef.current) {
        qtyRef.current.focus();
      }
    }
  };

  const handleFromChange = (e) => {
    const value = e.target.value.toUpperCase();
    setFromPosition(value);
    
    // Solo auto-avanzar si parece un código de escaneo (más de 8 caracteres o formato específico)
    if (value.trim() && (value.length > 8 || /^LR-\d{2}-\d{2}$/i.test(value))) {
      setTimeout(() => {
        if (qtyRef.current) {
          qtyRef.current.focus();
        }
      }, 100);
    }
  };

  const goToDestination = () => {
    if (!quantity) {
      setMessage({ type: "error", text: "Debe ingresar la cantidad a mover." });
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setMessage({
        type: "error",
        text: t("error"),
      });
      return;
    }
    if (toRef.current) {
      toRef.current.focus();
    }
  };

  const handleQtyKeyDown = (e) => {
    if (e.key === "Enter") {
      goToDestination();
    }
  };

  const handleToKeyDown = (e) => {
    if (e.key === "Enter") {
      handleMove();
    }
  };

  const handleToChange = (e) => {
    const value = e.target.value.toUpperCase();
    setToPosition(value);
    
    // Solo auto-guardar si parece un código de escaneo (más de 8 caracteres o formato específico)
    if (value.trim() && (value.length > 8 || /^LR-\d{2}-\d{2}$/i.test(value))) {
      setTimeout(() => {
        handleMove();
      }, 100);
    }
  };

  const handleMove = async () => {
    // Validar campos requeridos
    const camposFaltantes = [];
    if (!fromPosition.trim()) camposFaltantes.push("Posición de Origen");
    if (!quantity || quantity.trim() === "") camposFaltantes.push("Cantidad");
    if (!toPosition.trim()) camposFaltantes.push("Posición de Destino");

    if (camposFaltantes.length > 0) {
      setMessage({
        type: "error",
        text: `Faltan campos por llenar: ${camposFaltantes.join(", ")}`,
      });
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setMessage({
        type: "error",
        text: "La cantidad debe ser un número mayor a cero",
      });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      // Extraer el nombre de usuario si user es un objeto, sino usar el string directamente
      const userName =
        typeof user === "object" && user !== null
          ? user.usuario
          : user || "Usuario Desconocido";

      const response = await fetch(
        "https://smartstockwms-a8p6.onrender.com/api/stock/mover",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromPosition: fromPosition.trim(),
            toPosition: toPosition.trim(),
            quantity: qty,
            user: userName,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const text = data && data.error ? data.error : t("error");
        setMessage({ type: "error", text });
        return;
      }

      setMessage({
        type: "success",
        text: t("success"),
        extra: {
          fromRestante: data.fromRestante,
          toTotal: data.toTotal,
        },
      });

      // Limpiar campos para siguiente movimiento
      setFromPosition("");
      setQuantity("");
      setToPosition("");

      // Volver el foco al primer input
      setTimeout(() => {
        focusFrom();
      }, 0);
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: t("error"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMessage = () => {
    setMessage(null);
    focusFrom();
  };

  return (
    <div className="movimientos-container">
      <h3 className="movimientos-title">{t("movTitle")}</h3>

      <div className="movimientos-form">
        <label className="mov-label">Ubicación</label>
        <input
          ref={fromRef}
          type="text"
          className="mov-input"
          placeholder="Ubicación"
          value={fromPosition}
          onChange={handleFromChange}
          onKeyDown={handleFromKeyDown}
        />

        <label className="mov-label">{t("ingQty")}</label>
        <div className="mov-row">
          <input
            ref={qtyRef}
            type="number"
            min="0"
            className="mov-input"
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={handleQtyKeyDown}
          />
          <button
            type="button"
            className="mov-enter-btn"
            onClick={goToDestination}
          >
            Enter
          </button>
        </div>

        <label className="mov-label">Nueva Ubicación</label>
        <input
          ref={toRef}
          type="text"
          className="mov-input"
          placeholder="Nueva Ubicación"
          value={toPosition}
          onChange={handleToChange}
          onKeyDown={handleToKeyDown}
        />
      </div>

      {(onBack || onLogout) && (
        <div className="movimientos-actions-row">
          {onBack && (
            <>
              <button className="btn-action" onClick={onBack}>
                <i className="fas fa-arrow-left"></i>
                <span className="btn-text">{t("back")}</span>
              </button>
              <button className="btn-action btn-save" onClick={handleMove} disabled={loading}>
                <i className="fas fa-save"></i>
                <span className="btn-text">Guardar</span>
              </button>
            </>
          )}
          {onLogout && (
            <button className="btn-action btn-logout" onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span className="btn-text">Cerrar sesión</span>
            </button>
          )}
        </div>
      )}

      {message && (
        <AlertModal
          type={message.type}
          message={message.text}
          extra={
            message.extra
              ? {
                  "Cantidad restante en origen": message.extra.fromRestante,
                  "Cantidad total en destino": message.extra.toTotal,
                }
              : null
          }
          onClose={handleCloseMessage}
        />
      )}
    </div>
  );
};

export default Movimientos;
