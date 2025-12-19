const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://smartstockwms-a8p6.onrender.com";

export default API_URL;
