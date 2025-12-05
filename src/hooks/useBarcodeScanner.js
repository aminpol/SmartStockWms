import { useEffect, useRef } from "react";

/**
 * Hook personalizado para detectar escaneo de códigos de barras
 * Los escáneres PDA/RF funcionan como teclados que escriben rápidamente y presionan Enter
 *
 * @param {Function} onScan - Callback que se ejecuta cuando se detecta un escaneo
 * @param {Object} options - Opciones de configuración
 * @param {number} options.minLength - Longitud mínima del código (default: 3)
 * @param {number} options.timeout - Tiempo máximo entre teclas en ms (default: 50)
 * @param {boolean} options.enabled - Si el scanner está habilitado (default: true)
 */
export const useBarcodeScanner = (onScan, options = {}) => {
  const { minLength = 3, timeout = 50, enabled = true } = options;

  const buffer = useRef("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e) => {
      // Ignorar si el usuario está escribiendo en un textarea
      if (e.target.tagName === "TEXTAREA") {
        return;
      }

      // Si es Enter y hay algo en el buffer
      if (e.key === "Enter" && buffer.current.length >= minLength) {
        e.preventDefault();
        const scannedCode = buffer.current.trim();
        buffer.current = "";

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Llamar al callback con el código escaneado
        onScan(scannedCode);
        return;
      }

      // Si no es Enter, agregar al buffer
      if (e.key.length === 1) {
        buffer.current += e.key;

        // Limpiar el buffer después del timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          buffer.current = "";
        }, timeout);
      }
    };

    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onScan, minLength, timeout, enabled]);
};

export default useBarcodeScanner;
