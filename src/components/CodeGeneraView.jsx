import React, { useState, useEffect } from "react";
import "./Footer.css";
import { useConfig } from "../context/ConfigContext";

const CodeGeneraView = ({ onBack, onLogout }) => {
  const { t } = useConfig();
  const [showButtons, setShowButtons] = useState(true);

  useEffect(() => {
    const handleMessage = (event) => {
      // Verificar que el mensaje sea del iframe
      if (event.data && event.data.action) {
        if (event.data.action === 'hideButtons') {
          setShowButtons(false);
        } else if (event.data.action === 'showButtons') {
          setShowButtons(true);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div
      id="pantallaCodeGenera"
      style={{
        width: "100%",
        minHeight: "calc(100vh - 4rem)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <iframe
        title="Generar Códigos"
        src="/CodeGenera/index.html"
        style={{
          width: "100%",
          flex: "1 1 auto",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          background: "#ffffff",
        }}
      />
      {showButtons && (
        <div
          className="bottom-actions"
          style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "0.75rem",
            justifyContent: "center",
          }}
        >
          <button className="btn-action" onClick={onBack} title={t("back")}>
            <i className="fas fa-arrow-left"></i>
            <span className="btn-text">{t("back")}</span>
          </button>
          <button
            className="btn-action btn-logout"
            onClick={onLogout}
            title={t("logout")}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span className="btn-text">{t("logout")}</span>
          </button>
        </div>
      )}
      <footer className="app-footer">
        <p>© 2025 Amin Polanco. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default CodeGeneraView;
