import { useEffect } from "react";

/**
 * Componente que detecta escaneo de códigos de barras desde terminales PDA/RF
 * Los escáneres funcionan como teclados que escriben rápidamente y presionan Enter
 * Este componente debe estar en el nivel raíz de la aplicación
 */
const BarcodeScannerListener = () => {
  useEffect(() => {
    let buffer = "";
    let timeoutId = null;
    const SCAN_TIMEOUT = 100; // ms entre teclas para considerar que es escaneo
    const MIN_LENGTH = 3; // Longitud mínima del código

    const handleKeyPress = (e) => {
      // Ignorar si estamos en un textarea o si es una tecla especial
      if (
        e.target.tagName === "TEXTAREA" ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey
      ) {
        return;
      }

      // Si es Enter y hay algo en el buffer
      if (e.key === "Enter") {
        if (buffer.length >= MIN_LENGTH) {
          e.preventDefault();

          // Encontrar el input que tiene el foco o el primer input visible
          const activeElement = document.activeElement;
          let targetInput = null;

          if (
            activeElement &&
            activeElement.tagName === "INPUT" &&
            activeElement.type === "text"
          ) {
            targetInput = activeElement;
          } else {
            // Buscar el primer input de texto visible
            const inputs = document.querySelectorAll(
              'input[type="text"]:not([disabled])'
            );
            for (const input of inputs) {
              const rect = input.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                targetInput = input;
                break;
              }
            }
          }

          if (targetInput) {
            // Establecer el valor del input
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value"
            ).set;
            nativeInputValueSetter.call(
              targetInput,
              buffer.trim().toUpperCase()
            );

            // Disparar eventos para que React detecte el cambio
            const inputEvent = new Event("input", { bubbles: true });
            targetInput.dispatchEvent(inputEvent);

            // Disparar Enter para activar búsqueda si existe el handler
            const enterEvent = new KeyboardEvent("keydown", {
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              which: 13,
              bubbles: true,
            });
            targetInput.dispatchEvent(enterEvent);

            // Enfocar el input
            targetInput.focus();
          }

          buffer = "";
        }
        return;
      }

      // Si es una tecla de carácter, agregar al buffer
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer += e.key;

        // Limpiar el buffer después del timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          buffer = "";
        }, SCAN_TIMEOUT);
      }
    };

    // Escuchar eventos a nivel de documento
    document.addEventListener("keypress", handleKeyPress, true);

    return () => {
      document.removeEventListener("keypress", handleKeyPress, true);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return null; // Este componente no renderiza nada
};

export default BarcodeScannerListener;
