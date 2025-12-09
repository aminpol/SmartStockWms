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

const PrintQrPallet = ({ onBack, onLogout }) => {
  console.log("Rendering PrintQrPallet");
  // Estado para el modo de QR
  const [qrMode, setQrMode] = useState(""); // "" | "MTE_MTP" | "PLANTAS"
  const [plantasParams, setPlantasParams] = useState({
    startPallet: "",
    endPallet: "",
  });

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

  // Ref para el input
  const labelQtyRef = useRef(null);
  const itemsContainerRef = useRef(null);

  // Cargar estado desde localStorage al montar
  useEffect(() => {
    const savedState = localStorage.getItem("qrPalletState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // if (parsed.qrMode) setQrMode(parsed.qrMode); // No restaurar modo automáticamente para forzar selección
        if (parsed.plantasParams) setPlantasParams(parsed.plantasParams);
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
      qrMode,
      plantasParams,
      formData,
      qrCreated,
      labelQuantity,
      numberLabels,
      addedItems,
    };
    localStorage.setItem("qrPalletState", JSON.stringify(stateToSave));
  }, [
    qrMode,
    plantasParams,
    formData,
    qrCreated,
    labelQuantity,
    numberLabels,
    addedItems,
  ]);

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

  const handlePlantasParamChange = (e) => {
    const { name, value } = e.target;
    setPlantasParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validar campos según modo
  const validateForm = () => {
    const emptyFields = [];

    if (!formData.code.trim()) emptyFields.push("CODE");
    if (!formData.descrip.trim()) emptyFields.push("DESCRIP");
    if (!formData.batchCode.trim()) emptyFields.push("LOTE");

    if (qrMode === "MTE_MTP") {
      if (!formData.manufDate) emptyFields.push("MANUF. DATE");
      if (!formData.expiryDate) emptyFields.push("EXPIRY DATE");
      if (!formData.quantity.trim()) emptyFields.push("QUANTITY");
    } else {
      // PLANTAS mode validation
      if (!plantasParams.startPallet.trim()) emptyFields.push("PALLET INICIAL");
      if (!plantasParams.endPallet.trim()) emptyFields.push("PALLET FINAL");
    }

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

  // Manejar el "Reset"
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
    setPlantasParams({ startPallet: "", endPallet: "" });
    setQrCreated(false);
    setLabelQuantity("");
    setNumberLabels("");
    setAddedItems([]);
    localStorage.removeItem("qrPalletState");
    setTimeout(() => {
      document.getElementById("code")?.focus();
    }, 100);
  };

  // Manejador principal para "Create QR" (MTE) o "Generar Etiquetas" (PLANTAS)
  const handleCreateAction = async () => {
    const emptyFields = validateForm();

    if (emptyFields.length > 0) {
      setErrorMessage(
        `Por favor complete el siguiente campo: ${emptyFields[0]}`
      );
      setShowErrorModal(true);
      return;
    }

    if (qrMode === "MTE_MTP") {
      // Validar quantity MTE
      const quantityValue = parseFloat(formData.quantity);
      if (isNaN(quantityValue) || quantityValue <= 0) {
        setErrorMessage("QUANTITY debe ser un número válido mayor a 0");
        setShowErrorModal(true);
        return;
      }
      // Modo MTE: Habilita la segunda sección para ingresar # etiquetas
      setQrCreated(true);
      setTimeout(() => {
        labelQtyRef.current?.focus();
      }, 100);
    } else {
      // Modo PLANTAS: Generación directa
      const start = parseInt(plantasParams.startPallet, 10);
      const end = parseInt(plantasParams.endPallet, 10);

      if (isNaN(start) || isNaN(end)) {
        setErrorMessage("Los números de pallet deben ser válidos");
        setShowErrorModal(true);
        return;
      }

      if (start > end) {
        setErrorMessage("El pallet inicial no puede ser mayor al final");
        setShowErrorModal(true);
        return;
      }

      const count = end - start + 1;
      if (count > 100) {
        setErrorMessage("Demasiadas etiquetas a la vez (máx 100)");
        setShowErrorModal(true);
        return;
      }

      // Generar items directamente
      const newItems = [];
      for (let i = start; i <= end; i++) {
        // Formatear número de pallet a 2 dígitos mínimo (01, 02...)
        const palletNum = String(i).padStart(2, "0");
        const uniqueContent = `P|${formData.code}|${formData.descrip}|${formData.batchCode}|${palletNum}`;

        newItems.push({
          ...formData, // code, descrip, batchCode
          palletNum: palletNum,
          uniqueId: uniqueContent, // Usamos esto como ID/Contenido QR
          mode: "PLANTAS",
        });
      }

      setAddedItems(newItems);
      // No seteamos qrCreated=true porque en este modo generamos y mostramos "listo para imprimir"
      // o podríamos usar addedItems.length > 0 para mostrar botones de imprimir
    }
  };

  // MTE_MTP: Agregar items con lógica de resta de cantidad
  const handleAddItemMTE = async () => {
    if (isAddingItems) return;

    const currentQty = parseFloat(formData.quantity);
    const labelQty = parseFloat(labelQuantity);
    const numLabels = parseInt(numberLabels, 10);

    if (isNaN(labelQty) || labelQty <= 0) {
      setErrorMessage("Label quantity debe ser válido > 0");
      setShowErrorModal(true);
      return;
    }
    if (labelQty > currentQty) {
      setErrorMessage(
        `Cantidad (${labelQty}) mayor a disponible (${currentQty})`
      );
      setShowErrorModal(true);
      return;
    }
    if (isNaN(numLabels) || numLabels <= 0) {
      setErrorMessage("Number labels debe ser entero > 0");
      setShowErrorModal(true);
      return;
    }

    const totalToSubtract = labelQty * numLabels;
    if (totalToSubtract > currentQty) {
      setErrorMessage(
        `Insuficiente stock. Req: ${totalToSubtract}, Disp: ${currentQty}`
      );
      setShowErrorModal(true);
      return;
    }

    setIsAddingItems(true);

    try {
      // Backend call for UNIQUE IDs
      const response = await fetch(
        "https://smartstockwms-a8p6.onrender.com/api/pallets",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            numberLabels: numLabels,
            quantity: labelQty,
          }),
        }
      );

      if (!response.ok) throw new Error("Error generando etiquetas");
      const data = await response.json();
      const createdIds = data.ids;

      const newQuantity = currentQty - totalToSubtract;
      setFormData((prev) => ({ ...prev, quantity: newQuantity.toString() }));

      const newItems = createdIds.map((id) => ({
        ...formData,
        quantity: labelQty.toString(),
        uniqueId: id,
        mode: "MTE_MTP",
      }));

      setAddedItems((prev) => [...prev, ...newItems]);
      setLabelQuantity("");
      setNumberLabels("");
      labelQtyRef.current?.focus();
    } catch (error) {
      console.error(error);
      setErrorMessage("Error al conectar con servidor");
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
    window.print();
  };

  const handleVisualizar = () => {
    setShowVisualizar(true);
  };

  const handleDeleteItem = (index) => {
    const deletedItem = addedItems[index];
    // Solo devolvemos cantidad si es MTE
    if (deletedItem.mode === "MTE_MTP" || !deletedItem.mode) {
      const deletedQuantity = parseFloat(deletedItem.quantity);
      setFormData((prev) => ({
        ...prev,
        quantity: (parseFloat(prev.quantity) + deletedQuantity).toString(),
      }));
    }
    setAddedItems((prev) => prev.filter((_, i) => i !== index));
  };

  if (showVisualizar) {
    return (
      <VisualizarQr
        items={addedItems}
        onBack={() => setShowVisualizar(false)}
        onDelete={handleDeleteItem}
      />
    );
  }

  return (
    <div
      className="print-screen-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        alignItems: "center",
        flex: 1,
        minHeight: "100%",
      }}
    >
      <div
        id="printQrPallet"
        className="pallet-container"
        style={{ marginBottom: "auto" }}
      >
        <h2>Código QR Pallet</h2>

        {/* SELECTOR DE MODO */}
        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: "1.1rem", color: "#3b82f6" }}>
            Tipo de Etiqueta
          </label>
          <select
            value={qrMode}
            onChange={(e) => {
              setQrMode(e.target.value);
              setAddedItems([]); // Limpiar al cambiar modo
              setQrCreated(false);
            }}
            style={{
              width: "100%",
              padding: "0.8rem",
              borderRadius: "8px",
              border: "2px solid #3b82f6",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            <option value="" disabled>
              Seleccione una opción
            </option>
            <option value="MTE_MTP">QR MTE & MTP</option>
            <option value="PLANTAS">QR P. Terminado</option>
          </select>
        </div>

        {qrMode && (
          <div
            className={`pallet-form-section ${
              qrCreated && qrMode === "MTE_MTP" ? "disabled" : ""
            }`}
          >
            {/* CAMPOS COMUNES */}
            <div className="form-group">
              <label htmlFor="code">CODE</label>
              <div className="input-with-button">
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  disabled={qrCreated && qrMode === "MTE_MTP"}
                />
                <button
                  className="btn-search-code"
                  onClick={handleSearchCode}
                  disabled={qrCreated && qrMode === "MTE_MTP"}
                  title="Buscar código"
                >
                  <i className="fas fa-search-plus"></i>
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="descrip">DESCRIPCION</label>
              <input
                type="text"
                id="descrip"
                name="descrip"
                value={formData.descrip}
                onChange={handleInputChange}
                disabled={true}
                style={{ backgroundColor: "#f8fafc" }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="batchCode">LOTE</label>
              <input
                type="text"
                id="batchCode"
                name="batchCode"
                value={formData.batchCode}
                onChange={handleInputChange}
                disabled={qrCreated && qrMode === "MTE_MTP"}
              />
            </div>
            {/* CAMPOS ESPECÍFICOS MTE_MTP */}
            {qrMode === "MTE_MTP" && (
              <>
                <div className="form-group">
                  <label htmlFor="manufDate">MANUF. DATE</label>
                  <input
                    type="date"
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
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      disabled={qrCreated}
                    />
                  </div>
                  <div className="form-group">
                    <label>UOM</label>
                    <select
                      value={formData.udm}
                      disabled
                      style={{ backgroundColor: "#f8fafc" }}
                    >
                      <option>UND</option>
                      <option>KG</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            {/* CAMPOS ESPECÍFICOS PLANTAS */}
            {qrMode === "PLANTAS" && (
              <div
                className="form-group-row"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <div className="form-group">
                  <label>PALLET INICIAL (N°)</label>
                  <input
                    type="number"
                    name="startPallet"
                    value={plantasParams.startPallet}
                    onChange={handlePlantasParamChange}
                    placeholder="Ej: 1"
                  />
                </div>
                <div className="form-group">
                  <label>PALLET FINAL (N°)</label>
                  <input
                    type="number"
                    name="endPallet"
                    value={plantasParams.endPallet}
                    onChange={handlePlantasParamChange}
                    placeholder="Ej: 5"
                  />
                </div>
              </div>
            )}
            {/* BOTONES SUPERIORES */}
            {(!qrCreated || qrMode === "PLANTAS") && (
              <div className="top-button-row">
                <button className="btn-create-qr" onClick={handleCreateAction}>
                  <i className="fas fa-qrcode"></i>{" "}
                  {qrMode === "MTE_MTP" ? "Create QR" : "Generar Etiquetas"}
                </button>
                <button className="btn-volver-top" onClick={onBack}>
                  <i className="fas fa-arrow-left"></i> Volver
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN INFERIOR MTE_MTP (Cantidad Etiquetas) */}
        {qrCreated && qrMode === "MTE_MTP" && (
          <>
            <div className="dotted-separator"></div>
            <div className="pallet-bottom-section">
              <div className="inputs-with-reset">
                <div className="inputs-container">
                  <div className="form-group-inline">
                    <label>Label quantity</label>
                    <input
                      ref={labelQtyRef}
                      type="text"
                      value={labelQuantity}
                      onChange={(e) => setLabelQuantity(e.target.value)}
                      className="input-small"
                    />
                  </div>
                  <div className="form-group-inline">
                    <label>Number labels</label>
                    <input
                      type="text"
                      value={numberLabels}
                      onChange={(e) => setNumberLabels(e.target.value)}
                      className="input-small"
                    />
                  </div>
                </div>
                <button
                  className="btn-reset"
                  onClick={handleReset}
                  title="Reset"
                >
                  <i className="fas fa-redo"></i>
                </button>
              </div>
              <div className="pallet-buttons">
                <button
                  className="btn-agregar"
                  onClick={handleAddItemMTE}
                  disabled={isAddingItems}
                >
                  <i className="fas fa-plus"></i> Agregar
                </button>
                <button className="btn-visualizar" onClick={handleVisualizar}>
                  Visualizar
                </button>
                <button
                  className="btn-print-labels"
                  onClick={handlePrintLabels}
                >
                  <i className="fas fa-print"></i> Print labels QR
                </button>
                <button className="btn-go-back" onClick={onBack}>
                  <i className="fas fa-arrow-left"></i> Volver
                </button>
              </div>
            </div>
          </>
        )}

        {/* BOTONES INFERIORES PLANTAS (Solo imprimir/visualizar, ya generados) */}
        {qrMode === "PLANTAS" && addedItems.length > 0 && (
          <div className="pallet-bottom-section" style={{ marginTop: "1rem" }}>
            <div className="pallet-buttons-plantas">
              <button className="btn-visualizar" onClick={handleVisualizar}>
                <i className="fas fa-eye"></i> Visualizar ({addedItems.length})
              </button>
              <button className="btn-reset" onClick={handleReset} title="Reset">
                <i className="fas fa-redo"></i>
              </button>
              <button className="btn-print-labels" onClick={handlePrintLabels}>
                <i className="fas fa-print"></i> Imprimir Etiquetas
              </button>
            </div>
          </div>
        )}

        {/* Modal Error */}
        {showErrorModal && (
          <div
            className="error-modal-overlay"
            onClick={() => setShowErrorModal(false)}
          >
            <div
              className="error-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>⚠️ Atención</h3>
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
      </div>

      {/* Footer Buttons (Outside the card, at the bottom) */}
      {!qrMode && (
        <div
          className="action-buttons"
          style={{
            position: "fixed",
            bottom: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90%",
            maxWidth: "500px",
            zIndex: 100,
          }}
        >
          <button className="btn-action btn-back" onClick={onBack}>
            <i className="fas fa-arrow-left"></i>
            <span className="btn-text">Volver</span>
          </button>
          <button className="btn-action btn-logout-red" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span className="btn-text">Salir</span>
          </button>
        </div>
      )}

      {/* ÁREA DE IMPRESIÓN */}
      <div className="print-area">
        {addedItems.map((item, index) => {
          let qrContent = "";
          if (item.mode === "PLANTAS") {
            // Formato PLANTAS: P|CODIGO|DESC|LOTE|N_PAL
            qrContent = `P|${item.code}|${item.descrip}|${item.batchCode}|${item.palletNum}`;
          } else {
            // Formato MTE
            qrContent = `CODE: ${item.code}\nDESCRIP: ${item.descrip}\nBATCH: ${item.batchCode}\nQTY: ${item.quantity} ${item.udm}\nMANUF: ${item.manufDate}\nEXPIRY: ${item.expiryDate}\nUID: ${item.uniqueId}`;
          }

          return (
            <div key={index} className="print-label">
              <div className="print-qr-container">
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
                  <strong>LOTE</strong> <span>{item.batchCode}</span>
                </div>

                {item.mode === "PLANTAS" ? (
                  <div className="print-row">
                    <strong>PALLET N°</strong>{" "}
                    <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                      {item.palletNum}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="print-row">
                      <strong>QTY</strong>{" "}
                      <span>
                        {item.quantity} {item.udm}
                      </span>
                    </div>
                    <div className="print-row">
                      <strong>MANUF</strong> <span>{item.manufDate}</span>
                    </div>
                    <div className="print-row">
                      <strong>EXPIRY</strong> <span>{item.expiryDate}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrintQrPallet;
