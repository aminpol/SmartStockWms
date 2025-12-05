import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./components/Login";
import FormView from "./components/FormView";
import CodesView from "./components/CodesView";
import PrintQrPallet from "./components/PrintQrPallet";
import Inventario from "./components/Inventario";
import Consulta from "./components/Consulta";
import Ingresa from "./components/Ingrsa";
import Movimientos from "./components/Movimientos";
import Picking from "./components/Picking";
import Administrador from "./components/Administrador";
import BarcodeScannerListener from "./components/BarcodeScannerListener";

import { printCodes } from "./utils/print";
import "./index.css";

import { useConfig } from "./context/ConfigContext";

const AppContent = () => {
  const navigate = useNavigate();
  const { config } = useConfig();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("isAuthenticated") === "true";
  });
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem("app_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing user:", e);
        return null;
      }
    }
    return null;
  });

  const [codes, setCodes] = useState(() => {
    const saved = localStorage.getItem("app_codes");
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("appSettings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing settings:", e);
      }
    }
    // Use defaults from global config
    return {
      type: config.generatorDefaults.type,
      textSize: config.generatorDefaults.textSize,
      codeWidth: config.generatorDefaults.width,
      codeHeight: config.generatorDefaults.height,
    };
  });

  // Guardar configuración cuando cambie
  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
    sessionStorage.setItem("appSettings", JSON.stringify(settings));
  }, [settings]);

  // Guardar códigos cuando cambien
  useEffect(() => {
    localStorage.setItem("app_codes", JSON.stringify(codes));
  }, [codes]);

  const handleGenerate = (content) => {
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const newCodes = lines.map((line) => ({
      type: settings.type,
      content: line,
      textSize: settings.textSize,
    }));

    setCodes(newCodes);
    localStorage.setItem("textoTamano", settings.textSize + "px");
    navigate("/codes");
  };

  const handleDelete = (index) => {
    setCodes(codes.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    printCodes(codes, settings);
  };

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    sessionStorage.setItem("isAuthenticated", "true");
    sessionStorage.setItem("app_user", JSON.stringify(userData));
    navigate("/menu");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("app_user");
    navigate("/login");
  };

  const handleBackFromCodes = () => {
    setCodes([]);
    navigate("/menu");
  };

  const handleClearCodes = () => {
    setCodes([]);
  };

  const handleMenuOption = (type) => {
    console.log("handleMenuOption type:", type);
    setSettings((prev) => ({ ...prev, type }));
    if (type === "qr-pallet") {
      console.log("Navegando a /qr-pallet");
      navigate("/qr-pallet");
    } else if (type === "inventory") {
      console.log("Navegando a /inventario");
      navigate("/inventario");
    } else if (type === "admin") {
      console.log("Navegando a /admin");
      navigate("/admin");
    } else {
      console.log("Navegando a /codes");
      navigate("/codes");
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/menu" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/inventario"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <Inventario
                    onBack={() => navigate("/menu")}
                    onLogout={handleLogout}
                    user={user}
                  />
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/inventario/consulta"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <div className="inventory-panel">
                    <Consulta
                      onBack={() => navigate("/inventario")}
                      onLogout={handleLogout}
                      onNavigateToPicking={(code) =>
                        navigate("/inventario/picking", {
                          state: { initialCode: code },
                        })
                      }
                    />
                  </div>
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/inventario/movimientos"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <div className="inventory-panel">
                    <Movimientos
                      onBack={() => navigate("/inventario")}
                      onLogout={handleLogout}
                      user={user}
                    />
                  </div>
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/inventario/ingresa"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <div className="inventory-panel">
                    <Ingresa
                      onBack={() => navigate("/inventario")}
                      onLogout={handleLogout}
                      user={user}
                    />
                  </div>
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/inventario/picking"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <div className="inventory-panel">
                    <Picking
                      onBack={() => navigate("/inventario")}
                      onLogout={handleLogout}
                      user={user}
                    />
                  </div>
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/admin"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <Administrador
                    onBack={() => navigate("/menu")}
                    onLogout={handleLogout}
                    user={user}
                  />
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/menu"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <FormView
                    onMenuOption={handleMenuOption}
                    onLogout={handleLogout}
                    user={user}
                  />
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/codes"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <CodesView
                    codes={codes}
                    onBack={handleBackFromCodes}
                    onPrint={handlePrint}
                    settings={settings}
                    setSettings={setSettings}
                    onDelete={handleDelete}
                    onGenerate={handleGenerate}
                    onLogout={handleLogout}
                    onClear={handleClearCodes}
                  />
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/qr-pallet"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <PrintQrPallet onBack={() => navigate("/menu")} />
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/menu" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <BarcodeScannerListener />
      <AppContent />
    </Router>
  );
}

export default App;
