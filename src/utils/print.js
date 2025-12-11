export const printCodes = (codes, settings) => {
  console.log("=== INICIANDO IMPRESIÓN DE CÓDIGOS ===");
  console.log("Códigos a imprimir:", codes.length);
  console.log("Settings:", settings);

  const visibleCodes = Array.from(
    document.querySelectorAll("#previewArea .codigoBox")
  );

  console.log("Códigos encontrados en DOM:", visibleCodes.length);

  if (visibleCodes.length === 0) {
    console.error("No se encontraron códigos en #previewArea .codigoBox");
    alert("No hay códigos para imprimir");
    return;
  }

  console.log("Procesando códigos para impresión...");

  // Crear contenedor temporal para armar las páginas
  const printContainer = document.createElement("div");
  const codigosPorPagina = 4;

  for (let i = 0; i < visibleCodes.length; i += codigosPorPagina) {
    const pagina = document.createElement("div");
    pagina.className = "print-page";
    const grupo = visibleCodes.slice(i, i + codigosPorPagina);

    // Si la página no está llena (menos de 4 códigos), añadir clase especial
    if (grupo.length < 4) {
      pagina.classList.add("partial-page");
    }

    grupo.forEach((codigoOriginal) => {
      console.log("Clonando código:", codigoOriginal);
      
      // Clonar código
      const clon = codigoOriginal.cloneNode(true);
      
      // Eliminar botón de borrado
      const btnDelete = clon.querySelector(".btn-delete");
      if (btnDelete) btnDelete.remove();
      
      // Convertir canvas a imagen para QR
      const canvas = clon.querySelector("canvas");
      console.log("Canvas encontrado:", canvas);
      if (canvas) {
        try {
          console.log("Intentando convertir canvas a imagen...");
          const dataUrl = canvas.toDataURL("image/png");
          console.log("DataUrl generado, longitud:", dataUrl.length);
          const img = document.createElement("img");
          img.src = dataUrl;
          img.style.height = canvas.style.height || "auto";
          img.style.width = canvas.style.width || "auto";
          canvas.replaceWith(img);
          console.log("Canvas convertido a imagen para impresión");
        } catch (e) {
          console.error("Error al convertir canvas a imagen:", e);
        }
      }
      
      pagina.appendChild(clon);
    });

    printContainer.appendChild(pagina);
  }

  console.log("Creando iframe para impresión...");

  // Crear iframe oculto
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
<title>Impresión de códigos</title>
<style>
@media print {
  @page {
    size: 3.8in 7.06in; /* Tamaño exacto de etiqueta Zebra */
    margin: 0;
  }
  body { 
    margin: 0; 
    padding: 0; 
  }
  .print-page {
    width: 3.8in;
    height: 7.06in;
    display: grid;
    grid-template-rows: repeat(4, 1fr); /* 4 códigos por etiqueta */
    align-items: center;
    justify-items: center;
    page-break-after: always;
    overflow: hidden;
    box-sizing: border-box;
    padding: 0.1in; /* Margen interno pequeño */
  }

  .print-page:last-child { 
    page-break-after: avoid; 
  }
  
  .codigoBox { 
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: none;
    padding: 1px 0;
    margin: 0;
    overflow: hidden;
  }
  
  .codigoBox svg, .codigoBox img { 
    display: block !important; 
    max-width: 85% !important; 
    max-height: 1.2in !important; /* Ajustado para 4 códigos */
    width: auto !important;
    height: auto !important;
    object-fit: contain !important;
    visibility: visible !important;
  }
  
  .etiqueta { 
    width: 100%; 
    text-align: center; 
    word-wrap: break-word; 
    margin-top: 1px; 
    font-size: 8px !important; /* Texto más pequeño */
    line-height: 1.0;
  }
}
</style>
</head>
<body>${printContainer.innerHTML}</body>
</html>`);
  doc.close();

  console.log("Iniciando impresión...");

  // Imprimir después de un breve retardo
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Limpiar iframe
    setTimeout(() => {
      document.body.removeChild(iframe);
      console.log("Impresión completada");
    }, 500);
  }, 500);
};
