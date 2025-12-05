import React, { useState, useEffect, useRef } from "react";
import "./PrintQrPallet.css";
import VisualizarQr from "./VisualizarQr";
import QRious from "qrious";

// Componente auxiliar para renderizar el QR en el canvas
const QrCanvas = ({ value, size = 200 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      new QRious({
        element: canvasRef.current,
        value: value,
        size: size,
        level: "H",
      });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} />;
};

const PrintQrPallet = ({ onBack }) => {
  console.log("Rendering PrintQrPallet");
  // Estado para los campos del formulario superior
  const [formData, setFormData] = useState({
    code: "",
    descrip: "",
    batchCode: "",
    manufDate: "",
    expiryDate: "",
    quantity: "",
    udm: "UND",
  });

  // Estado para controlar si el QR fue creado
  const [qrCreated, setQrCreated] = useState(false);

  // Estado para los campos de la sección inferior
  const [labelQuantity, setLabelQuantity] = useState("");
  const [numberLabels, setNumberLabels] = useState("");

  // Estado para el modal de error
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Estado para la lista de items y visualización
  const [addedItems, setAddedItems] = useState([]);
  const [showVisualizar, setShowVisualizar] = useState(false);
  const [isAddingItems, setIsAddingItems] = useState(false);

  // Ref para el input de labelQuantity
  const labelQtyRef = React.useRef(null);

  // Cargar estado desde localStorage al montar
  useEffect(() => {
    const savedState = localStorage.getItem("qrPalletState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.qrCreated) setQrCreated(parsed.qrCreated);
        if (parsed.labelQuantity) setLabelQuantity(parsed.labelQuantity);
        if (parsed.numberLabels) setNumberLabels(parsed.numberLabels);
        if (parsed.addedItems) setAddedItems(parsed.addedItems);
      } catch (e) {
        console.error("Error loading saved state:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    const stateToSave = {
      formData,
      qrCreated,
      labelQuantity,
      numberLabels,
      addedItems,
    };
    localStorage.setItem("qrPalletState", JSON.stringify(stateToSave));
  }, [formData, qrCreated, labelQuantity, numberLabels, addedItems]);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Convertir a mayúsculas CODE y BATCH CODE
    if (name === "code" || name === "batchCode") {
      newValue = value.toUpperCase();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // Validar que todos los campos estén llenos
  const validateForm = () => {
    const emptyFields = [];

    if (!formData.code.trim()) emptyFields.push("CODE");
    if (!formData.descrip.trim()) emptyFields.push("DESCRIP");
    if (!formData.batchCode.trim()) emptyFields.push("BATCH CODE");
    if (!formData.manufDate) emptyFields.push("MANUF. DATE");
    if (!formData.expiryDate) emptyFields.push("EXPIRY DATE");
    if (!formData.quantity.trim()) emptyFields.push("QUANTITY");

    return emptyFields;
  };

  // Búsqueda en Base de Datos Real
  const handleSearchCode = async () => {
    if (!formData.code.trim()) {
      setErrorMessage("Por favor ingrese un código para buscar");
      setShowErrorModal(true);
      return;
    }

    try {
      // Asumiendo que el backend corre en localhost:3000
      const response = await fetch(
        `https://smartstockwms-a8p6.onrender.com/api/materials/${formData.code}`
      );

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          descrip: data.description, // Columna 'description' de la BD
          udm: data.unit, // Columna 'unit' de la BD
        }));
      } else {
        // Si no se encuentra (404) u otro error
        setErrorMessage("Código no encontrado en la base de datos");
        setShowErrorModal(true);
        // Opcional: limpiar campos si no se encuentra
        setFormData((prev) => ({
          ...prev,
          descrip: "",
          udm: "UND",
        }));
      }
    } catch (error) {
      console.error("Error fetching material:", error);
      setErrorMessage("Error de conexión con el servidor");
      setShowErrorModal(true);
    }
  };

  // Manejar la creación del QR
  const handleCreateQR = () => {
    const emptyFields = validateForm();

    if (emptyFields.length > 0) {
      setErrorMessage(
        `Por favor complete el siguiente campo: ${emptyFields[0]}`
      );
      setShowErrorModal(true);
      return;
    }

    // Validar que quantity sea un número válido
    const quantityValue = parseFloat(formData.quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) {
      setErrorMessage("QUANTITY debe ser un número válido mayor a 0");
      setShowErrorModal(true);
      return;
    }

    setQrCreated(true);
    // Enfocar el input de labelQuantity al crear el QR
    setTimeout(() => {
      labelQtyRef.current?.focus();
    }, 100);
  };

  // Función para resetear el formulario
  const handleReset = () => {
    setFormData({
      code: "",
      descrip: "",
      batchCode: "",
      manufDate: "",
      expiryDate: "",
      quantity: "",
      udm: "UND",
    });
    setQrCreated(false);
    setLabelQuantity("");
    setNumberLabels("");
    setAddedItems([]); // Limpiar la lista de items agregados
    localStorage.removeItem("qrPalletState");
    // Enfocar el primer input
    setTimeout(() => {
      document.getElementById("code")?.focus();
    }, 100);
  };

  // Manejadores para VisualizarQr
  const handleAddItem = async () => {
    // Prevenir múltiples envíos
    if (isAddingItems) return;

    const currentQty = parseFloat(formData.quantity);
    const labelQty = parseFloat(labelQuantity);
    const numLabels = parseInt(numberLabels, 10);

    // Validaciones
    if (isNaN(labelQty) || labelQty <= 0) {
      setErrorMessage("Label quantity debe ser un número válido mayor a 0");
      setShowErrorModal(true);
      return;
    }

    // Validación específica solicitada: Label Quantity > Quantity
    if (labelQty > currentQty) {
      setErrorMessage(
        `La cantidad ingresada (${labelQty}) es mayor que la cantidad disponible en QUANTITY (${currentQty})`
      );
      setShowErrorModal(true);
      return;
    }

    if (isNaN(numLabels) || numLabels <= 0) {
      setErrorMessage(
        "Number labels debe ser un número entero válido mayor a 0"
      );
      setShowErrorModal(true);
      return;
    }

    const totalToSubtract = labelQty * numLabels;

    if (totalToSubtract > currentQty) {
      setErrorMessage(
        `Cantidad insuficiente para el total de etiquetas. Necesitas ${totalToSubtract} pero solo tienes ${currentQty}`
      );
      setShowErrorModal(true);
      return;
    }

    setIsAddingItems(true);

    try {
      // Llamada al backend para generar IDs únicos
      const response = await fetch(
        "https://smartstockwms-a8p6.onrender.com/api/pallets",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            numberLabels: numLabels,
            quantity: labelQty, // Enviamos la cantidad individual de cada etiqueta
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error generando etiquetas en el servidor"
        );
      }

      const data = await response.json();
      const createdIds = data.ids;

      // Restar cantidad
      const newQuantity = currentQty - totalToSubtract;
      setFormData((prev) => ({
        ...prev,
        quantity: newQuantity.toString(),
      }));

      // Agregar items a la lista con sus IDs únicos
      const newItems = createdIds.map((id) => ({
        ...formData,
        quantity: labelQty.toString(),
        uniqueId: id, // Guardamos el ID único generado por la BD
      }));

      setAddedItems((prev) => [...prev, ...newItems]);

      // Limpiar campos y enfocar
      setLabelQuantity("");
      setNumberLabels("");
      labelQtyRef.current?.focus();
    } catch (error) {
      console.error("Error adding items:", error);
      setErrorMessage(
        error.message ||
          "Error al conectar con el servidor para generar etiquetas"
      );
      setShowErrorModal(true);
    } finally {
      setIsAddingItems(false);
    }
  };

  const handlePrintLabels = () => {
    if (addedItems.length === 0) {
      setErrorMessage("No hay etiquetas para imprimir");
      setShowErrorModal(true);
      return;
    }
    // Disparar la impresión del navegador
    window.print();

    // Opcional: Limpiar después de imprimir (puedes descomentar si lo deseas)
    // setAddedItems([]);
  };

  const handleVisualizar = () => {
    setShowVisualizar(true);
  };

  const handleBackFromVisualizar = () => {
    setShowVisualizar(false);
  };

  const handleDeleteItem = (index) => {
    // Obtener el item que se va a eliminar
    const deletedItem = addedItems[index];
    const deletedQuantity = parseFloat(deletedItem.quantity);

    // Sumar la cantidad del item eliminado de vuelta a la cantidad total
    setFormData((prev) => ({
      ...prev,
      quantity: (parseFloat(prev.quantity) + deletedQuantity).toString(),
    }));

    // Eliminar el item de la lista
    setAddedItems((prev) => prev.filter((_, i) => i !== index));
  };

  if (showVisualizar) {
    return (
      <VisualizarQr
        items={addedItems}
        onBack={handleBackFromVisualizar}
        onDelete={handleDeleteItem}
      />
    );
  }

  return (
    <div id="printQrPallet" className="pallet-container">
      <h2>Código QR Pallet</h2>

      {/* Sección Superior - Formulario */}
      <div className={`pallet-form-section ${qrCreated ? "disabled" : ""}`}>
        <div className="form-group">
          <label htmlFor="code">CODE</label>
          <div className="input-with-button">
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              disabled={qrCreated}
            />
            <button
              className="btn-search-code"
              onClick={handleSearchCode}
              disabled={qrCreated}
              title="Buscar código"
            >
              <i className="fas fa-search-plus"></i>
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="descrip">DESCRIP</label>
          <input
            type="text"
            id="descrip"
            name="descrip"
            value={formData.descrip}
            onChange={handleInputChange}
            disabled={true}
            style={{
              backgroundColor: "#f8fafc",
              color: "#000000",
              fontWeight: "500",
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="batchCode">BATCH CODE</label>
          <input
            type="text"
            id="batchCode"
            name="batchCode"
            value={formData.batchCode}
            onChange={handleInputChange}
            disabled={qrCreated}
          />
        </div>

        <div className="form-group">
          <label htmlFor="manufDate">MANUF. DATE</label>
          <input
            type="date"
            id="manufDate"
            name="manufDate"
            value={formData.manufDate}
            onChange={handleInputChange}
            disabled={qrCreated}
          />
        </div>

        <div className="form-group">
          <label htmlFor="expiryDate">EXPIRY DATE</label>
          <input
            type="date"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleInputChange}
            disabled={qrCreated}
          />
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="quantity">QUANTITY</label>
            <input
              type="text"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              disabled={qrCreated}
            />
          </div>

          <div className="form-group">
            <label htmlFor="udm">UOM</label>
            <select
              id="udm"
              name="udm"
              value={formData.udm}
              onChange={handleInputChange}
              disabled={true}
              style={{
                backgroundColor: "#f8fafc",
                color: "#000000",
                fontWeight: "500",
                cursor: "not-allowed",
              }}
            >
              <option value="UND">UND</option>
              <option value="KG">KG</option>
            </select>
          </div>
        </div>

        {/* Fila de botones superior: Create QR y Volver (solo antes de crear QR) */}
        {!qrCreated && (
          <div className="top-button-row">
            <button className="btn-create-qr" onClick={handleCreateQR}>
              <i className="fas fa-qrcode"></i> Create QR
            </button>
            <button className="btn-volver-top" onClick={onBack}>
              <i className="fas fa-arrow-left"></i> Volver
            </button>
          </div>
        )}
      </div>

      {/* Línea separadora punteada */}
      {qrCreated && <div className="dotted-separator"></div>}

      {/* Sección Inferior - Aparece después de Create QR */}
      {qrCreated && (
        <div className="pallet-bottom-section">
          <div className="inputs-with-reset">
            <div className="inputs-container">
              <div className="form-group-inline">
                <label htmlFor="labelQuantity">Label quantity</label>
                <input
                  type="text"
                  id="labelQuantity"
                  value={labelQuantity}
                  onChange={(e) => setLabelQuantity(e.target.value)}
                  className="input-small"
                  ref={labelQtyRef}
                />
              </div>

              <div className="form-group-inline">
                <label htmlFor="numberLabels">Number labels</label>
                <input
                  type="text"
                  id="numberLabels"
                  value={numberLabels}
                  onChange={(e) => setNumberLabels(e.target.value)}
                  className="input-small"
                />
              </div>
            </div>

            <button className="btn-reset" onClick={handleReset} title="Reset">
              <i className="fas fa-redo"></i>
            </button>
          </div>

          <div className="pallet-buttons">
            <button
              className="btn-agregar"
              onClick={handleAddItem}
              disabled={isAddingItems}
            >
              <i className="fas fa-plus"></i>{" "}
              {isAddingItems ? "Agregando..." : "Agregar"}
            </button>
            <button className="btn-visualizar" onClick={handleVisualizar}>
              Visualizar
            </button>
            <button className="btn-print-labels" onClick={handlePrintLabels}>
              <i className="fas fa-print"></i> Print labels QR
            </button>
            <button className="btn-go-back" onClick={onBack}>
              <i className="fas fa-arrow-left"></i> Volver
            </button>
          </div>
        </div>
      )}

      {/* Modal de Error */}
      {showErrorModal && (
        <div
          className="error-modal-overlay"
          onClick={() => setShowErrorModal(false)}
        >
          <div
            className="error-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>⚠️ Campo Requerido</h3>
            <p>{errorMessage}</p>
            <button
              className="btn-modal-ok"
              onClick={() => setShowErrorModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN DE IMPRESIÓN (Oculta en pantalla, visible al imprimir) */}
      {showErrorModal && (
        <div
          className="error-modal-overlay"
          onClick={() => setShowErrorModal(false)}
        >
          <div
            className="error-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>⚠️ Campo Requerido</h3>
            <p>{errorMessage}</p>
            <button
              className="btn-modal-ok"
              onClick={() => setShowErrorModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN DE IMPRESIÓN (Oculta en pantalla, visible al imprimir) */}
      <div className="print-area">
        {addedItems.map((item, index) => {
          // Construir el contenido del QR con toda la info + ID único
          const qrContent = `CODE: ${item.code}\nDESCRIP: ${item.descrip}\nBATCH: ${item.batchCode}\nQTY: ${item.quantity} ${item.udm}\nMANUF: ${item.manufDate}\nEXPIRY: ${item.expiryDate}\nUID: ${item.uniqueId}`;

          return (
            <div key={index} className="print-label">
              <div className="print-qr-container">
                {/* Renderizar el QR directamente usando el componente QrCanvas */}
                <QrCanvas value={qrContent} size={200} />
              </div>
              <div className="print-details">
                <div className="print-row">
                  <strong>CODE</strong> <span>{item.code}</span>
                </div>
                <div className="print-row">
                  <strong>DESCRIP</strong> <span>{item.descrip}</span>
                </div>
                <div className="print-row">
                  <strong>BATCH CODE</strong> <span>{item.batchCode}</span>
                </div>
                <div className="print-row">
                  <strong>QUANTITY</strong>{" "}
                  <span>
                    {item.quantity} {item.udm}
                  </span>
                </div>
                <div className="print-row">
                  <strong>MANUF. DATE</strong> <span>{item.manufDate}</span>
                </div>
                <div className="print-row">
                  <strong>EXPIRY DATE</strong> <span>{item.expiryDate}</span>
                </div>
                {/* El ID único NO se muestra en texto */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrintQrPallet;
