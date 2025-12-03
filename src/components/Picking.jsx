import React, { useState, useRef, useEffect } from "react";
import "./Picking.css";
import { useConfig } from "../context/ConfigContext";

const Picking = ({ onBack, onLogout, initialCode, expectedPosition, user }) => {
  const { t } = useConfig();
  const [location, setLocation] = useState("");
  const [stockData, setStockData] = useState(null);
  const [quantityToWithdraw, setQuantityToWithdraw] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [withdrawalMade, setWithdrawalMade] = useState(false);

  const locationRef = useRef(null);
  const quantityRef = useRef(null);

  useEffect(() => {
    if (locationRef.current) {
      locationRef.current.focus();
    }
  }, []);

  const handleLocationKeyDown = async (e) => {
    if (e.key === "Enter") {
      const loc = location.trim();
      if (!loc) return;

      fetchStockInLocation(loc);
    }
  };

  const fetchStockInLocation = async (loc) => {
    try {
      setLoading(true);
      setMessage(null);
      setStockData(null);

      const response = await fetch(
        `http://localhost:3000/api/stock/ubicacion/${encodeURIComponent(loc)}`
      );
      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Error al buscar ubicación",
        });
        return;
      }

      // Si hay múltiples productos en la ubicación, tomamos el primero o filtramos por initialCode si existe
      let targetItem = data[0];
      if (initialCode) {
        const found = data.find((item) => item.id === initialCode);
        if (found) targetItem = found;
      }

      if (!targetItem) {
        setMessage({
          type: "error",
          text: t("consNoResults"),
        });
        return;
      }

      // Validar que la ubicación escaneada coincida con la esperada (si viene de Consulta)
      if (expectedPosition && loc !== expectedPosition) {
        setMessage({
          type: "error",
          text: `Ubicación incorrecta. Debe escanear: ${expectedPosition}`,
          showModal: true,
        });
        setLocation("");
        if (locationRef.current) locationRef.current.focus();
        return;
      }

      setStockData(targetItem);

      // Enfocar input de cantidad
      setTimeout(() => {
        if (quantityRef.current) quantityRef.current.focus();
      }, 100);
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: t("error") });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!stockData || !quantityToWithdraw) return;

    const qty = parseFloat(quantityToWithdraw);
    if (isNaN(qty) || qty <= 0) {
      setMessage({ type: "error", text: t("error") });
      return;
    }

    if (qty > stockData.cantidad) {
      setMessage({
        type: "error",
        text: t("pickErrorQty"),
      });
      return;
    }

    try {
      setLoading(true);
      // Extraer el nombre de usuario si user es un objeto, sino usar el string directamente
      const userName = typeof user === 'object' && user !== null ? user.usuario : (user || "Usuario Desconocido");

      const response = await fetch("http://localhost:3000/api/stock/retirar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: stockData.id,
          position: stockData.posicion,
          quantity: qty,
          user: userName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || t("error") });
        return;
      }

      setMessage({
        type: "success",
        text: t("pickSuccess"),
        showModal: true,
      });
      setQuantityToWithdraw("");
      setWithdrawalMade(true);

      // Volver a enfocar cantidad para permitir otro retiro
      if (quantityRef.current) quantityRef.current.focus();
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: t("error") });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Si ya se hizo un retiro, limpiar los campos antes de volver
    if (withdrawalMade) {
      setLocation("");
      setStockData(null);
      setQuantityToWithdraw("");
      setMessage(null);
      setWithdrawalMade(false);
    }
    onBack();
  };

  const handleModalOk = () => {
    if (message && message.type === "success") {
      // Si es un mensaje de éxito, volver a Consulta primero
      onBack(); // Esto establece activeTab a "consulta"
      // Luego limpiar el estado local
      setTimeout(() => {
        setLocation("");
        setStockData(null);
        setQuantityToWithdraw("");
        setMessage(null);
        setWithdrawalMade(false);
      }, 0);
    } else {
      // Si es un error, solo cerrar el modal
      setMessage(null);
    }
  };

  return (
    <div className="picking-container">
      <h3 className="picking-title">{t("pickTitle")}</h3>

      <div className="picking-form">
        <label className="picking-label">{t("pickLocation")}</label>
        <input
          ref={locationRef}
          type="text"
          className="picking-input"
          placeholder={t("pickLocation")}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={handleLocationKeyDown}
        />

        {stockData && (
          <div className="picking-info">
            <div className="info-row">
              <span className="info-label">{t("pickCode")}:</span>
              <span className="info-value">{stockData.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t("consTableDesc")}:</span>
              <span className="info-value">{stockData.descrip}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t("pickCurrentStock")}:</span>
              <span className="info-value">
                <strong>{parseFloat(stockData.cantidad)}</strong>
              </span>
            </div>
          </div>
        )}

        <label className="picking-label">{t("pickQtyToPick")}</label>
        <input
          ref={quantityRef}
          type="number"
          className="picking-input"
          placeholder={t("pickQtyToPick")}
          value={quantityToWithdraw}
          onChange={(e) => setQuantityToWithdraw(e.target.value)}
          disabled={!stockData}
        />

        <button
          className="picking-btn-retirar"
          onClick={handleWithdraw}
          disabled={!stockData || loading}
        >
          {loading ? t("loading") : t("pickBtnConfirm")}
        </button>
      </div>

      {message && message.showModal ? (
        <div className="picking-modal-overlay">
          <div
            className={`picking-modal ${
              message.type === "success" ? "picking-modal-success" : ""
            }`}
          >
            <p
              className={`picking-modal-text ${
                message.type === "success" ? "picking-modal-text-success" : ""
              }`}
            >
              {message.text}
            </p>
            <button className="picking-modal-btn" onClick={handleModalOk}>
              OK
            </button>
          </div>
        </div>
      ) : message ? (
        <div className={`picking-message ${message.type}`}>{message.text}</div>
      ) : null}

      <div className="picking-actions">
        <button className="btn-action" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
          <span className="btn-text">{t("back")}</span>
        </button>
      </div>
    </div>
  );
};

export default Picking;
