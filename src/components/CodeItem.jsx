import React, { useEffect, useRef } from "react";
import QRious from "qrious";
import JsBarcode from "jsbarcode";

const CodeItem = ({ type, content, textSize, width, height, onDelete }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (type === "qr") {
      if (canvasRef.current) {
        new QRious({
          element: canvasRef.current,
          value: content,
          size: 200,
          level: "H",
        });
      }
    } else if (type === "barcode") {
      if (imgRef.current) {
        try {
          JsBarcode(imgRef.current, content, {
            format: "CODE128",
            displayValue: false,
            margin: 0,
          });
        } catch (e) {
          console.error("Error de código de barras", e);
        }
      }
    }
    // Para type === "text", no se genera ningún código
  }, [type, content]);

  return (
    <div className="codigoBox" style={{ width: `${width}px` }}>
      <button className="btn-delete" onClick={onDelete} title="Eliminar código">
        ×
      </button>

      {type === "qr" ? (
        <canvas
          ref={canvasRef}
          style={{ height: `${height}px`, width: "auto" }}
        />
      ) : type === "barcode" ? (
        <img ref={imgRef} style={{ height: `${height}px`, width: "auto" }} />
      ) : null}

      <p className="etiqueta" style={{ fontSize: `${textSize}px` }}>
        {content}
      </p>
    </div>
  );
};

export default CodeItem;
