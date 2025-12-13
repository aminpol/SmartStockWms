export function crearQR(contenido) {
  const qr = new QRious({
    value: contenido,
    size: 200,
  });

  const img = document.createElement("img");
  img.src = qr.toDataURL();
  return img;
}

export function crearBarcode(contenido) {
  const contenedor = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("height", "80");
  svg.setAttribute("width", "200");
  contenedor.appendChild(svg);

  JsBarcode(svg, contenido, {
    format: "CODE128",
    width: 2,
    height: 80,
    displayValue: false,
  });

  return contenedor;
}
