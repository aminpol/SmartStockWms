import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Inventario.css";
import Consulta from "./Consulta";
import Ingresa from "./Ingrsa";
import Movimientos from "./Movimientos";
import Picking from "./Picking";

import { useConfig } from "../context/ConfigContext";

const Inventario = ({ onBack, onLogout, user }) => {
  const navigate = useNavigate();
  const { t } = useConfig();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  
  // En móvil, siempre empezar sin tab activo para mostrar el submenú
  // En desktop, usar localStorage para mantener el estado
  const [activeTab, setActiveTab] = useState(() => {
    if (window.innerWidth >= 1024) {
      return localStorage.getItem("inventario_tab") || null;
    }
    // En móvil, limpiar localStorage y empezar sin tab
    localStorage.removeItem("inventario_tab");
    return null;
  });
  
  const [pickingInitialCode, setPickingInitialCode] = useState(null);
  const [pickingExpectedPosition, setPickingExpectedPosition] = useState(null);
  const [pickingKey, setPickingKey] = useState(0);

  useEffect(() => {
    // Solo guardar en localStorage si estamos en desktop
    if (isDesktop && activeTab) {
      localStorage.setItem("inventario_tab", activeTab);
    } else if (!isDesktop && activeTab) {
      // En móvil, no guardar en localStorage
      localStorage.removeItem("inventario_tab");
    }
  }, [activeTab, isDesktop]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleConsultaClick = () => {
    setActiveTab("consulta");
  };

  const handleIngresaClick = () => {
    setActiveTab("ingresa");
  };

  const handleMovimientosClick = () => {
    setActiveTab("movimientos");
  };

  const handleNavigateToPicking = (data) => {
    setPickingInitialCode(data.code);
    setPickingExpectedPosition(data.position);
    setActiveTab("picking");
    // Forzar reset del componente Picking incrementando un contador
    setPickingKey((prev) => prev + 1);
  };

  const handleBackToMenu = () => {
    setActiveTab(null);
  };

  return (
    <div id="pantallaInventario">
      <div style={{ display: !isDesktop && activeTab ? "none" : "block" }}>
        <h2 className="menu-title">{t("inventoryTitle")}</h2>
        <p className="inventory-subtitle">{t("inventorySubtitle")}</p>
      </div>

      <div className="inventory-layout">
        {/* Panel izquierdo: submenú - Ocultar en móvil si hay una pestaña activa */}
        <div
          className="inventory-panel inventory-menu"
          style={{ display: !isDesktop && activeTab ? "none" : "block" }}
        >
          <div className="inventory-submenu">
            <button
              className={`type-btn inventory-tab ${
                activeTab === "consulta" ? "active" : ""
              }`}
              onClick={handleConsultaClick}
            >
              <i className="fas fa-search"></i>
              <span className="btn-text">{t("tabConsulta")}</span>
            </button>
            <button
              className={`type-btn inventory-tab ${
                activeTab === "ingresa" ? "active" : ""
              }`}
              onClick={handleIngresaClick}
            >
              <i className="fas fa-plus-circle"></i>
              <span className="btn-text">{t("tabIngresa")}</span>
            </button>
            <button
              className={`type-btn inventory-tab ${
                activeTab === "movimientos" ? "active" : ""
              }`}
              onClick={handleMovimientosClick}
            >
              <i className="fas fa-exchange-alt"></i>
              <span className="btn-text">{t("tabMovimientos")}</span>
            </button>
          </div>

          <div className="inventory-actions">
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
        </div>

        {/* Panel derecho: contenido - Mostrar siempre en desktop, o en móvil si hay tab activo */}
        <div
          className="inventory-panel inventory-content"
          style={{ display: isDesktop || activeTab ? "block" : "none" }}
        >
          <div style={{ display: activeTab === "consulta" ? "block" : "none" }}>
            <Consulta
              onNavigateToPicking={handleNavigateToPicking}
              onBack={handleBackToMenu}
              onLogout={onLogout}
            />
          </div>
          <div style={{ display: activeTab === "ingresa" ? "block" : "none" }}>
            <Ingresa
              user={user}
              onBack={handleBackToMenu}
              onLogout={onLogout}
            />
          </div>
          <div
            style={{ display: activeTab === "movimientos" ? "block" : "none" }}
          >
            <Movimientos user={user} onBack={handleBackToMenu} />
          </div>
          <div style={{ display: activeTab === "picking" ? "block" : "none" }}>
            <Picking
              key={pickingKey}
              onBack={() => setActiveTab("consulta")}
              initialCode={pickingInitialCode}
              expectedPosition={pickingExpectedPosition}
              user={user}
            />
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>© 2025 Amin Polanco. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Inventario;
