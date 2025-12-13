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
    const etiqueta = box.querySelector(".etiqueta");

    // Si hay SVG o IMG (QR/Barcode), el alto controla su altura
    if (svg) {
      svg.setAttribute("height", height);
      svg.style.height = `${height}px`;
    }
    if (img) {
      img.style.height = `${height}px`;
      img.style.width = "auto";
    }

    // Si NO hay SVG ni IMG (es solo texto), el alto controla el tamaño de fuente
    if (!svg && !img && etiqueta) {
      // Mapeamos el rango de altura (50-300) a un rango de fuente razonable (e.g., 10px - 60px)
      // O simplemente usamos el valor directo si el usuario prefiere control total,
      // pero 300px de fuente es mucho. Vamos a escalar un poco.
      // Vamos a usar una proporción simple: height / 4 para font-size aprox?
      // O mejor, usaremos el valor directo pero interpretado como "escala" relativa a un base.
      // El usuario pidió "opciones de ancho y alto para darle tamaño al texto".
      // Vamos a asumir que "Alto" se convierte en "Tamaño de Fuente" directamente para simplicidad visual,
      // pero tal vez ajustado. Probemos directo primero, o con un factor.
      // Dado que el slider va de 50 a 300, 50px de texto es grande.
      // Vamos a dividir por 2 para que sea 25px a 150px, que es más razonable para títulos grandes.
      const fontSize = Math.max(10, height / 2);
      etiqueta.style.fontSize = `${fontSize}px`;
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

    if (tipo !== "texto") {
      const visual = tipo === "qr" ? crearQR(dato) : crearBarcode(dato);
      box.appendChild(visual);
    }

    const etiqueta = document.createElement("p");
    etiqueta.className = "etiqueta";
    etiqueta.textContent = dato;
    // Si es modo texto, el tamaño inicial lo define el slider de "Tamaño del texto" del formulario,
    // pero luego será controlado por el slider de "Alto" en la vista de códigos.
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

  // Enviar mensaje al componente padre para ocultar botones solo en móvil
  const isMobile = !window.matchMedia("(min-width: 1024px)").matches;
  if (isMobile) {
    window.parent.postMessage({ action: 'hideButtons' }, '*');
  }

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
    
    // Enviar mensaje al componente padre para mostrar botones
    window.parent.postMessage({ action: 'showButtons' }, '*');
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
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
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
    padding: 0.3cm; /* Reducido para más espacio */
    background: white !important;
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
    padding: 1px 0;
    margin: 0;
    overflow: hidden;
    background: white !important;
  }
  
  .codigoBox svg, .codigoBox img { 
    display: block !important; 
    max-width: 85%; 
    max-height: 3.2cm; /* Ajustado para mejor ajuste */
    width: auto;
    height: auto;
    object-fit: contain;
    background: white !important;
  }
  
  .etiqueta { 
    width: 100%; 
    text-align: center; 
    word-wrap: break-word; 
    margin-top: 1px; 
    font-size: 9px; /* Reducido para mejor ajuste */
    line-height: 1.0;
    font-weight: bold;
    background: white !important;
  }
}

/* Estilos para pantalla (vista previa) */
body {
  font-family: Arial, sans-serif;
  background: white;
}
.print-page {
  background: white;
  border: 1px solid #ccc;
  margin-bottom: 10px;
}
</style>
</head>
<body>${printContainer.innerHTML}</body>
</html>`);
  doc.close();

  // Imprimir después de asegurar que el contenido esté completamente cargado
  iframe.onload = function() {
    // Esperar un poco más para que los estilos se apliquen completamente
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        
        // Forzar un repaint antes de imprimir
        iframe.contentWindow.document.body.offsetHeight;
        
        // Verificar que haya contenido antes de imprimir
        const contentCheck = iframe.contentWindow.document.querySelectorAll('.codigoBox').length;
        if (contentCheck === 0) {
          console.error('No se encontraron códigos en el iframe de impresión');
          document.body.removeChild(iframe);
          alert('Error: No se pudo cargar el contenido para imprimir');
          return;
        }
        
        iframe.contentWindow.print();
        
        // Limpiar iframe después de la impresión
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      } catch (error) {
        console.error('Error al imprimir:', error);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        alert('Error al intentar imprimir. Por favor intente nuevamente.');
      }
    }, 1000); // Aumentado a 1 segundo para asegurar carga completa
  };
};
