import React, { useEffect, useRef } from "react";
import QRious from "qrious";
import JsBarcode from "jsbarcode";

const CodeItem = ({ type, content, textSize, width, height, onDelete }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!content || !type) return;

    // QR CODE
    if (type === "qr" && canvasRef.current) {
      new QRious({
        element: canvasRef.current,
        value: content,
        size: height > 0 ? height : 200, // ⬅ Usa el tamaño dinámico
        level: "H",
      });
    }

    // BARCODE
    if (type === "barcode" && imgRef.current) {
      try {
        JsBarcode(imgRef.current, content, {
          format: "CODE128",
          height: height > 0 ? height : 80,
          width: 2,
          displayValue: false,
          margin: 0,
        });
      } catch (e) {
        console.error("Error en código de barras:", e);
      }
    }
  }, [type, content, height]);

  return (
    <div
      className="codigoBox"
      style={{
        width: `${width}px`, // ⬅ Se respeta el ancho dinámico
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      <button className="btn-delete" onClick={onDelete} title="Eliminar código">
        ×
      </button>

      {/* Render dinámico */}
      {type === "qr" ? (
        <canvas
          ref={canvasRef}
          style={{
            width: `${height}px`,
            height: `${height}px`,
          }}
        />
      ) : type === "barcode" ? (
        <img
          ref={imgRef}
          style={{
            width: "100%",
            height: `${height}px`,
            objectFit: "contain",
          }}
        />
      ) : null}

      {/* Etiqueta de texto */}
      <p style={{ fontSize: `${textSize}px`, marginTop: "5px" }}>
        {content}
      </p>
    </div>
  );
};

export default CodeItem;
