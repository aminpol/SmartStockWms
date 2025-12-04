import React, { useState, useEffect } from "react";
import "./EditarCrearProd.css";
import "./Usuarios.css"; // Importar estilos de Usuarios
import AlertModal from "./AlertModal";
import { useConfig } from "../context/ConfigContext";

const EditarCrearProd = ({ onBack, user }) => {
  const { t } = useConfig();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchCode, setSearchCode] = useState("");

  // Buscar producto para editar
  const handleSearch = async () => {
    if (!searchCode.trim()) {
      setErrorMsg(t("error"));
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://smartstockwms-a8p6.onrender.com/api/materiales/${searchCode.trim()}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setErrorMsg(t("consNoResults"));
        } else {
          throw new Error("Error al buscar producto");
        }
        return;
      }

      const product = await response.json();
      setCode(product.id_code);
      setDescription(product.description);
      setUnit(product.unit || "KG");
      setType(product.type || "MTE");
      setIsEditing(true);
      setErrorMsg(null);
    } catch (error) {
      console.error("Error buscando producto:", error);
      setErrorMsg(t("error"));
    } finally {
      setLoading(false);
    }
  };

  // Guardar o actualizar producto
  const handleSave = async () => {
    if (!code.trim() || !description.trim()) {
      setErrorMsg(t("error"));
      return;
    }

    try {
      setLoading(true);
      const url = isEditing
        ? `https://smartstockwms-a8p6.onrender.com/api/materiales/${code.trim()}`
        : `https://smartstockwms-a8p6.onrender.com/api/materiales`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_code: code.trim(),
          description: description.trim(),
          unit: unit,
          type: type,
          user: user || "Usuario Desconocido",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al guardar producto");
      }

      const data = await response.json();
      setSuccessMsg({
        text: t("prodMsgSaved"),
        product: data,
      });

      // Limpiar campos si es creación
      if (!isEditing) {
        setCode("");
        setDescription("");
        setUnit("KG");
        setType("MTE");
      }
    } catch (error) {
      console.error("Error guardando producto:", error);
      setErrorMsg(error.message || t("error"));
    } finally {
      setLoading(false);
    }
  };

  // Limpiar formulario
  const handleClear = () => {
    setCode("");
    setDescription("");
    setUnit("KG");
    setType("MTE");
    setSearchCode("");
    setIsEditing(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Modo creación
  const handleCreateNew = () => {
    handleClear();
    setSearchCode("");
    setIsEditing(false);
  };

  return (
    <div className="editarprod-container">
      <div className="editarprod-top">
        <h2 className="editarprod-title">{t("prodTitle")}</h2>
      </div>

      {/* Búsqueda para editar */}
      <div className="editarprod-search-section">
        <label className="editarprod-label">{t("prodSearch")}</label>
        <div className="editarprod-search-row">
          <input
            type="text"
            className="editarprod-input"
            placeholder={t("prodCode")}
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            className="editarprod-search-btn"
            onClick={handleSearch}
            disabled={loading}
          >
            <i className="fas fa-search"></i>
            <span>{t("search")}</span>
          </button>
        </div>
      </div>

      {/* Formulario de creación/edición */}
      <div className="editarprod-form-section">
        <div className="editarprod-form-header">
          <h3>{isEditing ? t("edit") : t("prodNew")}</h3>
          {!isEditing && (
            <button className="editarprod-new-btn" onClick={handleCreateNew}>
              <i className="fas fa-plus"></i>
              <span>{t("prodNew")}</span>
            </button>
          )}
        </div>

        <div className="editarprod-form">
          <div className="editarprod-row">
            <label className="editarprod-label">{t("prodCode")}</label>
            <input
              type="text"
              className="editarprod-input"
              placeholder={t("prodCode")}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={isEditing}
            />
          </div>

          <div className="editarprod-row">
            <label className="editarprod-label">{t("prodDesc")}</label>
            <input
              type="text"
              className="editarprod-input"
              placeholder={t("prodDesc")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Unidad y Tipo en la misma fila */}
          <div className="editarprod-row-row">
            <div className="editarprod-col">
              <label className="editarprod-label">{t("prodUnit")}</label>
              <select
                className="editarprod-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="" disabled selected>
                  Elija una opcion
                </option>
                <option value="KG">KG</option>
                <option value="ST">ST</option>
              </select>
            </div>

            <div className="editarprod-col">
              <label className="editarprod-label">{t("prodType")}</label>
              <select
                className="editarprod-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="" disabled selected>
                  Elija una opcion
                </option>
                <option value="MTE">MTE</option>
                <option value="MTP">MTP</option>
              </select>
            </div>
          </div>

          <div className="editarprod-actions-row">
            <button
              className="usuarios-btn usuarios-btn-save"
              onClick={handleSave}
              disabled={loading}
            >
              <i className="fas fa-save"></i>
              <span>{loading ? t("loading") : t("save")}</span>
            </button>
            <button
              className="usuarios-btn usuarios-btn-clear"
              onClick={handleClear}
            >
              <i className="fas fa-eraser"></i>
              <span>{t("clear")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de éxito */}
      {successMsg && (
        <AlertModal
          message={successMsg.text}
          onClose={() => setSuccessMsg(null)}
        />
      )}

      {/* Modal de error */}
      {errorMsg && (
        <AlertModal message={errorMsg} onClose={() => setErrorMsg(null)} />
      )}
    </div>
  );
};

export default EditarCrearProd;
