import React from "react";
import "./VisualizarQr.css";

const VisualizarQr = ({ items, onBack, onDelete }) => {
  return (
    <div className="visualizar-container">
      <div className="visualizar-header">
        <button
          className="btn-go-back-visualizar"
          onClick={onBack}
          title="Go back"
        >
          <i className="fas fa-undo"></i>
        </button>
      </div>

      <div className="qr-list">
        {items.length === 0 ? (
          <p className="empty-list-message">No hay códigos agregados.</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="qr-item">
              <span title={item.code}>{item.code}</span>
              <span title={item.descrip}>{item.descrip}</span>
              <span title={item.batchCode}>{item.batchCode}</span>
              <span title={item.quantity}>{item.quantity}</span>
              <button
                className="btn-delete-item"
                onClick={() => onDelete(index)}
                title="Eliminar"
              >
                <i className="fas fa-times-circle"></i>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VisualizarQr;
