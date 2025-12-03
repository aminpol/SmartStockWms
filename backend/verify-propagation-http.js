const http = require("http");
const db = require("./db");

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api" + path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : {});
        } else {
          reject(
            new Error(`Request failed with status ${res.statusCode}: ${body}`)
          );
        }
      });
    });

    req.on("error", (e) => reject(e));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function verify() {
  const testUser = {
    documento: "88888888",
    nombre: "Test",
    apellido: "Prop",
    edad: 30,
    empresa_contratista: "TestCorp",
    usuario: "UserProp",
    contraseña: "password123",
    tipo_usuario: "bodega",
  };

  const updatedUser = {
    ...testUser,
    usuario: "UserUpdated",
  };

  try {
    console.log("0. Creando material de prueba...");
    // Insertar directamente en DB porque no hay endpoint público documentado para crear materiales
    // o usar una conexión DB auxiliar
    const connectionInit = await db.getConnection();
    await connectionInit.query(
      "INSERT IGNORE INTO materiales (id_code, description, unit) VALUES (?, ?, ?)",
      ["PROPCODE", "Material de Prueba", "UND"]
    );
    connectionInit.release();

    console.log("1. Creando usuario...");
    await request("POST", "/usuarios", testUser);

    console.log("2. Creando movimiento...");
    await request("POST", "/stock/ingresa", {
      code: "PROPCODE",
      quantity: 5,
      position: "PROPPOS",
      user: testUser.usuario,
    });

    console.log("3. Actualizando usuario...");
    await request("PUT", `/usuarios/${testUser.documento}`, updatedUser);

    console.log("4. Verificando DB...");
    // Usar una conexión nueva para verificar
    const connection = await db.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM historial_movimientos WHERE Usuario = ?",
      [updatedUser.usuario]
    );
    connection.release();

    if (rows.length > 0) {
      console.log("✓ Éxito: Movimiento actualizado correctamente.");
    } else {
      console.error("✗ Fallo: No se encontró el movimiento actualizado.");
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

verify();
