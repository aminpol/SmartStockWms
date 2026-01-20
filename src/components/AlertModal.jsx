import React from "react";
import "./AlertModal.css";

const AlertModal = ({ type, message, extra, onClose }) => {
  return (
    <div className="alert-modal-overlay">
      <div
        className={`alert-modal-content ${
          type === "success" ? "alert-success" : "alert-error"
        }`}
      >
        <div className="alert-icon">
          {type === "success" ? (
            <i className="fas fa-check-circle icon-success"></i>
          ) : (
            <i className="fas fa-times-circle icon-error"></i>
          )}
        </div>
        <p className="alert-message">{message}</p>

        {extra && (
          <div className="alert-extra-info">
            {Object.entries(extra).map(([key, value]) => (
              <p key={key} className="alert-extra-item">
                {key}: <strong>{value}</strong>
              </p>
            ))}
          </div>
        )}

        <button className="alert-ok-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
