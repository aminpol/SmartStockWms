const db = require("./db");

async function verifyUserPropagation() {
  const testUser = {
    documento: "99999999",
    nombre: "Test",
    apellido: "User",
    edad: 30,
    empresa_contratista: "TestCorp",
    usuario: "TestUser",
    contraseña: "password123",
    tipo_usuario: "bodega",
  };

  const updatedUser = {
    ...testUser,
    usuario: "UpdatedUser",
  };

  const baseUrl = "http://localhost:3000/api";

  try {
    console.log("1. Creando usuario de prueba...");
    let response = await fetch(`${baseUrl}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    if (!response.ok)
      throw new Error(`Error creando usuario: ${response.statusText}`);

    console.log("2. Registrando movimiento con usuario de prueba...");
    response = await fetch(`${baseUrl}/stock/ingresa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "TESTCODE",
        quantity: 10,
        position: "TESTPOS",
        user: testUser.usuario,
      }),
    });
    if (!response.ok)
      throw new Error(`Error registrando movimiento: ${response.statusText}`);

    console.log("3. Actualizando nombre de usuario...");
    response = await fetch(`${baseUrl}/usuarios/${testUser.documento}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser),
    });
    if (!response.ok)
      throw new Error(`Error actualizando usuario: ${response.statusText}`);

    console.log("4. Verificando propagación en historial_movimientos...");
    const [rows] = await db.query(
      "SELECT * FROM historial_movimientos WHERE Usuario = ?",
      [updatedUser.usuario]
    );

    if (rows.length > 0) {
      console.log(
        "✓ Éxito: Se encontró el movimiento con el nuevo nombre de usuario."
      );
    } else {
      console.error(
        "✗ Fallo: No se encontró el movimiento con el nuevo nombre de usuario."
      );
      process.exit(1);
    }

    // Limpieza
    console.log("5. Limpiando datos de prueba...");
    await fetch(`${baseUrl}/usuarios/${testUser.documento}`, {
      method: "DELETE",
    });
    await db.query("DELETE FROM historial_movimientos WHERE Usuario = ?", [
      updatedUser.usuario,
    ]);
    await db.query(
      "DELETE FROM stock_ubicaciones WHERE Id_codigo = 'TESTCODE'"
    );

    console.log("✓ Verificación completada exitosamente.");
    process.exit(0);
  } catch (error) {
    console.error("✗ Error durante la verificación:", error.message);
    process.exit(1);
  }
}

verifyUserPropagation();
