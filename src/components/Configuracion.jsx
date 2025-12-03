import React from "react";
import { useConfig } from "../context/ConfigContext";
import "./Configuracion.css";

const Configuracion = () => {
  const { config, updateConfig, t } = useConfig();

  const handleThemeChange = (theme) => {
    updateConfig({ theme });
  };

  const handleLanguageChange = (e) => {
    updateConfig({ language: e.target.value });
  };

  const handleGeneratorChange = (e) => {
    const { name, value } = e.target;
    updateConfig({
      generatorDefaults: {
        ...config.generatorDefaults,
        [name]: name === "type" ? value : parseInt(value),
      },
    });
  };

  return (
    <div className="config-container">
      <h3 className="config-title">{t("configTitle")}</h3>

      <div className="config-group">
        <h4 className="config-subtitle">{t("configTheme")}</h4>
        <div className="theme-selector">
          <button
            className={`theme-btn theme-blue ${
              config.theme === "blue" ? "active" : ""
            }`}
            onClick={() => handleThemeChange("blue")}
          >
            <div className="color-preview blue"></div>
            <span>{t("themeBlue")}</span>
          </button>
          <button
            className={`theme-btn theme-green ${
              config.theme === "green" ? "active" : ""
            }`}
            onClick={() => handleThemeChange("green")}
          >
            <div className="color-preview green"></div>
            <span>{t("themeGreen")}</span>
          </button>
          <button
            className={`theme-btn theme-red ${
              config.theme === "red" ? "active" : ""
            }`}
            onClick={() => handleThemeChange("red")}
          >
            <div className="color-preview red"></div>
            <span>{t("themeRed")}</span>
          </button>
          <button
            className={`theme-btn theme-yellow ${
              config.theme === "yellow" ? "active" : ""
            }`}
            onClick={() => handleThemeChange("yellow")}
          >
            <div className="color-preview yellow"></div>
            <span>{t("themeYellow")}</span>
          </button>
        </div>
      </div>

      <div className="config-group">
        <h4 className="config-subtitle">{t("configLanguage")}</h4>
        <select
          className="config-select"
          value={config.language}
          onChange={handleLanguageChange}
        >
          <option value="es">{t("langEs")}</option>
          <option value="en">{t("langEn")}</option>
        </select>
      </div>

      <div className="config-group">
        <h4 className="config-subtitle">{t("configGenerator")}</h4>

        <div className="config-row">
          <div className="config-item">
            <label>{t("genType")}</label>
            <select
              name="type"
              className="config-select"
              value={config.generatorDefaults.type}
              onChange={handleGeneratorChange}
            >
              <option value="qr">QR Code</option>
              <option value="barcode">Barcode</option>
            </select>
          </div>

          <div className="config-item">
            <label>{t("genSize")} (px)</label>
            <input
              type="number"
              name="textSize"
              className="config-input"
              value={config.generatorDefaults.textSize}
              onChange={handleGeneratorChange}
              min="10"
              max="30"
            />
          </div>
        </div>

        <div className="config-row">
          <div className="config-item">
            <label>{t("genWidth")} (mm)</label>
            <input
              type="number"
              name="width"
              className="config-input"
              value={config.generatorDefaults.width}
              onChange={handleGeneratorChange}
              min="20"
              max="100"
            />
          </div>

          <div className="config-item">
            <label>{t("genHeight")} (mm)</label>
            <input
              type="number"
              name="height"
              className="config-input"
              value={config.generatorDefaults.height}
              onChange={handleGeneratorChange}
              min="20"
              max="100"
            />
          </div>
        </div>
      </div>

      <div className="config-message success">
        <i className="fas fa-check-circle"></i>
        <span>{t("saveSuccess")}</span>
      </div>
    </div>
  );
};

export default Configuracion;
