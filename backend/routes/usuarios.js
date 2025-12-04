const express = require("express");
const router = express.Router();
const db = require("../db");

// Crear nuevo usuario
router.post("/", async (req, res) => {
  const {
    documento,
    nombre,
    apellido,
    email,
    empresa_contratista,
    usuario,
    contraseña,
    tipo_usuario,
  } = req.body;

  if (
    !documento ||
    !nombre ||
    !apellido ||
    !usuario ||
    !contraseña ||
    !tipo_usuario
  ) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO usuarios (documento, nombre, apellido, email, empresa_contratista, usuario, contraseña, tipo_usuario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        documento,
        nombre,
        apellido,
        email,
        empresa_contratista,
        usuario,
        contraseña,
        tipo_usuario,
      ]
    );

    res.status(201).json({
      message: "Usuario creado exitosamente",
      documento: documento,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "El documento o usuario ya existe" });
    }
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// Obtener usuario por documento
router.get("/:documento", async (req, res) => {
  const { documento } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE documento = $1",
      [documento]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

// Actualizar usuario
router.put("/:documento", async (req, res) => {
  const { documento } = req.params;
  const {
    nombre,
    apellido,
    email,
    empresa_contratista,
    usuario,
    contraseña,
    tipo_usuario,
  } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obtener el usuario actual para ver si cambió el nombre de usuario
    const [currentRows] = await connection.query(
      "SELECT usuario FROM usuarios WHERE documento = ?",
      [documento]
    );

    if (currentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const oldUsuario = currentRows[0].usuario;

    // 2. Actualizar la tabla de usuarios
    const [result] = await connection.query(
      `UPDATE usuarios 
       SET nombre = ?, apellido = ?, email = ?, empresa_contratista = ?, 
           usuario = ?, contraseña = ?, tipo_usuario = ?
       WHERE documento = ?`,
      [
        nombre,
        apellido,
        email,
        empresa_contratista,
        usuario,
        contraseña,
        tipo_usuario,
        documento,
      ]
    );

    // 3. Si el nombre de usuario cambió, actualizar tablas relacionadas
    if (oldUsuario !== usuario) {
      console.log(`Propagando cambio de usuario: ${oldUsuario} -> ${usuario}`);

      // Actualizar stock_ubicaciones
      await connection.query(
        "UPDATE stock_ubicaciones SET Usuario = ? WHERE Usuario = ?",
        [usuario, oldUsuario]
      );

      // Actualizar historial_movimientos
      await connection.query(
        "UPDATE historial_movimientos SET Usuario = ? WHERE Usuario = ?",
        [usuario, oldUsuario]
      );
    }

    await connection.commit();
    res.json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar usuario:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El usuario ya existe" });
    }
    res.status(500).json({ error: "Error al actualizar usuario" });
  } finally {
    connection.release();
  }
});

// Listar todos los usuarios
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT documento, nombre, apellido, usuario, tipo_usuario FROM usuarios ORDER BY nombre"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    res.status(500).json({ error: "Error al listar usuarios" });
  }
});

// Eliminar usuario
router.delete("/:documento", async (req, res) => {
  const { documento } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM usuarios WHERE documento = $1",
      [documento]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

module.exports = router;
