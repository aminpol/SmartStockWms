// Script de prueba para verificar localStorage
// Abre la consola del navegador (F12) y pega este código

console.log("=== Estado de localStorage ===");
console.log("appView:", localStorage.getItem("appView"));
console.log("appSettings:", localStorage.getItem("appSettings"));
console.log("qrPalletState:", localStorage.getItem("qrPalletState"));

// Para forzar la vista de QR Pallet:
// localStorage.setItem('appView', 'qr-pallet');
// localStorage.setItem('appSettings', JSON.stringify({type: 'qr-pallet', textSize: 16, codeWidth: 80, codeHeight: 80}));
// location.reload();
