export const printCodes = (codes, settings) => {
  console.log("=== INICIANDO IMPRESIÓN DE CÓDIGOS ===");
  console.log("Códigos a imprimir:", codes.length);
  console.log("Settings:", settings);
  console.log("Dispositivo móvil:", /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

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
      const originalCanvas = codigoOriginal.querySelector("canvas");
      const clonedCanvas = clon.querySelector("canvas");
      
      console.log("Canvas original:", originalCanvas);
      console.log("Canvas clonado:", clonedCanvas);
      
      if (originalCanvas && clonedCanvas) {
        try {
          console.log("Intentando convertir canvas a imagen...");
          const dataUrl = originalCanvas.toDataURL("image/png");
          console.log("DataUrl generado, longitud:", dataUrl.length);
          const img = document.createElement("img");
          img.src = dataUrl;
          img.style.height = originalCanvas.style.height || "auto";
          img.style.width = originalCanvas.style.width || "auto";
          clonedCanvas.replaceWith(img);
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
  
  // Detectar si es móvil para ajustar el CSS
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Impresión de códigos</title>
<style>
@media print {
  @page {
    size: ${isMobile ? 'A4' : '3.8in 7.06in'};
    margin: ${isMobile ? '1cm' : '0'};
  }
  body { 
    margin: 0; 
    padding: 0; 
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-page {
    width: ${isMobile ? '100%' : '3.8in'};
    height: ${isMobile ? 'auto' : '7.06in'};
    display: grid;
    grid-template-rows: repeat(4, 1fr);
    align-items: center;
    justify-items: center;
    page-break-after: always;
    overflow: hidden;
    box-sizing: border-box;
    padding: ${isMobile ? '10px' : '0.1in'};
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
    max-width: ${isMobile ? '90%' : '85%'} !important; 
    max-height: ${isMobile ? '25mm' : '1.2in'} !important;
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
    font-size: ${isMobile ? '10px' : '8px'} !important;
    line-height: 1.0;
  }
}

/* Estilos para vista previa en pantalla */
@media screen {
  body {
    font-family: Arial, sans-serif;
    background: white;
    padding: 20px;
  }
  .print-page {
    border: 1px solid #ccc;
    margin-bottom: 20px;
    background: white;
  }
}
</style>
</head>
<body>${printContainer.innerHTML}</body>
</html>`);
  doc.close();

  console.log("Iniciando impresión...");

  // Timeout más largo para móviles
  const timeout = isMobile ? 1000 : 500;
  
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      
      // Para móviles, intentar diferentes métodos de impresión
      if (isMobile) {
        // Intentar imprimir directamente
        iframe.contentWindow.print();
        
        // Fallback: mostrar diálogo de impresión del navegador
        setTimeout(() => {
          if (window.print) {
            window.print();
          }
        }, 200);
      } else {
        iframe.contentWindow.print();
      }
      
      // Limpiar iframe después de un tiempo
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
          console.log("Impresión completada");
        } catch (e) {
          console.log("Error limpiando iframe:", e);
        }
      }, 2000);
    } catch (e) {
      console.error("Error al imprimir:", e);
      alert("Error al abrir el diálogo de impresión. Intente nuevamente.");
      document.body.removeChild(iframe);
    }
  }, timeout);
};
