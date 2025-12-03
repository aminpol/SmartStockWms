import React, { useState } from "react";
import "./Usuarios.css";
import AlertModal from "./AlertModal";
import { useConfig } from "../context/ConfigContext";

const Usuarios = () => {
  const { t } = useConfig();
  const [formData, setFormData] = useState({
    documento: "",
    nombre: "",
    apellido: "",
    email: "",
    empresa_contratista: "",
    usuario: "",
    contraseña: "",
    tipo_usuario: "bodega",
  });

  const [searchDoc, setSearchDoc] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = async () => {
    if (!searchDoc.trim()) {
      setMessage({ type: "error", text: t("error") });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/usuarios/${searchDoc}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setMessage({ type: "error", text: t("consNoResults") });
        } else {
          setMessage({ type: "error", text: t("error") });
        }
        return;
      }

      const data = await response.json();
      setFormData({
        documento: data.documento,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email || "",
        empresa_contratista: data.empresa_contratista || "",
        usuario: data.usuario,
        contraseña: data.contraseña,
        tipo_usuario: data.tipo_usuario,
      });
      setIsEditing(true);
      setMessage({ type: "success", text: t("success") });
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: t("error") });
    }
  };

  const handleSave = async () => {
    // Validaciones
    if (
      !formData.documento ||
      !formData.nombre ||
      !formData.apellido ||
      !formData.usuario ||
      !formData.contraseña
    ) {
      setMessage({ type: "error", text: t("error") });
      return;
    }

    try {
      const url = isEditing
        ? `http://localhost:3000/api/usuarios/${formData.documento}`
        : "http://localhost:3000/api/usuarios";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || t("error") });
        return;
      }

      setMessage({
        type: "success",
        text: t("userMsgSaved"),
      });

      // Limpiar formulario después de guardar
      handleClear();
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: t("error") });
    }
  };

  const handleClear = () => {
    setFormData({
      documento: "",
      nombre: "",
      apellido: "",
      email: "",
      empresa_contratista: "",
      usuario: "",
      contraseña: "",
      tipo_usuario: "bodega",
    });
    setSearchDoc("");
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(t("confirmDelete"))) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/usuarios/${formData.documento}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setMessage({
          type: "error",
          text: data.error || t("error"),
        });
        return;
      }

      setMessage({ type: "success", text: t("userMsgDeleted") });
      handleClear();
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: t("error") });
    }
  };

  return (
    <div className="usuarios-container">
      <h3 className="usuarios-title">{t("userTitle")}</h3>

      <div className="usuarios-scrollable">
        {/* Sección de búsqueda */}
        <div className="usuarios-search-section">
          <label className="usuarios-label">{t("search")}</label>
          <div className="usuarios-search-row">
            <input
              type="text"
              className="usuarios-input"
              placeholder={t("userDoc")}
              value={searchDoc}
              onChange={(e) => setSearchDoc(e.target.value)}
            />
            <button
              className="usuarios-btn usuarios-btn-search"
              onClick={handleSearch}
            >
              {t("search")}
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div className="usuarios-form">
          <div className="usuarios-form-row">
            <div className="usuarios-form-group">
              <label className="usuarios-label">
                {t("userDoc")} <span className="required">*</span>
              </label>
              <input
                type="text"
                name="documento"
                className="usuarios-input"
                value={formData.documento}
                onChange={handleInputChange}
                disabled={isEditing}
              />
            </div>

            <div className="usuarios-form-group">
              <label className="usuarios-label">
                {t("userType")} <span className="required">*</span>
              </label>
              <select
                name="tipo_usuario"
                className="usuarios-select"
                value={formData.tipo_usuario}
                onChange={handleInputChange}
              >
                <option value="bodega">{t("userTypeWarehouse")}</option>
                <option value="administrador">{t("userTypeAdmin")}</option>
              </select>
            </div>
          </div>

          <div className="usuarios-form-row">
            <div className="usuarios-form-group">
              <label className="usuarios-label">
                {t("userName")} <span className="required">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                className="usuarios-input"
                value={formData.nombre}
                onChange={handleInputChange}
              />
            </div>

            <div className="usuarios-form-group">
              <label className="usuarios-label">
                {t("userLastName")} <span className="required">*</span>
              </label>
              <input
                type="text"
                name="apellido"
                className="usuarios-input"
                value={formData.apellido}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="usuarios-form-row">
            <div className="usuarios-form-group">
              <label className="usuarios-label">{t("userEmail")}</label>
              <input
                type="email"
                name="email"
                className="usuarios-input"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="usuarios-form-group">
              <label className="usuarios-label">{t("userCompany")}</label>
              <input
                type="text"
                name="empresa_contratista"
                className="usuarios-input"
                value={formData.empresa_contratista}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="usuarios-form-row">
            <div className="usuarios-form-group">
              <label className="usuarios-label">
                {t("user")} <span className="required">*</span>
              </label>
              <input
                type="text"
                name="usuario"
                className="usuarios-input"
                value={formData.usuario}
                onChange={handleInputChange}
              />
            </div>

            <div className="usuarios-form-group">
              <label className="usuarios-label">
                {t("password")} <span className="required">*</span>
              </label>
              <input
                type="text"
                name="contraseña"
                className="usuarios-input"
                value={formData.contraseña}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="usuarios-actions">
            <button
              className="usuarios-btn usuarios-btn-save"
              onClick={handleSave}
            >
              {isEditing ? t("userBtnUpdate") : t("save")}
            </button>
            <button
              className="usuarios-btn usuarios-btn-clear"
              onClick={handleClear}
            >
              {t("clear")}
            </button>
            {isEditing && (
              <button
                className="usuarios-btn usuarios-btn-delete"
                onClick={handleDelete}
                style={{ backgroundColor: "#ef4444", color: "white" }}
              >
                {t("delete")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de mensajes */}
      {message && (
        <AlertModal
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
        />
      )}
    </div>
  );
};

export default Usuarios;
