import React, { useState, useEffect } from "react";
import "./Login.css";
import AlertModal from "./AlertModal";
import barraImg from "../assets/barra.png";
import almacenImg from "../assets/alamcen.png";
import { useConfig } from "../context/ConfigContext";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useConfig();

  // Alternar entre las dos imágenes cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev === 0 ? 1 : 0));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevenir múltiples envíos
    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://smartstockwms-a8p6.onrender.com/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ usuario, contraseña }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Pasar el objeto completo del usuario
        onLogin({
          usuario: data.usuario,
          nombre: data.nombre,
          tipo_usuario: data.tipo_usuario,
        });
      } else {
        setError(data.error || t("loginError"));
        setUsuario("");
        setContraseña("");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setError("Error de conexión con el servidor");
      setIsLoading(false);
    }
  };

  const images = [
    { src: barraImg, text: "Print Codes" },
    { src: almacenImg, text: "Secure Storage" },
  ];

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Contenedor de imágenes alternadas */}
        <div className="logo-container">
          {images.map((image, index) => (
            <div
              key={index}
              className={`logo-wrapper ${
                currentImage === index ? "active" : "inactive"
              }`}
            >
              <img src={image.src} alt={image.text} className="login-logo" />
              <h2 className="logo-text">{image.text}</h2>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("user")}</label>
            <input
              type="text"
              placeholder={t("user")}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="login-input"
            />
          </div>

          <div className="form-group">
            <label>{t("password")}</label>
            <input
              type="password"
              placeholder={t("password")}
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              className="login-input"
            />
          </div>

          {error && (
            <AlertModal
              type="error"
              message={error}
              onClose={() => setError("")}
            />
          )}

          <button type="submit" className="login-button" disabled={isLoading}>
            <span className="button-text">
              {isLoading ? "Iniciando sesión..." : t("loginTitle")}
            </span>
            <span className="button-glow"></span>
          </button>
        </form>

        {/* Enlace */}
        <p className="forgot-password">
          ¿Olvidaste tu contraseña?{" "}
          <a href="#" className="recovery-link">
            Recuperar acceso
          </a>
        </p>
      </div>

      {/* Footer con copyright */}
      <footer className="login-footer">
        <p>© 2025 Amin Polanco. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
