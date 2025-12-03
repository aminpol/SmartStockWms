const db = require("./db");

async function cleanup() {
  try {
    console.log("Limpiando datos de prueba...");

    const connection = await db.getConnection();

    // Limpiar usuarios de prueba
    await connection.query(
      "DELETE FROM usuarios WHERE documento IN ('88888888', '99999999')"
    );

    // Limpiar movimientos de prueba
    await connection.query(
      "DELETE FROM historial_movimientos WHERE Usuario IN ('UserProp', 'UserUpdated', 'TestUser', 'UpdatedUser')"
    );

    // Limpiar stock de prueba
    await connection.query(
      "DELETE FROM stock_ubicaciones WHERE Id_codigo IN ('PROPCODE', 'TESTCODE')"
    );

    // Limpiar materiales de prueba
    await connection.query(
      "DELETE FROM materiales WHERE id_code IN ('PROPCODE', 'TESTCODE')"
    );

    connection.release();

    console.log("✓ Limpieza completada.");
    process.exit(0);
  } catch (error) {
    console.error("Error durante limpieza:", error.message);
    process.exit(1);
  }
}

cleanup();
