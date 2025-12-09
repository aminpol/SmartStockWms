import React, { useState } from "react";
import CodeItem from "./CodeItem";
import "./Footer.css";
import { useConfig } from "../context/ConfigContext";

const CodesView = ({
  codes,
  onBack,
  onPrint,
  settings,
  setSettings,
  onDelete,
  onGenerate,
  onLogout,
  onClear,
}) => {
  const [content, setContent] = useState("");
  const { t } = useConfig();

  const handleGenerate = () => {
    if (!content.trim()) {
      alert("Ingrese al menos un contenido");
      return;
    }
    onGenerate(content);
    setContent("");
  };

  return (
    <div id="pantallaCodigos">
      <div className="codes-layout">
        {/* Columna izquierda: vista previa */}
        <div className="codes-left">
          <div className="preview-header">
            <button
              type="button"
              className="btn-action btn-clear-preview"
              onClick={onClear}
            >
              <i className="fas fa-sync-alt"></i>
              <span className="btn-text">{t("clear")}</span>
            </button>
          </div>
          <div id="previewArea">
            {codes.map((code, index) => (
              <CodeItem
                key={index}
                {...code}
                width={220 * (settings.codeWidth / 100)}
                height={settings.codeHeight}
                onDelete={() => onDelete(index)}
              />
            ))}
          </div>
        </div>

        {/* Columna derecha: botones y controles */}
        <div className="codes-right">
          {/* Botones superiores */}
          <div className="top-bar">
            <button className="btn-action" onClick={onBack} title={t("back")}>
              <i className="fas fa-arrow-left"></i>
              <span className="btn-text">{t("back")}</span>
            </button>
            <button
              className="btn-action btn-print"
              onClick={onPrint}
              title={t("genBtnPrint")}
            >
              <i className="fas fa-print"></i>
              <span className="btn-text">{t("genBtnPrint")}</span>
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

          {/* Controles: Tamaño de texto, Ancho y Alto */}
          <div className="controls-bar">
            <div className="control-item">
              <label htmlFor="textoTamano">
                {t("genSize")}:{" "}
                <span id="sizeValue">{settings.textSize}px</span>
              </label>
              <input
                type="range"
                id="textoTamano"
                min="10"
                max="40"
                value={settings.textSize}
                step="1"
                style={{
                  '--value': `${((settings.textSize - 10) / (40 - 10)) * 100}%`
                }}
                onChange={(e) =>
                  setSettings({ ...settings, textSize: e.target.value })
                }
              />
            </div>
            <div className="control-item control-row">
              <div>
                <label htmlFor="codeWidth">
                  {t("genWidth")}:{" "}
                  <span id="widthValue">{settings.codeWidth}%</span>
                </label>
                <input
                  type="range"
                  id="codeWidth"
                  min="50"
                  max="150"
                  value={settings.codeWidth}
                  step="1"
                  style={{
                    '--value': `${((settings.codeWidth - 50) / (150 - 50)) * 100}%`
                  }}
                  onChange={(e) =>
                    setSettings({ ...settings, codeWidth: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="codeHeight">
                  {t("genHeight")}:{" "}
                  <span id="heightValue">{settings.codeHeight}px</span>
                </label>
                <input
                  type="range"
                  id="codeHeight"
                  min="50"
                  max="300"
                  value={settings.codeHeight}
                  step="10"
                  style={{
                    '--value': `${((settings.codeHeight - 50) / (300 - 50)) * 100}%`
                  }}
                  onChange={(e) =>
                    setSettings({ ...settings, codeHeight: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Contenido y botón generar */}
          <div className="form-group">
            <label htmlFor="contenido">{t("genInputLabel")}</label>
            <textarea
              id="contenido"
              placeholder={t("genInputPlaceholder")}
              rows="1"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            ></textarea>
          </div>

          <div className="acciones">
            <button id="btnGenerar" onClick={handleGenerate}>
              {t("genBtnGenerate")}
            </button>
            {/* Icon below button - desktop only */}
            <div className="code-type-icon-display">
              {settings.type === "qr" && (
                <i className="fas fa-qrcode" title={t("optionQr")}></i>
              )}
              {settings.type === "barcode" && (
                <i className="fas fa-barcode" title={t("genType")}></i>
              )}
              {settings.type === "text" && (
                <i className="fas fa-font" title={t("genType")}></i>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer con copyright */}
      <footer className="app-footer">
        <p>© 2025 Amin Polanco. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default CodesView;
