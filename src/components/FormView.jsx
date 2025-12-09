import React from "react";
import "./Footer.css";
import { useConfig } from "../context/ConfigContext";

const FormView = ({ onMenuOption, onLogout, user }) => {
  const { t } = useConfig();

  return (
    <div id="pantallaFormulario">
      <h2 className="menu-title">{t("menuTitle")}</h2>

      <div className="config-section">
        <div className="form-group">
          <div
            style={{
              marginBottom: "1rem",
              paddingRight: "0.5rem",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <i
              className="fas fa-user"
              style={{ color: "#1e293b", fontSize: "1rem" }}
            ></i>
            <span
              style={{ fontWeight: "bold", fontSize: "1rem", color: "#1e293b" }}
            >
              {user?.usuario || "Usuario"}
            </span>
          </div>
          <div className="code-type-buttons">
            <button className="type-btn" onClick={() => onMenuOption("qr")}>
              <i className="fas fa-qrcode"></i>
              <span>{t("optionQr")}</span>
            </button>
            <button
              className="type-btn"
              onClick={() => onMenuOption("barcode")}
            >
              <i className="fas fa-barcode"></i>
              <span>{t("optionBarcode")}</span>
            </button>
            <button className="type-btn" onClick={() => onMenuOption("text")}>
              <i className="fas fa-font"></i>
              <span>{t("optionText")}</span>
            </button>
            <button
              className="type-btn"
              onClick={() => onMenuOption("qr-pallet")}
            >
              <i className="fas fa-pallet"></i>
              <span>{t("optionQrPallet")}</span>
            </button>
            <button
              className="type-btn"
              onClick={() => onMenuOption("recibir-planta")}
            >
              <i className="fas fa-industry"></i>
              <span>{t("optionReciboPlanta")}</span>
            </button>
            {/* Botón extra para Stock de Inventario dentro del mismo grid */}
            <button
              className={`type-btn inventory-btn ${
                user?.tipo_usuario === "administrador" ? "with-admin" : ""
              }`}
              onClick={() => onMenuOption("inventory")}
            >
              <i className="fas fa-boxes"></i>
              <span>{t("optionInventory")}</span>
            </button>
            {
              /* Botón de Administrador (Solo visible para Administrador y en PC) */
              /* Se muestra abajo ocupando todo el ancho */
              user?.tipo_usuario === "administrador" && (
                <button
                  className="type-btn admin-btn"
                  style={{ gridColumn: "1 / -1" }}
                  onClick={() => onMenuOption("admin")}
                >
                  <i className="fas fa-user-shield"></i>
                  <span>{t("optionAdmin")}</span>
                </button>
              )
            }
          </div>
        </div>
      </div>

      <div className="logout-container">
        <button
          className="btn-action btn-logout"
          onClick={onLogout}
          title={t("logout")}
        >
          <i className="fas fa-sign-out-alt"></i>
          <span className="btn-text">{t("logout")}</span>
        </button>
      </div>

      <footer className="app-footer">
        <p> 2025 Amin Polanco. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default FormView;
