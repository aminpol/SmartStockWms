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
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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
        `https://smartstockwms-a8p6.onrender.com/api/usuarios/${searchDoc}`
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
      setShowAllUsers(false);
      setMessage({ type: "success", text: t("success") });
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: t("error") });
    }
  };

  const handleLoadAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch(
        "https://smartstockwms-a8p6.onrender.com/api/usuarios"
      );

      if (!response.ok) {
        setMessage({ type: "error", text: t("error") });
        return;
      }

      const data = await response.json();
      setAllUsers(data);
      setShowAllUsers(true);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: t("error") });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEditUser = (user) => {
    setFormData({
      documento: user.documento,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email || "",
      empresa_contratista: user.empresa_contratista || "",
      usuario: user.usuario,
      contraseña: user.contraseña,
      tipo_usuario: user.tipo_usuario,
    });
    setIsEditing(true);
    setShowAllUsers(false);
  };

  const handleDeleteUser = async (documento) => {
    if (!window.confirm(t("confirmDelete"))) {
      return;
    }

    try {
      const response = await fetch(
        `https://smartstockwms-a8p6.onrender.com/api/usuarios/${documento}`,
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
      // Recargar lista de usuarios
      handleLoadAllUsers();
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: t("error") });
    }
  };

  const handleSave = async () => {
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
        ? `https://smartstockwms-a8p6.onrender.com/api/usuarios/${formData.documento}`
        : "https://smartstockwms-a8p6.onrender.com/api/usuarios";

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
        `https://smartstockwms-a8p6.onrender.com/api/usuarios/${formData.documento}`,
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
      <div className="usuarios-header">
        <h3 className="usuarios-title">{t("userTitle")}</h3>
        <button
          className="usuarios-btn usuarios-btn-viewall"
          onClick={handleLoadAllUsers}
          disabled={loadingUsers}
        >
          <i className="fas fa-users"></i>
          <span>{loadingUsers ? "Cargando..." : "Ver Todos"}</span>
        </button>
      </div>

      {/* Vista de todos los usuarios */}
      {showAllUsers && (
        <div className="usuarios-all-section">
          <div className="usuarios-all-header">
            <h4>Usuarios Activos ({allUsers.length})</h4>
            <button
              className="usuarios-btn-close"
              onClick={() => setShowAllUsers(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="usuarios-table-container">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Tipo</th>
                  <th>Usuario</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => (
                  <tr key={user.documento}>
                    <td>{user.documento}</td>
                    <td>{user.nombre}</td>
                    <td>{user.apellido}</td>
                    <td>
                      <span
                        className={`usuarios-badge ${
                          user.tipo_usuario === "administrador"
                            ? "badge-admin"
                            : "badge-bodega"
                        }`}
                      >
                        {user.tipo_usuario}
                      </span>
                    </td>
                    <td>{user.usuario}</td>
                    <td className="usuarios-table-actions">
                      <button
                        className="usuarios-action-btn btn-edit"
                        onClick={() => handleEditUser(user)}
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="usuarios-action-btn btn-delete"
                        onClick={() => handleDeleteUser(user.documento)}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formulario (oculto cuando se muestra la lista) */}
      {!showAllUsers && (
        <div className="usuarios-scrollable">
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
      )}

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
