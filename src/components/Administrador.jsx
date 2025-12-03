import React, { useState, useEffect } from "react";
import "./Administrador.css";
import Usuarios from "./Usuarios";
import VerMovimientos from "./VerMovimientos";
import EditarCrearProd from "./EditarCrearProd";
import Configuracion from "./Configuracion";
import { useConfig } from "../context/ConfigContext";

const Administrador = ({ onBack, onLogout, user }) => {
  const [activeTab, setActiveTab] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const { t } = useConfig();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "usuarios":
        return <Usuarios />;
      case "movimientos":
        return <VerMovimientos />;
      case "productos":
        return (
          <EditarCrearProd onBack={() => setActiveTab(null)} user={user} />
        );
      case "configuracion":
        return <Configuracion />;
      default:
        return null;
    }
  };

  return (
    <div id="pantallaAdministrador">
      <h2 className="admin-title">{t("adminTitle")}</h2>

      <div className="admin-layout">
        {/* Panel izquierdo: submenú - Solo visible en PC y para administrador */}
        {isDesktop && user?.tipo_usuario === "administrador" && (
          <div className="admin-panel admin-menu">
            <div className="admin-submenu">
              <button
                className={`type-btn admin-tab ${
                  activeTab === "usuarios" ? "active" : ""
                }`}
                onClick={() => setActiveTab("usuarios")}
              >
                <i className="fas fa-users"></i>
                <span className="btn-text">{t("tabUsers")}</span>
              </button>
              <button
                className={`type-btn admin-tab ${
                  activeTab === "movimientos" ? "active" : ""
                }`}
                onClick={() => setActiveTab("movimientos")}
              >
                <i className="fas fa-exchange-alt"></i>
                <span className="btn-text">{t("tabMovements")}</span>
              </button>
              <button
                className={`type-btn admin-tab ${
                  activeTab === "productos" ? "active" : ""
                }`}
                onClick={() => setActiveTab("productos")}
              >
                <i className="fas fa-box-open"></i>
                <span className="btn-text">{t("tabProducts")}</span>
              </button>
              <button
                className={`type-btn admin-tab ${
                  activeTab === "configuracion" ? "active" : ""
                }`}
                onClick={() => setActiveTab("configuracion")}
              >
                <i className="fas fa-cogs"></i>
                <span className="btn-text">{t("tabConfig")}</span>
              </button>
            </div>

            <div className="admin-actions">
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
        )}

        {/* Panel derecho: contenido dinámico */}
        <div className="admin-panel admin-content">
          {/* Mensaje si no es administrador o no hay tab activa */}
          {(!isDesktop || user?.tipo_usuario !== "administrador") &&
            !activeTab && (
              <div className="admin-placeholder">
                <i className="fas fa-user-shield"></i>
                <h3>{t("adminTitle")}</h3>
                <p>
                  {user?.tipo_usuario === "administrador"
                    ? t("adminSubtitle")
                    : "Acceso restringido. Solo administradores pueden usar estas funciones."}
                </p>
              </div>
            )}

          {renderContent()}
        </div>
      </div>

      <footer className="app-footer">
        <p>© 2025 Amin Polanco. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Administrador;
