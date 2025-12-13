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
import PrintQrPallet from "./components/PrintQrPallet";
import Inventario from "./components/Inventario";
import Consulta from "./components/Consulta";
import Ingresa from "./components/Ingrsa";
import Movimientos from "./components/Movimientos";
import Picking from "./components/Picking";
import Administrador from "./components/Administrador";
import RecibirDePlanta from "./components/RecibirDePlanta";
import PalletsRecibidos from "./components/PalletsRecibidos";
import BarcodeScannerListener from "./components/BarcodeScannerListener";
import CodeGeneraView from "./components/CodeGeneraView";

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

  const handleMenuOption = (type) => {
    console.log("handleMenuOption type:", type);
    if (type === "qr-pallet") {
      console.log("Navegando a /qr-pallet");
      navigate("/qr-pallet");
    } else if (type === "inventory") {
      console.log("Navegando a /inventario");
      navigate("/inventario");
    } else if (type === "recibir-planta") {
      console.log("Navegando a /recibir-planta");
      navigate("/recibir-planta");
    } else if (type === "admin") {
      console.log("Navegando a /admin");
      navigate("/admin");
    } else if (type === "codegenera") {
      console.log("Navegando a /codegenera");
      navigate("/codegenera");
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
        path="/codegenera"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <CodeGeneraView
                    onBack={() => navigate("/menu")}
                    onLogout={handleLogout}
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
            <div
              className="pantalla"
              style={{ alignItems: "flex-start", paddingTop: "2rem" }}
            >
              <div className="app-container">
                <main className="contenedor">
                  <PrintQrPallet
                    onBack={() => navigate("/menu")}
                    onLogout={handleLogout}
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
        path="/recibir-planta"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <RecibirDePlanta
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
        path="/pallets-recibidos"
        element={
          isAuthenticated ? (
            <div className="pantalla">
              <div className="app-container">
                <main className="contenedor">
                  <PalletsRecibidos
                    onBack={() => navigate("/recibir-planta")}
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
