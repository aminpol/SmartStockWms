import React, { useState, useEffect } from "react";
import "./PalletsRecibidos.css";
import AlertModal from "./AlertModal";
import API_URL from "../apiConfig";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PalletsRecibidos = ({
  onBack,
  onLogout,
  isEmbedded = false,
  refreshTrigger,
  filtroUbicacion = null, // Nuevo prop para filtrar por ubicación específica
}) => {
  const [recibos, setRecibos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroPlanta, setFiltroPlanta] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [filtroLote, setFiltroLote] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    fetchRecibos();
  }, [refreshTrigger, filtroUbicacion]); // Reload cuando cambian refreshTrigger o filtroUbicacion

  const obtenerTurnoActual = () => {
    const ahora = new Date();
    const hora = ahora.getHours();

    if (hora >= 0 && hora < 8) {
      return 1; // Turno 1: 12:00 AM - 7:59 AM
    } else if (hora >= 8 && hora < 16) {
      return 2; // Turno 2: 8:00 AM - 3:59 PM
    } else {
      return 3; // Turno 3: 4:00 PM - 11:59 PM
    }
  };

  const fetchRecibos = async () => {
    setLoading(true);
    try {
      console.log("Intentando obtener pallets de GROUND...");

      // Siempre obtener pallets de la tabla pallets_ground
      const response = await fetch(`${API_URL}/api/pallets-ground`);

      if (response.ok) {
        const data = await response.json();
        setRecibos(data);

        // Establecer filtros por defecto si no hay búsqueda activa
        if (!searchActive) {
          // Bogotá es UTC-5. Usamos -5h respecto a UTC para consistencia total.
          const nowUtc = new Date();
          const bogotaTime = new Date(nowUtc.getTime() - 5 * 60 * 60 * 1000);
          const hoy = bogotaTime.toISOString().split("T")[0];

          const turnoActual = obtenerTurnoActual();

          setFiltroFecha(hoy);
          setFiltroTurno(turnoActual.toString());
          setSearchActive(true);
        }
      } else {
        console.error(
          "Error fetching pallets GROUND - Status:",
          response.status,
        );
        const errorText = await response.text();
        console.error("Error text:", errorText);
      }
    } catch (error) {
      console.error("Error conectando con servidor:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Activar el filtrado cuando se presiona el botón de búsqueda
    setSearchActive(true);

    // Verificar si hay resultados después de filtrar
    const resultados = getFilteredData();

    if (resultados.length === 0) {
      setAlertMessage({
        type: "error",
        text: "No se encontraron registros con los filtros aplicados",
      });
    }
  };

  const getFilteredData = () => {
    return recibos
      .filter((r) => {
        const coincideCodigo =
          !filtro.trim() ||
          r.codigo?.toLowerCase().includes(filtro.toLowerCase());

        // Extraer la parte de la fecha (YYYY-MM-DD) de forma directa del string
        // El servidor ya guarda la fecha en formato local de Bogotá (YYYY-MM-DD HH:mm:ss)
        let fechaRegistro = "";
        if (r.fecha) {
          // Tomamos la parte antes del espacio o la 'T'
          fechaRegistro = r.fecha.split(/[T ]/)[0];
        }

        const coincideFecha =
          !filtroFecha.trim() || fechaRegistro === filtroFecha;

        const coincidePlanta =
          !filtroPlanta.trim() ||
          r.planta?.toLowerCase() === filtroPlanta.toLowerCase();

        const coincideTurno =
          !filtroTurno || r.turno?.toString() === filtroTurno;

        const coincideLote =
          !filtroLote.trim() ||
          r.lote?.toLowerCase().includes(filtroLote.toLowerCase());

        return (
          coincideCodigo &&
          coincideFecha &&
          coincidePlanta &&
          coincideTurno &&
          coincideLote
        );
      })
      .sort((a, b) => {
        // Ordenar por número de pallet ascendente
        const numA = parseInt(a.numero_pallet) || 0;
        const numB = parseInt(b.numero_pallet) || 0;
        return numA - numB;
      });
  };

  const handleClearFilter = () => {
    setFiltro("");
    setFiltroFecha("");
    setFiltroPlanta("");
    setFiltroTurno("");
    setFiltroLote("");
    setSearchActive(false);
  };

  const exportToExcel = async () => {
    const data = getFilteredData();

    if (data.length === 0) {
      setAlertMessage({
        type: "error",
        text: "No hay datos para exportar con los filtros seleccionados",
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Pallets Recibidos");

    // Configuración de metadatos en las primeras filas
    worksheet.mergeCells("A1:G1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "REPORTE DE PALLETS RECIBIDOS EN PLANTA";
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.getRow(2).values = [
      "PLANTA:",
      filtroPlanta || "TODAS",
      "TURNO:",
      filtroTurno || "TODOS",
      "FECHA:",
      filtroFecha || "HOY",
    ];
    worksheet.getRow(2).font = { bold: true };

    // Encabezado de la tabla (Fila 4)
    const headerRow = worksheet.getRow(4);
    headerRow.values = [
      "ITEM",
      "CODIGO",
      "DESCRIPCION",
      "LOTE",
      "N° PALL",
      "KG",
      "USUARIO",
    ];
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3B82F6" }, // Azul similar al UI
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center" };
    });

    // Datos (Lista plana, no agrupada)
    data.forEach((item, index) => {
      const dataRow = worksheet.getRow(5 + index);
      dataRow.values = [
        index + 1,
        item.codigo,
        item.descripcion,
        item.lote,
        item.numero_pallet,
        item.kg || 0,
        item.usuario,
      ];
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Ajustar ancho de columnas
    worksheet.columns = [
      { width: 8 }, // ITEM
      { width: 15 }, // CODIGO
      { width: 40 }, // DESCRIPCION
      { width: 20 }, // LOTE
      { width: 12 }, // N° PALL
      { width: 10 }, // KG
      { width: 20 }, // USUARIO
    ];

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Pallets_${filtroPlanta || "General"}_${filtroFecha || "Hoy"}_T${filtroTurno || "X"}.xlsx`;
    saveAs(new Blob([buffer]), fileName);
  };

  const exportToPDF = () => {
    const data = getFilteredData();

    if (data.length === 0) {
      setAlertMessage({
        type: "error",
        text: "No hay datos para exportar con los filtros seleccionados",
      });
      return;
    }

    const doc = new jsPDF();
    const logoBase64 =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wgARCAKCA8QDASIAAhEBAxEB/8QAHAAAAQUBAQEAAAAAAAAAAAAAAQIDBAUGAAcI/8QAGQEBAQEBAQEAAAAAAAAAAAAAAAECAwQF/9oADAMBAAMAYpIAAAf7P7v7S7u6B7u6B7v6O7m6O7u6B0D3d0AAHQPd0D3QPdB0D3R0D3QdIAnpIAb6S7E6S7E6S7A6S7A6S7A6S7A6S7A6S7A6S6A6S6AA7p6S7idS6B6m7A909A6S6A9JdAdS7idIAnQPQAAdQ9QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdA9AAHQAAdA9AAB0AAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAAHQAA6AAHQAA6AAdA/u6AAdAd3dA9AAdA+p6A6S6A6S6A6S6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv6AAAAAAAAAAAAAAAAAAAkAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8Qf//Z";

    // Header info
    const addHeader = (doc) => {
      // Logo
      try {
        doc.addImage(logoBase64, "JPEG", 14, 10, 50, 15);
      } catch (e) {
        console.error("Error adding logo:", e);
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        "PLANILLA DE CONTROL DE PRODUCTO TERMINADO TRASLADADO A BODEGA",
        105,
        25,
        { align: "center" },
      );

      // Metadatos Grid Header
      doc.setFontSize(8);
      doc.text(
        `FECHA: ${filtroFecha || new Date().toISOString().split("T")[0]}`,
        14,
        32,
      );
      doc.text(`OPERARIO: ${recibos[0]?.usuario || ""}`, 80, 32);
      doc.text(`TURNO: ${filtroTurno || ""}`, 150, 32);

      doc.text(`CÓDIGO: ${filtro || data[0]?.codigo || ""}`, 14, 38);
      doc.text(`LOTE: ${filtroLote || data[0]?.lote || ""}`, 80, 38);
      doc.text(`CANTIDAD DE PALLETS: ${data.length}`, 150, 38);

      // Línea divisoria
      doc.setLineWidth(0.5);
      doc.line(14, 42, 196, 42);
    };

    const tableColumn = ["# DE PALLET", "KG", "USUARIO"];

    // Agrupar por Lote
    const groupedByLote = data.reduce((acc, curr) => {
      if (!acc[curr.lote]) acc[curr.lote] = [];
      acc[curr.lote].push(curr);
      return acc;
    }, {});

    const lotes = Object.keys(groupedByLote);

    // Coordenadas para el grid 2x2
    // Secciones: 0(izq-arriba), 1(der-arriba), 2(izq-abajo), 3(der-abajo)
    const sections = [
      { x: 14, y: 45, w: 90 },
      { x: 106, y: 45, w: 90 },
      { x: 14, y: 160, w: 90 }, // Ajustado para que quepan 20 filas por cuadro aprox
      { x: 106, y: 160, w: 90 },
    ];

    addHeader(doc);

    let currentSection = 0;

    lotes.forEach((lote, loteIdx) => {
      const items = groupedByLote[lote];
      const rows = items.map((item) => [
        item.numero_pallet,
        item.kg || 0,
        item.usuario,
      ]);

      // Si cambiamos de lote, intentamos ir a la siguiente sección si la actual tiene muchos datos
      // Pero el requerimiento dice "separar en otros cuadros aparte esos pallets"

      // Dividir los items del lote en bloques de 20 para que quepan en las secciones
      const chunkSize = 20;
      for (let i = 0; i < rows.length; i += chunkSize) {
        if (currentSection >= 4) {
          doc.addPage();
          addHeader(doc);
          currentSection = 0;
        }

        const chunk = rows.slice(i, i + chunkSize);
        const section = sections[currentSection];

        // Título del lote dentro del cuadro si es el inicio de un lote o continuación
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(
          `LOTE: ${lote} ${i > 0 ? "(cont.)" : ""}`,
          section.x,
          section.y - 1,
        );

        autoTable(doc, {
          head: [tableColumn],
          body: chunk,
          startY: section.y,
          margin: { left: section.x, right: 210 - (section.x + section.w) },
          tableWidth: section.w,
          theme: "grid",
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            fontSize: 7,
            halign: "center",
          },
          styles: {
            fontSize: 7,
            cellPadding: 1,
            halign: "center",
          },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 20 },
            2: { cellWidth: "auto" },
          },
          didDrawPage: (data) => {
            // No queremos que autotable cree páginas automáticamente aquí
          },
        });

        currentSection++;
      }
    });

    const fileName = `Pallets_${filtroPlanta || "General"}_${filtroFecha || "Hoy"}_T${filtroTurno || "X"}.pdf`;
    doc.save(fileName);
  };

  const handleDelete = async (id, numeroPallet) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar el pallet N° ${numeroPallet}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/pallets-ground/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAlertMessage({
          type: "success",
          text: "Pallet eliminado correctamente",
        });
        fetchRecibos(); // Recargar la lista
      } else {
        const errorData = await response.json();
        setAlertMessage({
          type: "error",
          text: errorData.error || "Error al eliminar el pallet",
        });
      }
    } catch (error) {
      console.error("Error eliminando pallet:", error);
      setAlertMessage({
        type: "error",
        text: "Error de conexión al intentar eliminar",
      });
    }
  };

  // Obtener lotes únicos basados en los OTROS filtros activos (Context-aware)
  const getContextualLots = () => {
    return [
      ...new Set(
        recibos
          .filter((r) => {
            // Filtrar por todo EXCEPTO por el mismo filtro de lote para ver opciones disponibles
            let fechaRegistro = r.fecha ? r.fecha.split(/[T ]/)[0] : "";
            const coincideFecha =
              !filtroFecha.trim() || fechaRegistro === filtroFecha;
            const coincidePlanta =
              !filtroPlanta.trim() ||
              r.planta?.toLowerCase() === filtroPlanta.toLowerCase();
            const coincideTurno =
              !filtroTurno || r.turno?.toString() === filtroTurno;
            return coincideFecha && coincidePlanta && coincideTurno;
          })
          .map((r) => r.lote)
          .filter(Boolean),
      ),
    ].sort();
  };

  const filteredRecibos = searchActive ? getFilteredData() : recibos;

  return (
    <div className={`pallets-recibidos-screen ${isEmbedded ? "embedded" : ""}`}>
      <div
        className={`main-container ${isEmbedded ? "embedded-container" : ""}`}
      >
        {!isEmbedded && (
          <h2 className="page-title" style={{ fontSize: "1.5rem" }}>
            Pallets Recibidos
          </h2>
        )}
        {isEmbedded && (
          <h3
            className="page-title"
            style={{ marginTop: 0, fontSize: "1.1rem" }}
          >
            Historial de Recibos
          </h3>
        )}

        <div className="search-section">
          <div className="search-row responsive-grid">
            {/* Codigo */}
            <div className="search-input-group">
              <div className="search-label-row">
                <label className="search-label">
                  <span className="label-prefix">Filtrar </span>codigo
                </label>
                <div className="search-actions">
                  <button
                    className="btn-search-icon"
                    onClick={handleSearch}
                    title="Buscar"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                  {searchActive && (
                    <button
                      className="btn-clear-icon-small"
                      onClick={handleClearFilter}
                      title="Limpiar"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                  {/* Boton Excel SOLO para Movil aquí */}
                  <button
                    className="btn-excel-icon show-only-mobile"
                    onClick={exportToExcel}
                    title="Exportar a Excel"
                  >
                    <i className="fas fa-file-excel"></i>
                  </button>
                  {/* Boton PDF SOLO para Movil aquí */}
                  <button
                    className="btn-pdf-icon show-only-mobile"
                    onClick={exportToPDF}
                    title="Exportar a PDF"
                  >
                    <i className="fas fa-file-pdf"></i>
                  </button>
                </div>
              </div>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Codigo"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
            </div>

            {/* Fecha */}
            <div className="search-input-group">
              <label className="search-label">
                <span className="label-prefix">Filtrar </span>fecha
              </label>
              <div className="search-input-wrapper">
                <input
                  type="date"
                  className="search-input"
                  value={filtroFecha}
                  onChange={(e) => {
                    setFiltroFecha(e.target.value);
                    setFiltroTurno("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
            </div>

            {/* Planta */}
            <div className="search-input-group">
              <label className="search-label">
                <span className="label-prefix">Filtrar </span>planta
              </label>
              <div className="search-input-wrapper">
                <select
                  className="search-input"
                  value={filtroPlanta}
                  onChange={(e) => setFiltroPlanta(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="UPF-22">UPF-22</option>
                  <option value="UPF-30">UPF-30</option>
                </select>
              </div>
            </div>

            {/* Turno */}
            <div className="search-input-group">
              <div className="search-label-row">
                <label className="search-label">
                  <span className="label-prefix">Filtrar </span>turno
                </label>
                <div className="search-actions show-only-pc">
                  <button
                    className="btn-excel-icon"
                    onClick={exportToExcel}
                    title="Exportar a Excel"
                  >
                    <i className="fas fa-file-excel"></i>
                  </button>
                  <button
                    className="btn-pdf-icon"
                    onClick={exportToPDF}
                    title="Exportar a PDF"
                  >
                    <i className="fas fa-file-pdf"></i>
                  </button>
                </div>
              </div>
              <div className="search-input-wrapper">
                <select
                  className="search-input"
                  value={filtroTurno}
                  onChange={(e) => setFiltroTurno(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="1">Turno 1</option>
                  <option value="2">Turno 2</option>
                  <option value="3">Turno 3</option>
                </select>
              </div>
            </div>
          </div>{" "}
          {/* Mostrar turno actual en modo móvil */}
          {window.innerWidth < 1024 && (
            <div
              style={{
                textAlign: "center",
                fontSize: "0.8rem",
                color: "#666",
                margin: "0",
                padding: "0",
                lineHeight: "1",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Turno {obtenerTurnoActual()} Actual - Registros:{" "}
              {filteredRecibos.length}
            </div>
          )}
        </div>

        <div className="table-container">
          <table className="pallets-table">
            <thead>
              <tr>
                <th className="col-codigo">CODIGO</th>
                <th className="col-descripcion">DESCRIPCION</th>
                <th className="excel-th-filter col-lote">
                  <div className="excel-header-content">
                    <span>LOTE</span>
                    <div className="filter-icon-wrapper">
                      <i
                        className={`fas fa-filter ${
                          filtroLote ? "active-filter" : ""
                        }`}
                      ></i>
                      <select
                        className="invisible-header-select"
                        value={filtroLote}
                        onChange={(e) => {
                          setFiltroLote(e.target.value);
                          setSearchActive(true);
                        }}
                        title="Filtrar por lote"
                      >
                        <option value="">(Todos)</option>
                        {getContextualLots().map((lot) => (
                          <option key={lot} value={lot}>
                            {lot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </th>
                <th className="col-npall">N° PALL</th>
                <th className="col-kg">KG</th>
                {searchActive && (
                  <th className="col-usuario">
                    <i className="fas fa-user" title="USUARIO"></i>
                  </th>
                )}
                <th className="col-acciones">ACC.</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={searchActive ? 7 : 6}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    Cargando...
                  </td>
                </tr>
              ) : filteredRecibos.length > 0 ? (
                filteredRecibos.map((item) => (
                  <tr key={item.id}>
                    <td className="col-codigo">{item.codigo}</td>
                    <td className="col-descripcion">{item.descripcion}</td>
                    <td className="col-lote">{item.lote}</td>
                    <td className="col-npall">{item.numero_pallet}</td>
                    <td className="col-kg" style={{ fontWeight: "700" }}>
                      {item.kg || 0}
                    </td>
                    {searchActive && (
                      <td
                        className="col-usuario"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {item.usuario}
                      </td>
                    )}
                    <td className="actions-cell col-acciones">
                      <button
                        className="btn-delete-pallet"
                        onClick={() =>
                          handleDelete(item.id, item.numero_pallet)
                        }
                        title="Eliminar Pallet"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={searchActive ? 7 : 6}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    No hay registros encontrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isEmbedded && (
          <div className="footer-buttons">
            <button className="btn-action btn-back-blue" onClick={onBack}>
              <i className="fas fa-arrow-left"></i>
              <span className="btn-text">Volver</span>
            </button>
            <button className="btn-action btn-logout-footer" onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span className="btn-text">Cerrar sesión</span>
            </button>
          </div>
        )}

        {/* Modal de alerta */}
        {alertMessage && (
          <AlertModal
            type={alertMessage.type}
            message={alertMessage.text}
            onClose={() => setAlertMessage(null)}
          />
        )}
      </div>
    </div>
  );
};

export default PalletsRecibidos;
