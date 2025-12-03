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

  // Auto-expand textarea
  const contenidoInput = document.getElementById("contenido");
  contenidoInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });

  // Listeners para Ancho y Alto
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
    // Update Box Width (relative to base 220px)
    const baseWidth = 220;
    const newWidth = baseWidth * (width / 100);
    box.style.width = `${newWidth}px`;

    // Update Content Height
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
  codigosGenerados = []; // Reset array, though we mainly rely on DOM for print now

  lineas.forEach((dato) => {
    const box = document.createElement("div");
    box.className = "codigoBox";

    // Delete Button
    const btnDelete = document.createElement("button");
    btnDelete.className = "btn-delete";
    btnDelete.textContent = "×";
    btnDelete.title = "Eliminar código";
    btnDelete.onclick = function () {
      box.remove();
    };
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
  contenidoInput.style.height = "40px"; // Reset height

  // Mostrar modal de éxito
  document.getElementById("modalExito").classList.remove("hidden");

  // Apply current dimensions
  setTimeout(updateDimensions, 0);
};

window.cerrarModal = function () {
  document.getElementById("modalExito").classList.add("hidden");
};

window.mostrarCodigos = function () {
  const pantallaFormulario = document.getElementById("pantallaFormulario");
  const pantallaCodigos = document.getElementById("pantallaCodigos");

  pantallaFormulario.classList.add("hidden");
  pantallaCodigos.classList.remove("hidden");

  const previewArea = document.getElementById("previewArea");
  previewArea.innerHTML = "";
  codigosGenerados.forEach((box) => previewArea.appendChild(box));

  // Ensure dimensions are applied when showing
  updateDimensions();
};

window.volver = function () {
  const pantallaFormulario = document.getElementById("pantallaFormulario");
  const pantallaCodigos = document.getElementById("pantallaCodigos");

  pantallaFormulario.classList.remove("hidden");
  pantallaCodigos.classList.add("hidden");
};

window.imprimirTodos = function () {
  const area = document.getElementById("previewArea");

  if (!area.innerHTML.trim()) {
    alert("No hay códigos para imprimir");
    return;
  }

  // Clone the area to manipulate it for printing (remove delete buttons)
  const clone = area.cloneNode(true);

  // Remove delete buttons from the clone
  const deleteButtons = clone.querySelectorAll(".btn-delete");
  deleteButtons.forEach((btn) => btn.remove());

  // Create a temporary print container
  const printContainer = document.createElement("div");
  printContainer.id = "printContainer";
  printContainer.innerHTML = clone.innerHTML;

  // Hide the main app and show only the print container
  const appContainer = document.querySelector(".app-container");
  const pantalla = document.querySelector(".pantalla");

  // Store original styles
  const originalAppDisplay = appContainer.style.display;
  const originalPantallaBackground = pantalla.style.background;

  // Hide app and prepare for print
  appContainer.style.display = "none";
  pantalla.style.background = "white";
  document.body.appendChild(printContainer);

  // Add print-specific styles
  const printStyle = document.createElement("style");
  printStyle.id = "printStyles";
  printStyle.textContent = `
    @media print {
      /* Hide everything except print container */
      body * {
        visibility: hidden;
      }
      
      #printContainer,
      #printContainer * {
        visibility: visible;
      }
      
      #printContainer {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      
      /* Hide app elements explicitly */
      .pantalla,
      .app-container {
        display: none !important;
      }
      
      body { 
        padding: 0; 
        margin: 0; 
        font-family: Arial, sans-serif;
        background: white;
        height: auto;
        overflow: visible;
      }
      
      html {
        height: auto;
      }
      
      @page {
        margin: 10mm;
      }
      
      .codigoBox { 
        page-break-inside: avoid; 
        margin-bottom: 20px;
        text-align: center;
        border: 1px solid #ccc;
        padding: 10px;
      }
      
      .codigoBox:last-child {
        page-break-after: avoid;
        margin-bottom: 0;
      }
      
      .codigoBox svg, .codigoBox img {
        display: block;
        margin: 0 auto;
        max-width: 100%;
      }
      
      .etiqueta { 
        width: 100%; 
        text-align: center; 
        word-wrap: break-word;
        margin-top: 2px;
      }
      
      .btn-delete { 
        display: none !important; 
      }
    }
    
    @media screen {
      #printContainer {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        padding: 20px;
      }
      
      #printContainer .codigoBox { 
        margin-bottom: 20px;
        text-align: center;
        border: 1px solid #ccc;
        padding: 10px;
      }
      
      #printContainer .codigoBox svg, 
      #printContainer .codigoBox img {
        display: block;
        margin: 0 auto;
        max-width: 100%;
      }
      
      #printContainer .etiqueta { 
        width: 100%; 
        text-align: center; 
        word-wrap: break-word;
        margin-top: 2px;
      }
      
      #printContainer .btn-delete { 
        display: none !important; 
      }
    }
  `;
  document.head.appendChild(printStyle);

  // Trigger print dialog
  setTimeout(() => {
    window.print();

    // Clean up after print (or cancel)
    setTimeout(() => {
      // Remove print container and styles
      printContainer.remove();
      printStyle.remove();

      // Restore original styles
      appContainer.style.display = originalAppDisplay;
      pantalla.style.background = originalPantallaBackground;
    }, 500);
  }, 500);
};
