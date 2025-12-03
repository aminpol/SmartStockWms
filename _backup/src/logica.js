// QR / Barcode generator logic
import { crearQR, crearBarcode } from "./generador.js";

let codigosGenerados = [];

// Recuperar tamaño de texto guardado al cargar
window.addEventListener("DOMContentLoaded", () => {
  const savedSize = localStorage.getItem("textoTamano");
  const sliderText = document.getElementById("textoTamano");
  const sizeValue = document.getElementById("sizeValue");

  if (savedSize) {
    sliderText.value = savedSize.replace("px", "");
    sizeValue.textContent = savedSize;
  }

  // Listener para actualizar el valor mostrado del slider de texto
  sliderText.addEventListener("input", (e) => {
    sizeValue.textContent = e.target.value + "px";
  });

  // Auto‑expand textarea
  const contenidoInput = document.getElementById("contenido");
  contenidoInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });

  // Listeners para ancho y alto
  const widthSlider = document.getElementById("codeWidth");
  const widthValue = document.getElementById("widthValue");
  const heightSlider = document.getElementById("codeHeight");
  const heightValue = document.getElementById("heightValue");

  widthSlider.addEventListener("input", (e) => {
    widthValue.textContent = e.target.value + "%";
    updateDimensions();
  });

  heightSlider.addEventListener("input", (e) => {
    heightValue.textContent = e.target.value + "px";
    updateDimensions();
  });
});

function updateDimensions() {
  const width = document.getElementById("codeWidth").value;
  const height = document.getElementById("codeHeight").value;
  const boxes = document.querySelectorAll(".codigoBox");

  boxes.forEach((box) => {
    const baseWidth = 220;
    const newWidth = baseWidth * (width / 100);
    box.style.width = `${newWidth}px`;

    const svg = box.querySelector("svg");
    const img = box.querySelector("img");
    if (svg) {
      svg.setAttribute("height", height);
      svg.style.height = `${height}px`;
    }
    if (img) {
      img.style.height = `${height}px`;
      img.style.width = "auto";
    }
  });
}

window.generarCodigos = function () {
  const tipo = document.getElementById("tipo").value;
  const contenidoInput = document.getElementById("contenido");
  const contenido = contenidoInput.value.trim();
  const textoTamano = document.getElementById("textoTamano").value + "px";

  if (!contenido) {
    alert("Ingrese al menos un contenido");
    return;
  }

  localStorage.setItem("textoTamano", textoTamano);

  const lineas = contenido.split("\n").filter((l) => l.trim().length > 0);
  codigosGenerados = [];

  lineas.forEach((dato) => {
    const box = document.createElement("div");
    box.className = "codigoBox";

    // Botón de borrado
    const btnDelete = document.createElement("button");
    btnDelete.className = "btn-delete";
    btnDelete.textContent = "×";
    btnDelete.title = "Eliminar código";
    btnDelete.onclick = () => box.remove();
    box.appendChild(btnDelete);

    const visual = tipo === "qr" ? crearQR(dato) : crearBarcode(dato);
    box.appendChild(visual);

    const etiqueta = document.createElement("p");
    etiqueta.className = "etiqueta";
    etiqueta.textContent = dato;
    etiqueta.style.fontSize = textoTamano;
    box.appendChild(etiqueta);

    codigosGenerados.push(box);
  });

  const datos = {
    tipo,
    contenidos: lineas,
    textoTamano,
    fecha: new Date().toISOString(),
  };
  localStorage.setItem("codigosGenerados", JSON.stringify(datos));

  contenidoInput.value = "";
  contenidoInput.style.height = "40px";

  // Mostrar modal de éxito
  document.getElementById("modalExito").classList.remove("hidden");

  // Aplicar dimensiones actuales
  setTimeout(updateDimensions, 0);
};

window.cerrarModal = function () {
  document.getElementById("modalExito").classList.add("hidden");
};

// Nueva función para ir a la vista de códigos desde el modal
window.irACodigos = function () {
  cerrarModal();
  const pantallaFormulario = document.getElementById("pantallaFormulario");
  const pantallaCodigos = document.getElementById("pantallaCodigos");
  pantallaFormulario.classList.add("hidden");
  pantallaCodigos.classList.remove("hidden");

  const previewArea = document.getElementById("previewArea");
  previewArea.innerHTML = "";
  codigosGenerados.forEach((box) => previewArea.appendChild(box));
  updateDimensions();
};

window.volver = function () {
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

  if (isDesktop) {
    // Desktop: Limpiar códigos generados (Reset)
    const previewArea = document.getElementById("previewArea");
    previewArea.innerHTML = "";
    codigosGenerados = [];
    // Opcional: Ocultar modal si estuviera abierto (aunque volver suele usarse después)
  } else {
    // Mobile: Volver a la vista del formulario
    const pantallaFormulario = document.getElementById("pantallaFormulario");
    const pantallaCodigos = document.getElementById("pantallaCodigos");
    pantallaFormulario.classList.remove("hidden");
    pantallaCodigos.classList.add("hidden");
  }
};

// Impresión: usar iframe oculto para aislar los códigos y evitar la UI completa
window.imprimirTodos = function () {
  // Obtener solo los códigos visibles en el DOM (excluye los eliminados)
  const visibleCodes = Array.from(
    document.querySelectorAll("#previewArea .codigoBox")
  );

  if (visibleCodes.length === 0) {
    alert("No hay códigos para imprimir");
    return;
  }

  // Crear contenedor temporal para armar las páginas
  const printContainer = document.createElement("div");

  // Configurar para 4 códigos por etiqueta (página)
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
      // Clonar código
      const clon = codigoOriginal.cloneNode(true);
      // Eliminar botón de borrado
      const btnDelete = clon.querySelector(".btn-delete");
      if (btnDelete) btnDelete.remove();
      pagina.appendChild(clon);
    });

    printContainer.appendChild(pagina);
  }

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
    size: 11cm 19cm; /* Tamaño exacto de la etiqueta */
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
    grid-template-rows: repeat(4, 1fr); /* Dividir en 4 filas iguales */
    align-items: center;
    justify-items: center;
    page-break-after: always;
    overflow: hidden;
    box-sizing: border-box;
    padding: 0.5cm; /* Pequeño margen interno */
  }

  .print-page:last-child { 
    page-break-after: avoid; 
  }
  
  .codigoBox { 
    width: 100%;
    height: 100%; /* Ocupar toda la celda del grid */
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
    max-height: 3.5cm; /* Limitar altura para que quepan 4 */
    width: auto;
    height: auto;
    object-fit: contain;
  }
  
  .etiqueta { 
    width: 100%; 
    text-align: center; 
    word-wrap: break-word; 
    margin-top: 2px; 
    font-size: 10px; /* Texto más pequeño para ajustar */
    line-height: 1.1;
  }
}
</style>
</head>
<body>${printContainer.innerHTML}</body>
</html>`);
  doc.close();

  // Imprimir después de un breve retardo
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Limpiar iframe
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  }, 500);
};
