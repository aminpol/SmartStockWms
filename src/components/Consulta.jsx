import React, { useState } from "react";
import "./Consulta.css";
import { useConfig } from "../context/ConfigContext";

const Consulta = ({ onBack, onLogout, onNavigateToPicking }) => {
  const { t } = useConfig();
  const [code, setCode] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSearch = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setMessage(t("error"));
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setResults([]);

      // Determinar si es búsqueda por ubicación (formato LR-XX-XX)
      const isLocation = /^LR-\d{2}-\d{2}$/i.test(trimmed);

      let url;
      if (isLocation) {
        url = `https://smartstockwms-a8p6.onrender.com/api/stock/ubicacion/${encodeURIComponent(
          trimmed
        )}`;
      } else {
        url = `https://smartstockwms-a8p6.onrender.com/api/stock/consulta/${encodeURIComponent(
          trimmed
        )}`;
      }

      const response = await fetch(url);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const text = data && data.error ? data.error : t("error");
        setMessage(text);
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        setMessage(t("consNoResults"));
        setResults([]);
        return;
      }

      setResults(data);
    } catch (error) {
      console.error(error);
      setMessage(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setResults([]);
      setCode("");

      const response = await fetch(
        "https://smartstockwms-a8p6.onrender.com/api/stock/all"
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const text = data && data.error ? data.error : t("error");
        setMessage(text);
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        setMessage("No hay stock disponible en el inventario.");
        setResults([]);
        return;
      }

      setResults(data);
    } catch (error) {
      console.error(error);
      setMessage(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="consulta-container">
      <div className="consulta-top">
        <h3 className="consulta-title">{t("consTitle")}</h3>
        <div className="consulta-form-row">
          <input
            type="text"
            className="consulta-input"
            placeholder="Código o Ubicación (LR-XX-XX)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
          />
          <button
            className="consulta-search-btn"
            onClick={handleSearch}
            disabled={loading}
            title="Buscar"
          >
            <i className="fas fa-search"></i>
          </button>
          <button
            className="consulta-view-all-btn"
            onClick={handleViewAll}
            disabled={loading}
            title="Ver Todo"
            style={{
              marginLeft: "0.5rem",
              padding: "0.5rem",
              width: "40px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>

        {message && (
          <div className="consulta-message">
            <p>{message}</p>
            <button
              type="button"
              className="consulta-ok-btn"
              onClick={() => setMessage(null)}
            >
              OK
            </button>
          </div>
        )}

        {results.length > 0 && (
          <div className="consulta-results">
            <table className="consulta-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>{t("consTableDesc")}</th>
                  <th>{t("consTablePos")}</th>
                  <th>{t("consTableQty")}</th>
                  <th>Lote</th>
                  <th>{t("consTableAction")}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => (
                  <tr key={`${row.id}-${row.posicion}-${idx}`}>
                    <td style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                      {row.id}
                    </td>
                    <td
                      style={{
                        fontSize:
                          window.innerWidth < 480 ? "0.65rem" : "inherit",
                        paddingRight:
                          window.innerWidth < 480 ? "0.2rem" : "1.5rem",
                      }}
                    >
                      {row.descrip}
                    </td>
                    <td
                      style={{
                        fontSize:
                          window.innerWidth < 480 ? "0.75rem" : "inherit",
                        whiteSpace: "nowrap",
                        minWidth: window.innerWidth < 480 ? "60px" : "auto",
                      }}
                    >
                      {row.posicion}
                    </td>
                    <td
                      style={{
                        fontSize:
                          window.innerWidth < 480 ? "0.9rem" : "0.95rem",
                        fontWeight: "500",
                        color: "#000",
                        paddingLeft:
                          window.innerWidth < 480 ? "0.2rem" : "1rem",
                        paddingRight:
                          window.innerWidth < 480 ? "0.1rem" : "1rem",
                      }}
                    >
                      {Math.floor(row.cantidad)}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{row.lote || "-"}</td>
                    <td
                      style={{
                        paddingLeft:
                          window.innerWidth < 480 ? "0.5rem" : "inherit",
                        display:
                          window.innerWidth >= 1024 ? "flex" : "table-cell",
                        justifyContent:
                          window.innerWidth >= 1024 ? "center" : "inherit",
                        alignItems:
                          window.innerWidth >= 1024 ? "center" : "inherit",
                      }}
                    >
                      <button
                        type="button"
                        className="consulta-picking-btn"
                        style={{
                          display:
                            window.innerWidth >= 1024 ? "block" : "inline-flex",
                          margin: window.innerWidth >= 1024 ? "0" : "inherit",
                        }}
                        onClick={() =>
                          onNavigateToPicking &&
                          onNavigateToPicking({
                            code: row.id,
                            position: row.posicion,
                          })
                        }
                      >
                        P
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="consulta-actions" style={{ justifyContent: "center" }}>
        {(code || results.length > 0) && (
          <button
            className="btn-action btn-clear-bottom"
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.85rem",
            }}
            onClick={() => {
              setCode("");
              setResults([]);
              setMessage(null);
            }}
            title={t("clear")}
          >
            <i className="fas fa-eraser"></i>
            <span className="btn-text">{t("clear")}</span>
          </button>
        )}
        {window.innerWidth < 1024 && (
          <>
            {onBack && (
              <button
                className="btn-action"
                onClick={() => {
                  setCode("");
                  setResults([]);
                  setMessage(null);
                  onBack();
                }}
              >
                <i className="fas fa-arrow-left"></i>
                <span className="btn-text">{t("back")}</span>
              </button>
            )}
            {onLogout && (
              <button className="btn-action btn-logout" onClick={onLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span className="btn-text">{t("logout")}</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Consulta;
