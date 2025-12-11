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

  const printContainer = document.createElement("div");
  const codigosPorPagina = 4;

  for (let i = 0; i < visibleCodes.length; i += codigosPorPagina) {
    const pagina = document.createElement("div");
    pagina.className = "print-page";
    const grupo = visibleCodes.slice(i, i + codigosPorPagina);

    if (grupo.length < 4) {
      pagina.classList.add("partial-page");
    }

    grupo.forEach((codigoOriginal, index) => {
      console.log(`Procesando código ${i + index}:`, codigoOriginal);
      
      const clon = codigoOriginal.cloneNode(true);

      // Quitar botón de eliminar en la versión de impresión
      const btnDelete = clon.querySelector(".btn-delete");
      if (btnDelete) btnDelete.remove();

      // Si hay un canvas (QR), reemplazarlo por una imagen para que se imprima correctamente
      const originalCanvas = codigoOriginal.querySelector("canvas");
      const clonedCanvas = clon.querySelector("canvas");

      if (originalCanvas && clonedCanvas) {
        try {
          console.log("Convirtiendo canvas a imagen...");
          const dataUrl = originalCanvas.toDataURL("image/png");
          const img = clon.ownerDocument.createElement("img");
          img.src = dataUrl;
          img.style.height = clonedCanvas.style.height || "auto";
          img.style.width = clonedCanvas.style.width || "auto";
          clonedCanvas.replaceWith(img);
          console.log("Canvas convertido a imagen exitosamente");
        } catch (e) {
          console.error("No se pudo convertir el canvas a imagen para impresión", e);
        }
      }

      // Si hay una imagen (barcode), asegurarse de que esté cargada
      const originalImg = codigoOriginal.querySelector("img");
      const clonedImg = clon.querySelector("img");
      
      if (originalImg && clonedImg && !originalCanvas) {
        console.log("Procesando imagen de barcode...");
        // Para barcode, asegurarse de que la imagen se mantenga
        clonedImg.src = originalImg.src;
      }

      pagina.appendChild(clon);
    });

    printContainer.appendChild(pagina);
  }

  console.log("Creando iframe para impresión...");

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
    size: 11cm 19cm;
    margin: 0;
  }
  body { 
    margin: 0; 
    padding: 0; 
  }
  .print-page {
    width: 11cm;
    height: 19cm;
    display: grid;
    grid-template-rows: repeat(4, 1fr);
    align-items: center;
    justify-items: center;
    page-break-after: always;
    overflow: hidden;
    box-sizing: border-box;
    padding: 0.5cm;
  }

  .print-page:last-child { 
    page-break-after: avoid; 
  }
  
  .codigoBox { 
    width: 100% !important;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: none;
    padding: 2px 0;
    margin: 0;
    overflow: hidden;
  }
  
  .codigoBox svg, .codigoBox img { 
    display: block; 
    max-width: 90%; 
    max-height: 3.5cm;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  
  .etiqueta { 
    width: 100%; 
    text-align: center; 
    word-wrap: break-word; 
    margin-top: 2px; 
    font-size: 10px !important;
    line-height: 1.1;
  }
}

@media screen {
  body {
    background: white;
    margin: 20px;
  }
  .print-page {
    width: 11cm;
    height: 19cm;
    border: 1px solid #ccc;
    margin-bottom: 20px;
    display: grid;
    grid-template-rows: repeat(4, 1fr);
    align-items: center;
    justify-items: center;
    box-sizing: border-box;
    padding: 0.5cm;
  }
  .codigoBox { 
    width: 100% !important;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 1px solid #ddd;
    padding: 5px;
    margin: 2px;
  }
  .codigoBox svg, .codigoBox img { 
    display: block; 
    max-width: 90%; 
    max-height: 3cm;
    width: auto;
    height: auto;
  }
  .etiqueta { 
    text-align: center; 
    font-size: 8px;
    margin-top: 2px;
  }
}
</style>
</head>
<body>${printContainer.innerHTML}</body>
</html>`);
  doc.close();

  console.log("Iniciando impresión...");

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      console.log("Impresión completada");
    }, 1000);
  }, 1000);
};
