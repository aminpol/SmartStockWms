const express = require("express");
const cors = require("cors");
const db = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Importar rutas
const usuariosRoutes = require("./routes/usuarios");
app.use("/api/usuarios", usuariosRoutes);

// Endpoint de Login
app.post("/api/login", async (req, res) => {
  const { usuario, contraseña } = req.body;

  if (!usuario || !contraseña) {
    return res
      .status(400)
      .json({ error: "Usuario y contraseña son requeridos" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE usuario = $1 AND contraseña = $2",
      [usuario, contraseña]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = rows[0];
    res.json({
      message: "Login exitoso",
      usuario: user.usuario,
      nombre: user.nombre,
      tipo_usuario: user.tipo_usuario,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API Backend funcionando");
});

// Ruta para probar conexión a BD
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    res.json({
      message: "Conexión a base de datos exitosa",
      result: rows[0].result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error conectando a la base de datos",
      details: error.message,
    });
  }
});

// Helper functions
const getFecha = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
};

const getTurno = () => {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 0 && hour < 8) return "Turno 1";
  if (hour >= 8 && hour < 16) return "Turno 2";
  return "Turno 3";
};

const registrarMovimiento = async (
  code,
  descripcion,
  movimiento,
  t_movimi,
  estado,
  usuario
) => {
  try {
    const turno = getTurno();
    const fecha = getFecha();

    // Obtener unidad desde materiales
    const [rows] = await db.query(
      "SELECT unit FROM materiales WHERE id_code = $1",
      [code]
    );
    const unit = rows.length > 0 ? rows[0].unit : "UND";

    await db.query(
      `INSERT INTO historial_movimientos 
      (Id_codigo, Descripcion, Movimiento, Unit, T_movimi, Estado, Usuario, Turno, Fecha) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        code,
        descripcion,
        movimiento,
        unit,
        t_movimi,
        estado,
        usuario,
        turno,
        fecha,
      ]
    );
  } catch (error) {
    console.error("Error registrando movimiento:", error);
  }
};

// Endpoint para consultar historial de movimientos por código
app.get("/api/historial/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;
    const { tipo } = req.query; // Filtro opcional: Entro, Salio, Movimiento

    if (!codigo) {
      return res.status(400).json({ error: "Código no proporcionado" });
    }

    let query = `
      SELECT 
        Id_codigo AS "Id_codigo", 
        Descripcion AS "Descripcion", 
        Movimiento AS "Movimiento", 
        Unit AS "Unit", 
        T_movimi AS "T_movimi", 
        Estado AS "Estado", 
        Usuario AS "Usuario", 
        Turno AS "Turno", 
        Fecha AS "Fecha"
      FROM historial_movimientos
      WHERE Id_codigo = $1
    `;

    const params = [codigo];

    // Agregar filtro por tipo si se proporciona
    if (tipo && ["Entro", "Salio", "Movimiento"].includes(tipo)) {
      query += " AND T_movimi = $2";
      params.push(tipo);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        error: "No se encontraron movimientos para este código",
      });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error consultando historial:", error);
    res.status(500).json({ error: "Error interno al consultar historial" });
  }
});

// Endpoint para obtener un material por código
app.get("/api/materiales/:code", async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ error: "Código no proporcionado" });
    }

    // La tabla se llama 'materiales' y las columnas son 'id_code', 'description', 'unit', 'type'
    const [rows] = await db.query(
      "SELECT * FROM materiales WHERE id_code = $1",
      [code]
    );

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "Material no encontrado" });
    }
  } catch (error) {
    console.error("Error obteniendo material:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para crear un nuevo material
app.post("/api/materiales", async (req, res) => {
  try {
    const { id_code, description, unit, type, user } = req.body;

    if (!id_code || !description) {
      return res
        .status(400)
        .json({ error: "Código y descripción son requeridos" });
    }

    // Verificar si ya existe
    const [existing] = await db.query(
      "SELECT id_code FROM materiales WHERE id_code = $1",
      [id_code]
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Ya existe un material con ese código" });
    }

    // Insertar nuevo material
    const [result] = await db.query(
      "INSERT INTO materiales (id_code, description, unit, type) VALUES ($1, $2, $3, $4)",
      [id_code, description, unit || "UNIDADES", type || "PRODUCTO"]
    );

    res.status(201).json({
      message: "Material creado exitosamente",
      id: result.insertId,
      id_code,
      description,
      unit,
      type,
    });
  } catch (error) {
    console.error("Error creando material:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para actualizar un material existente
app.put("/api/materiales/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const { description, unit, type, user } = req.body;

    if (!description) {
      return res.status(400).json({ error: "La descripción es requerida" });
    }

    // Verificar si existe
    const [existing] = await db.query(
      "SELECT id_code FROM materiales WHERE id_code = $1",
      [code]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    // Actualizar material
    await db.query(
      "UPDATE materiales SET description = $1, unit = $2, type = $3 WHERE id_code = $4",
      [description, unit || "UNIDADES", type || "PRODUCTO", code]
    );

    res.json({
      message: "Material actualizado exitosamente",
      id_code: code,
      description,
      unit,
      type,
    });
  } catch (error) {
    console.error("Error actualizando material:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para eliminar un material
app.delete("/api/materiales/:code", async (req, res) => {
  try {
    const { code } = req.params;

    // Verificar si existe
    const [existing] = await db.query(
      "SELECT id_code FROM materiales WHERE id_code = $1",
      [code]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    // Verificar si tiene stock asociado
    const [stockCheck] = await db.query(
      "SELECT COUNT(*) as count FROM stock_ubicaciones WHERE id = $1",
      [code]
    );

    if (stockCheck[0].count > 0) {
      return res.status(400).json({
        error: "No se puede eliminar el material porque tiene stock asociado",
      });
    }

    // Eliminar material
    await db.query("DELETE FROM materiales WHERE id_code = $1", [code]);

    res.json({ message: "Material eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando material:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para listar todos los materiales (opcional)
app.get("/api/materiales", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM materiales ORDER BY description ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error listando materiales:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para consultar stock por código
app.get("/api/stock/consulta/:code", async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ error: "Código no proporcionado" });
    }

    const [rows] = await db.query(
      `SELECT id, descrip, cantidad, posicion, updated_at
       FROM stock_ubicaciones
       WHERE id = $1
       ORDER BY updated_at ASC`,
      [code]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No hay stock registrado para este código" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error consultando stock:", error);
    res.status(500).json({ error: "Error interno al consultar stock" });
  }
});

// Endpoint para mover stock entre ubicaciones
app.post("/api/stock/mover", async (req, res) => {
  try {
    const { fromPosition, toPosition, quantity, user } = req.body;

    // Extraer el nombre de usuario si user es un objeto, sino usar el string directamente
    const userName =
      typeof user === "object" && user !== null ? user.usuario : user;

    if (!fromPosition || !toPosition || !userName || quantity == null) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Cantidad inválida" });
    }

    // Validar que ambas posiciones existen en el sistema
    try {
      // Verificar si la columna 'activa' existe en la tabla ubicaciones
      const [columns] = await db.query(
        `SELECT COLUMN_NAME 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = 'ubicaciones' 
         AND column_name = 'activa'`
      );
      const hasActivaColumn = columns.length > 0;

      let posicionOrigen, posicionDestino;
      if (hasActivaColumn) {
        // Si tiene columna activa, validar con ella
        [posicionOrigen] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = $1 AND activa = TRUE",
          [fromPosition]
        );
        [posicionDestino] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = $1 AND activa = TRUE",
          [toPosition]
        );
      } else {
        // Si no tiene columna activa, solo validar que existen
        [posicionOrigen] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = $1",
          [fromPosition]
        );
        [posicionDestino] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = $1",
          [toPosition]
        );
      }

      if (posicionOrigen.length === 0) {
        return res.status(400).json({
          error: `La posición de origen "${fromPosition}" no existe en el sistema. Por favor, ingrese una posición válida.`,
        });
      }

      if (posicionDestino.length === 0) {
        return res.status(400).json({
          error: `La posición de destino "${toPosition}" no existe en el sistema. Por favor, ingrese una posición válida.`,
        });
      }
    } catch (posError) {
      // Si la tabla no existe o hay un error, registrar pero continuar (para compatibilidad)
      console.warn(
        "Error validando posiciones (tabla puede no existir aún):",
        posError.message
      );
      // Continuar sin validación si la tabla no existe
    }

    // Obtener registro de origen (asumimos un producto por ubicación)
    // Verificar si la columna lote existe
    const [columns] = await db.query(
      `SELECT COLUMN_NAME 
       FROM information_schema.columns 
       WHERE table_name = 'stock_ubicaciones' 
       AND column_name = 'lote'`
    );
    const hasLoteColumn = columns.length > 0;

    let query = hasLoteColumn 
      ? "SELECT id, descrip, cantidad, lote FROM stock_ubicaciones WHERE posicion = $1"
      : "SELECT id, descrip, cantidad FROM stock_ubicaciones WHERE posicion = $1";
    
    const [origenRows] = await db.query(query, [fromPosition]);

    if (origenRows.length === 0) {
      return res
        .status(404)
        .json({ error: "No hay stock en la ubicación de origen" });
    }

    const origen = origenRows[0];
    const actualOrigen = parseFloat(origen.cantidad) || 0;

    if (qty > actualOrigen) {
      return res.status(400).json({
        error:
          "La cantidad a mover es mayor que la cantidad en la ubicación de origen",
      });
    }

    const nuevaCantidadOrigen = actualOrigen - qty;

    // Actualizar/borrar origen
    if (nuevaCantidadOrigen > 0) {
      if (hasLoteColumn) {
        await db.query(
          "UPDATE stock_ubicaciones SET cantidad = $1, Usuario = $2, lote = $3 WHERE id = $4 AND posicion = $5",
          [nuevaCantidadOrigen, userName, origen.lote, origen.id, fromPosition]
        );
      } else {
        await db.query(
          "UPDATE stock_ubicaciones SET cantidad = $1, Usuario = $2 WHERE id = $3 AND posicion = $4",
          [nuevaCantidadOrigen, userName, origen.id, fromPosition]
        );
      }
    } else {
      await db.query(
        "DELETE FROM stock_ubicaciones WHERE id = $1 AND posicion = $2",
        [origen.id, fromPosition]
      );
    }

    // Actualizar/crear destino
    const [destRows] = await db.query(
      "SELECT cantidad FROM stock_ubicaciones WHERE id = $1 AND posicion = $2",
      [origen.id, toPosition]
    );

    let totalDestino = qty;

    if (destRows.length > 0) {
      const actualDest = parseFloat(destRows[0].cantidad) || 0;
      totalDestino = actualDest + qty;
      if (hasLoteColumn) {
        await db.query(
          "UPDATE stock_ubicaciones SET cantidad = $1, Usuario = $2, lote = $3 WHERE id = $4 AND posicion = $5",
          [totalDestino, userName, origen.lote, origen.id, toPosition]
        );
      } else {
        await db.query(
          "UPDATE stock_ubicaciones SET cantidad = $1, Usuario = $2 WHERE id = $3 AND posicion = $4",
          [totalDestino, userName, origen.id, toPosition]
        );
      }
    } else {
      if (hasLoteColumn) {
        await db.query(
          "INSERT INTO stock_ubicaciones (id, descrip, cantidad, posicion, Usuario, lote) VALUES ($1, $2, $3, $4, $5, $6)",
          [origen.id, origen.descrip, totalDestino, toPosition, userName, origen.lote]
        );
      } else {
        await db.query(
          "INSERT INTO stock_ubicaciones (id, descrip, cantidad, posicion, Usuario) VALUES ($1, $2, $3, $4, $5)",
          [origen.id, origen.descrip, totalDestino, toPosition, userName]
        );
      }
    }

    res.json({
      message: "Movimiento realizado correctamente",
      fromRestante: nuevaCantidadOrigen,
      toTotal: totalDestino,
    });

    // Registrar movimiento en historial
    await registrarMovimiento(
      origen.id,
      origen.descrip,
      quantity.toString(),
      "Movimiento",
      `${fromPosition} -> ${toPosition}`,
      userName
    );
  } catch (error) {
    console.error("Error moviendo stock:", error);
    res.status(500).json({ error: "Error interno al mover stock" });
  }
});

// Endpoint para ingresar/actualizar stock por ubicación
app.post("/api/stock/ingresa", async (req, res) => {
  try {
    const { code, quantity, position, user, lote } = req.body;

    // Extraer el nombre de usuario si user es un objeto, sino usar el string directamente
    const userName =
      typeof user === "object" && user !== null ? user.usuario : user;

    if (!code || !position || !userName || quantity == null) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Cantidad inválida" });
    }

    // Validar que la posición existe en el sistema
    // Validar que la posición existe en el sistema (Tabla posiciones)
    try {
      const [posiciones] = await db.query(
        "SELECT Posiciones_Eti FROM posiciones WHERE Posiciones_Eti = $1",
        [position]
      );

      if (posiciones.length === 0) {
        return res.status(400).json({
          error: `Error: La posición "${position}" no existe en el sistema.`,
        });
      }
    } catch (posError) {
      console.warn("Error validando posición:", posError.message);
      // Si la tabla no existe, podríamos optar por fallar o dejar pasar.
      // Dado el requerimiento estricto, es mejor informar si hay un error de DB (ej. tabla no existe)
      if (posError.code === "ER_NO_SUCH_TABLE") {
        return res.status(500).json({
          error: "Error de configuración: La tabla 'posiciones' no existe.",
        });
      }
    }

    // Traer descripción desde materiales
    const [materials] = await db.query(
      "SELECT description FROM materiales WHERE id_code = $1",
      [code]
    );

    if (materials.length === 0) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    const descrip = materials[0].description;

    // Ver si ya existe algún registro en esa posición con OTRO código
    const [otrosEnPosicion] = await db.query(
      "SELECT id FROM stock_ubicaciones WHERE posicion = $1 AND id <> $2",
      [position, code]
    );

    if (otrosEnPosicion.length > 0) {
      return res.status(400).json({
        error:
          "La ubicación ya contiene otro material distinto al código ingresado. Use otra ubicación o mueva primero el stock existente.",
      });
    }

    // Ver si ya existe registro para ese código y posición
    const [rows] = await db.query(
      "SELECT cantidad FROM stock_ubicaciones WHERE id = $1 AND posicion = $2",
      [code, position]
    );

    let newQuantity = qty;

    // Verificar si la columna lote existe en la tabla (PostgreSQL syntax)
    const [columns] = await db.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'stock_ubicaciones' 
       AND column_name = 'lote'`
    );
    const hasLoteColumn = columns.length > 0;

    if (rows.length > 0) {
      const actual = parseFloat(rows[0].cantidad) || 0;
      newQuantity = actual + qty;

      if (hasLoteColumn && lote) {
        await db.query(
          "UPDATE stock_ubicaciones SET cantidad = $1, Usuario = $2, lote = $3 WHERE id = $4 AND posicion = $5",
          [newQuantity, userName, lote || null, code, position]
        );
      } else {
        await db.query(
          "UPDATE stock_ubicaciones SET cantidad = $1, Usuario = $2 WHERE id = $3 AND posicion = $4",
          [newQuantity, userName, code, position]
        );
      }
    } else {
      if (hasLoteColumn) {
        await db.query(
          "INSERT INTO stock_ubicaciones (id, descrip, cantidad, posicion, Usuario, lote) VALUES ($1, $2, $3, $4, $5, $6)",
          [code, descrip, newQuantity, position, userName, lote || null]
        );
      } else {
        await db.query(
          "INSERT INTO stock_ubicaciones (id, descrip, cantidad, posicion, Usuario) VALUES ($1, $2, $3, $4, $5)",
          [code, descrip, newQuantity, position, userName]
        );
      }
    }

    // Registrar en historial
    await registrarMovimiento(
      code,
      descrip,
      `+${qty}`,
      "Entro",
      "Almacenado",
      userName
    );

    res.json({
      message: "Stock ingresado correctamente",
      cantidadTotal: newQuantity,
    });
  } catch (error) {
    console.error("Error ingresando stock:", error);
    console.error("Stack trace:", error.stack);
    console.error("Request body:", req.body);
    // Enviar mensaje de error más descriptivo en desarrollo
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? `Error interno al ingresar stock: ${error.message}`
        : "Error interno al ingresar stock";
    res.status(500).json({ error: errorMessage });
  }
});

// Endpoint para consultar stock por ubicación
app.get("/api/stock/ubicacion/:posicion", async (req, res) => {
  try {
    const { posicion } = req.params;
    console.log("=== CONSULTA POR UBICACIÓN ===");
    console.log("Consultando ubicación:", posicion);
    console.log("Longitud de ubicación:", posicion.length);

    if (!posicion) {
      return res.status(400).json({ error: "Ubicación no proporcionada" });
    }

    // Verificar si la columna lote existe
    const [columns] = await db.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'stock_ubicaciones' 
       AND column_name = 'lote'`
    );
    const hasLoteColumn = columns.length > 0;
    console.log("¿Tiene columna lote?", hasLoteColumn);

    let query;
    if (hasLoteColumn) {
      query = `SELECT id, descrip, cantidad, posicion, lote
               FROM stock_ubicaciones
               WHERE posicion = $1`;
    } else {
      query = `SELECT id, descrip, cantidad, posicion
               FROM stock_ubicaciones
               WHERE posicion = $1`;
    }

    console.log("Query ejecutada:", query);
    const [rows] = await db.query(query, [posicion]);
    console.log("Resultados encontrados:", rows.length);
    
    // Para depuración: mostrar todos los datos en la tabla
    const [allRows] = await db.query("SELECT * FROM stock_ubicaciones LIMIT 5");
    console.log("Primeros 5 registros en stock_ubicaciones:", allRows);

    // Devolver 200 con array vacío si no hay resultados, en lugar de 404
    res.json(rows);
  } catch (error) {
    console.error("Error consultando ubicación:", error);
    res.status(500).json({ error: "Error interno al consultar ubicación" });
  }
});

// Endpoint para depurar stock_ubicaciones
app.get("/api/debug-stock", async (req, res) => {
  try {
    console.log("Depurando tabla stock_ubicaciones...");
    
    // Contar total de registros
    const [count] = await db.query("SELECT COUNT(*) as total FROM stock_ubicaciones");
    console.log("Total registros:", count[0].total);
    
    // Mostrar todos los registros
    const [all] = await db.query("SELECT * FROM stock_ubicaciones ORDER BY posicion");
    console.log("Registros encontrados:", all.length);
    
    // Mostrar posiciones únicas
    const [positions] = await db.query(`
      SELECT DISTINCT posicion, COUNT(*) as count 
      FROM stock_ubicaciones 
      WHERE posicion IS NOT NULL 
      GROUP BY posicion 
      ORDER BY posicion
    `);
    console.log("Posiciones únicas:", positions.length);
    
    res.json({ 
      total_registros: count[0].total,
      posiciones_unicas: positions.length,
      detalles_posiciones: positions,
      todos_los_registros: all
    });
  } catch (error) {
    console.error("Error al depurar stock:", error);
    res.status(500).json({ error: "Error al depurar stock" });
  }
});

// Endpoint para sincronizar ubicaciones desde stock_ubicaciones
app.get("/api/sync-ubicaciones", async (req, res) => {
  try {
    console.log("Sincronizando ubicaciones desde stock_ubicaciones...");
    
    // Obtener todas las posiciones únicas de stock_ubicaciones
    const [positions] = await db.query(`
      SELECT DISTINCT posicion 
      FROM stock_ubicaciones 
      WHERE posicion IS NOT NULL 
      AND posicion ~ '^LR-\d{2}-\d{2}$'
      ORDER BY posicion
    `);
    
    console.log("Posiciones encontradas en stock_ubicaciones:", positions.length);
    
    let synced = 0;
    for (const pos of positions) {
      // Verificar si ya existe en ubicaciones
      const [exists] = await db.query(
        "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = $1",
        [pos.posicion]
      );
      
      if (exists.length === 0) {
        // Insertar si no existe
        await db.query(
          "INSERT INTO ubicaciones (ubicaciones, descripcion, activa) VALUES ($1, $2, TRUE)",
          [pos.posicion, `Ubicación ${pos.posicion}`]
        );
        synced++;
        console.log(`Insertada ubicación: ${pos.posicion}`);
      }
    }
    
    res.json({ 
      message: `Sincronización completada. ${synced} nuevas ubicaciones agregadas.`,
      total_positions: positions.length,
      new_positions: synced
    });
  } catch (error) {
    console.error("Error al sincronizar ubicaciones:", error);
    res.status(500).json({ error: "Error al sincronizar ubicaciones" });
  }
});

// Endpoint temporal para limpiar ubicaciones "mochas"
app.get("/api/cleanup-mocha-locations", async (req, res) => {
  try {
    console.log('Limpiando ubicaciones "mochas" de stock_ubicaciones...');
    
    // Eliminar registros con posicion que no tenga formato LR-XX-XX exacto
    const [result] = await db.query(`
      DELETE FROM stock_ubicaciones 
      WHERE posicion !~ '^LR-\d{2}-\d{2}$'
    `);
    
    console.log(`Eliminados ${result.rowCount} registros con ubicaciones inválidas`);
    
    // Mostrar las ubicaciones que quedan
    const [remaining] = await db.query(`
      SELECT DISTINCT posicion FROM stock_ubicaciones 
      ORDER BY posicion
    `);
    
    console.log('Ubicaciones restantes:', remaining.map(r => r.posicion));
    
    res.json({ 
      message: `Limpieza completada. Eliminados ${result.rowCount} registros inválidos.`,
      remaining: remaining.map(r => r.posicion)
    });
  } catch (error) {
    console.error("Error al limpiar ubicaciones:", error);
    res.status(500).json({ error: "Error al limpiar ubicaciones" });
  }
});

// Endpoint para consultar TODO el stock positivo
app.get("/api/stock/all", async (req, res) => {
  try {
    // Verificar si la columna lote existe
    const [columns] = await db.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'stock_ubicaciones' 
       AND column_name = 'lote'`
    );
    const hasLoteColumn = columns.length > 0;

    let query;
    if (hasLoteColumn) {
      query = `SELECT id, descrip, cantidad, posicion, lote
               FROM stock_ubicaciones
               WHERE cantidad > 0
               ORDER BY id, posicion`;
    } else {
      query = `SELECT id, descrip, cantidad, posicion
               FROM stock_ubicaciones
               WHERE cantidad > 0
               ORDER BY id, posicion`;
    }

    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error consultando todo el stock:", error);
    res.status(500).json({ error: "Error interno al consultar stock" });
  }
});

// Endpoint para retirar stock (Picking)
app.post("/api/stock/retirar", async (req, res) => {
  try {
    const { code, position, quantity, user } = req.body;
    console.log("=== RETIRO DE STOCK ===");
    console.log("Datos recibidos:", { code, position, quantity, user });

    // Extraer el nombre de usuario si user es un objeto, sino usar el string directamente
    const userName =
      typeof user === "object" && user !== null ? user.usuario : user;

    if (!code || !position || !userName || quantity == null) {
      console.log("Error: Datos incompletos");
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      console.log("Error: Cantidad inválida:", quantity);
      return res.status(400).json({ error: "Cantidad inválida" });
    }

    // Validar que la posición existe en el sistema
    try {
      // Verificar si la columna 'activa' existe en la tabla ubicaciones (PostgreSQL syntax)
      const [columns] = await db.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'ubicaciones' 
         AND column_name = 'activa'`
      );
      const hasActivaColumn = columns.length > 0;
      console.log("¿Tabla ubicaciones tiene columna activa?", hasActivaColumn);

      let ubicaciones;
      if (hasActivaColumn) {
        // Si tiene columna activa, validar con ella
        [ubicaciones] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = $1 AND activa = TRUE",
          [position]
        );
      } else {
        // Si no tiene columna activa, solo validar que existe
        [ubicaciones] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = $1",
          [position]
        );
      }

      console.log("Ubicaciones encontradas para", position, ":", ubicaciones.length);
      
      // Si no hay ubicaciones en la tabla, desactivar validación
      if (ubicaciones.length === 0) {
        // Verificar si la tabla está completamente vacía
        const [totalCount] = await db.query("SELECT COUNT(*) as count FROM ubicaciones");
        console.log("Total ubicaciones en tabla:", totalCount[0].count);
        
        if (totalCount[0].count === 0) {
          console.log("Tabla ubicaciones vacía - desactivando validación");
          // Continuar sin validación si la tabla está vacía
        } else {
          console.log("Error: Posición no encontrada en tabla ubicaciones");
          return res.status(400).json({
            error: `La posición "${position}" no existe en el sistema. Por favor, ingrese una posición válida.`,
          });
        }
      }
    } catch (posError) {
      // Si la tabla no existe o hay un error, registrar pero continuar (para compatibilidad)
      console.warn(
        "Error validando posición (tabla puede no existir aún):",
        posError.message
      );
      // Continuar sin validación si la tabla no existe
    }

    // Verificar stock actual y obtener descripción
    const [rows] = await db.query(
      "SELECT cantidad, descrip FROM stock_ubicaciones WHERE id = $1 AND posicion = $2",
      [code, position]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontró el stock especificado" });
    }

    const actual = parseFloat(rows[0].cantidad);

    if (qty > actual) {
      return res
        .status(400)
        .json({ error: "La cantidad a retirar excede el stock disponible" });
    }

    const nuevaCantidad = actual - qty;

    if (nuevaCantidad > 0) {
      await db.query(
        "UPDATE stock_ubicaciones SET cantidad = $1, Usuario = $2 WHERE id = $3 AND posicion = $4",
        [nuevaCantidad, userName, code, position]
      );
    } else {
      await db.query(
        "DELETE FROM stock_ubicaciones WHERE id = $1 AND posicion = $2",
        [code, position]
      );
    }

    // Registrar movimiento en historial
    // Intentar obtener descripción de la tabla materiales si no está en stock_ubicaciones
    let descrip = rows[0].descrip;

    if (!descrip || descrip === "Sin descripción") {
      try {
        const [matRows] = await db.query(
          "SELECT description FROM materiales WHERE id_code = $1",
          [code]
        );
        if (matRows.length > 0) {
          descrip = matRows[0].description;
        }
      } catch (err) {
        console.error("Error buscando descripción en materiales:", err);
      }
    }

    await registrarMovimiento(
      code,
      descrip || "Sin descripción",
      `-${qty}`,
      "Salio",
      "Despachado",
      userName
    );

    res.json({
      message: "Retiro exitoso",
      cantidadRestante: nuevaCantidad,
    });
  } catch (error) {}
});

// Endpoint para buscar material por código
app.get("/api/materials/:code", async (req, res) => {
  try {
    const { code } = req.params;
    // La tabla se llama 'materiales' y las columnas son 'id_code', 'description', 'unit', 'type'
    const [rows] = await db.query(
      "SELECT * FROM materiales WHERE id_code = $1",
      [code]
    );

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: "Material no encontrado" });
    }
  } catch (error) {
    console.error("Error buscando material:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Inicializar base de datos
const initDB = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS pallets (
        id SERIAL PRIMARY KEY,
        unique_id VARCHAR(20) UNIQUE,
        code VARCHAR(50),
        description VARCHAR(255),
        batch_code VARCHAR(50),
        manuf_date DATE,
        expiry_date DATE,
        quantity DECIMAL(10, 2),
        unit VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla "pallets" verificada/creada');

    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_ubicaciones (
        id VARCHAR(50) NOT NULL,
        descrip VARCHAR(255) NOT NULL,
        cantidad DECIMAL(10, 2) NOT NULL DEFAULT 0,
        posicion VARCHAR(100) NOT NULL,
        Usuario VARCHAR(100) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, posicion)
      )
    `);
    console.log('Tabla "stock_ubicaciones" verificada/creada');

    await db.query(`
      CREATE TABLE IF NOT EXISTS historial_movimientos (
        id SERIAL PRIMARY KEY,
        Id_codigo VARCHAR(50),
        Descripcion VARCHAR(255),
        Movimiento VARCHAR(50),
        Unit VARCHAR(20),
        T_movimi VARCHAR(100),
        Usuario VARCHAR(100),
        Turno VARCHAR(50),
        Fecha VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla "historial_movimientos" verificada/creada');

    await db.query(`
      CREATE TABLE IF NOT EXISTS recibos_planta (
        id SERIAL PRIMARY KEY,
        planta VARCHAR(100),
        codigo VARCHAR(50),
        descripcion VARCHAR(255),
        lote VARCHAR(50),
        n_pallet VARCHAR(20),
        ubicacion VARCHAR(100),
        usuario VARCHAR(100),
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla "recibos_planta" verificada/creada');

    // Verificar e insertar ubicación GROUND
    try {
      // Crear tabla ubicaciones si no existe
      await db.query(`
        CREATE TABLE IF NOT EXISTS ubicaciones (
          ubicaciones VARCHAR(50) PRIMARY KEY,
          descripcion TEXT,
          activa BOOLEAN DEFAULT TRUE
        )
      `);
      console.log('Tabla "ubicaciones" creada/verificada');

      // Insertar GROUND si no existe
      const [ground] = await db.query(
        "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = 'GROUND'"
      );
      if (ground.length === 0) {
        await db.query(
          "INSERT INTO ubicaciones (ubicaciones, descripcion, activa) VALUES ('GROUND', 'Ubicación de Recepción', TRUE)"
        );
        console.log("Ubicación 'GROUND' creada automáticamente");
      }
    } catch (err) {
      console.warn("No se pudo verificar/crear ubicación GROUND:", err.message);
    }

    // Verificar que la tabla ubicaciones existe (el usuario la crea manualmente)
    try {
      const [tables] = await db.query(
        `SELECT table_name 
         FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'ubicaciones'`
      );

      if (tables.length > 0) {
        console.log('Tabla "ubicaciones" encontrada');
      } else {
        console.log(
          '⚠️  Tabla "ubicaciones" no encontrada. Asegúrate de crearla con la columna "ubicaciones"'
        );
      }
    } catch (error) {
      console.warn("No se pudo verificar la tabla ubicaciones:", error.message);
    }
  } catch (error) {
    console.error("Error inicializando DB:", error);
  }
};

initDB();

// ==================== ENDPOINTS RECIBOS PLANTA ====================

// Guardar un nuevo recibo
app.post("/api/recibos", async (req, res) => {
  try {
    const { planta, codigo, descripcion, lote, n_pallet, ubicacion, usuario } =
      req.body;

    if (!codigo || !ubicacion) {
      return res
        .status(400)
        .json({ error: "Código y ubicación son obligatorios" });
    }

    await db.query(
      `INSERT INTO recibos_planta (planta, codigo, descripcion, lote, n_pallet, ubicacion, usuario)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [planta, codigo, descripcion, lote, n_pallet, ubicacion, usuario]
    );

    res.json({ message: "Recibo guardado correctamente" });
  } catch (error) {
    console.error("Error guardando recibo:", error);
    res.status(500).json({ error: "Error al guardar el recibo" });
  }
});

// Obtener historial de recibos
app.get("/api/recibos", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM recibos_planta ORDER BY fecha DESC LIMIT 100"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo recibos:", error);
    res.status(500).json({ error: "Error obteniendo historial de recibos" });
  }
});

// ==================== ENDPOINTS DE GESTIÓN DE UBICACIONES ====================

// Validar si una ubicación existe
app.get("/api/ubicaciones/validar/:ubicacion", async (req, res) => {
  try {
    const { ubicacion } = req.params;
    
    if (!ubicacion || ubicacion.trim() === "") {
      return res.status(400).json({ error: "Ubicación es requerida" });
    }

    const ubicacionTrim = ubicacion.trim();
    
    // Por ahora, permitir cualquier ubicación ya que la tabla posiciones no existe en producción
    console.log("Permitiendo ubicación (tabla posiciones no existe):", ubicacionTrim);
    res.status(200).json({ exists: true, ubicacion: ubicacionTrim });
    
  } catch (error) {
    console.error("Error general validando ubicación:", error);
    res.status(500).json({ error: "Error interno al validar ubicación" });
  }
});

// Listar todas las ubicaciones
app.get("/api/ubicaciones", async (req, res) => {
  try {
    // Por ahora, como la tabla no existe, retornar array vacío o datos simulados
    res.json([]);
  } catch (error) {
    console.error("Error listando ubicaciones:", error);
    res.status(500).json({ error: "Error interno al listar ubicaciones" });
  }
});

// Obtener una ubicación específica
app.get("/api/ubicaciones/:ubicacion", async (req, res) => {
  try {
    const { ubicacion } = req.params;
    
    // Por ahora, como la tabla no existe, retornar un objeto simulado
    res.json({
      Posiciones_Eti: ubicacion,
      descripcion: `Ubicación ${ubicacion}`,
      activa: true
    });
  } catch (error) {
    console.error("Error obteniendo ubicación:", error);
    res.status(500).json({ error: "Error interno al obtener ubicación" });
  }
});

// Crear una nueva ubicación
app.post("/api/ubicaciones", async (req, res) => {
  try {
    const { ubicaciones, descripcion, activa } = req.body;

    if (!ubicaciones || !ubicaciones.trim()) {
      return res
        .status(400)
        .json({ error: "El código de ubicación es requerido" });
    }

    // Verificar si ya existe
    const [existing] = await db.query(
      "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = $1",
      [ubicaciones.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "La ubicación ya existe" });
    }

    // Verificar si la columna activa existe
    const [columns] = await db.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = 'public' 
       AND TABLE_NAME = 'ubicaciones' 
       AND COLUMN_NAME = 'activa'`
    );
    const hasActivaColumn = columns.length > 0;

    if (hasActivaColumn) {
      await db.query(
        "INSERT INTO ubicaciones (ubicaciones, descripcion, activa) VALUES ($1, $2, $3)",
        [
          ubicaciones.trim(),
          descripcion || null,
          activa !== undefined ? activa : true,
        ]
      );
    } else {
      await db.query(
        "INSERT INTO ubicaciones (ubicaciones, descripcion) VALUES ($1, $2)",
        [ubicaciones.trim(), descripcion || null]
      );
    }

    res.json({
      message: "Ubicación creada exitosamente",
      ubicaciones: ubicaciones.trim(),
    });
  } catch (error) {
    console.error("Error creando ubicación:", error);
    res.status(500).json({ error: "Error interno al crear ubicación" });
  }
});

// Actualizar una ubicación
app.put("/api/ubicaciones/:ubicacion", async (req, res) => {
  try {
    const { ubicacion } = req.params;
    const { descripcion, activa } = req.body;

    // Verificar si existe
    const [existing] = await db.query(
      "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = $1",
      [ubicacion]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Ubicación no encontrada" });
    }

    // Verificar si la columna activa existe
    const [columns] = await db.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = 'public' 
       AND TABLE_NAME = 'ubicaciones' 
       AND COLUMN_NAME = 'activa'`
    );
    const hasActivaColumn = columns.length > 0;

    if (hasActivaColumn) {
      await db.query(
        "UPDATE ubicaciones SET descripcion = $1, activa = $2 WHERE ubicaciones = $3",
        [descripcion || null, activa !== undefined ? activa : true, ubicacion]
      );
    } else {
      await db.query(
        "UPDATE ubicaciones SET descripcion = $1 WHERE ubicaciones = $2",
        [descripcion || null, ubicacion]
      );
    }

    res.json({
      message: "Ubicación actualizada exitosamente",
      ubicaciones: ubicacion,
    });
  } catch (error) {
    console.error("Error actualizando ubicación:", error);
    res.status(500).json({ error: "Error interno al actualizar ubicación" });
  }
});

// Eliminar una ubicación (soft delete - desactivar)
app.delete("/api/ubicaciones/:ubicacion", async (req, res) => {
  try {
    const { ubicacion } = req.params;

    // Verificar si existe
    const [existing] = await db.query(
      "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = $1",
      [ubicacion]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Ubicación no encontrada" });
    }

    // Verificar si hay stock en esta ubicación
    const [stock] = await db.query(
      "SELECT COUNT(*) as count FROM stock_ubicaciones WHERE posicion = $1",
      [ubicacion]
    );

    // Verificar si la columna activa existe
    const [columns] = await db.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = 'public' 
       AND TABLE_NAME = 'ubicaciones' 
       AND COLUMN_NAME = 'activa'`
    );
    const hasActivaColumn = columns.length > 0;

    if (stock[0].count > 0 && hasActivaColumn) {
      // Si hay stock y tiene columna activa, solo desactivar
      await db.query(
        "UPDATE ubicaciones SET activa = FALSE WHERE ubicaciones = $1",
        [ubicacion]
      );
      res.json({
        message: "Ubicación desactivada (hay stock asociado)",
        ubicaciones: ubicacion,
      });
    } else {
      // Si no hay stock o no tiene columna activa, eliminar completamente
      await db.query("DELETE FROM ubicaciones WHERE ubicaciones = $1", [
        ubicacion,
      ]);
      res.json({
        message: "Ubicación eliminada exitosamente",
        ubicaciones: ubicacion,
      });
    }
  } catch (error) {
    console.error("Error eliminando ubicación:", error);
    res.status(500).json({ error: "Error interno al eliminar ubicación" });
  }
});

// Endpoint para crear pallets (generar IDs únicos) SIN guardar en BD
app.post("/api/pallets", async (req, res) => {
  try {
    const {
      code,
      descrip,
      batchCode,
      manufDate,
      expiryDate,
      quantity,
      udm,
      numberLabels,
    } = req.body;

    if (!numberLabels || parseInt(numberLabels) <= 0) {
      return res
        .status(400)
        .json({ error: "numberLabels debe ser un número válido mayor a 0" });
    }

    const count = parseInt(numberLabels);
    const createdUniqueIds = [];

    // Obtener el último unique_id desde la tabla SOLO para mantener la secuencia
    const [lastRecord] = await db.query(
      "SELECT unique_id FROM pallets ORDER BY id DESC LIMIT 1"
    );

    let nextNumber = 1;
    if (lastRecord.length > 0 && lastRecord[0].unique_id) {
      // Extraer el número del formato UID:XXX
      const lastUid = lastRecord[0].unique_id;
      const match = lastUid.match(/UID:(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Generar IDs únicos SIN guardar en la base de datos
    for (let i = 0; i < count; i++) {
      const uniqueId = `UID:${String(nextNumber).padStart(3, "0")}`;
      createdUniqueIds.push(uniqueId);
      nextNumber++;
    }

    console.log(
      `Generados ${createdUniqueIds.length} IDs únicos para código ${code}`
    );
    res.json({ ids: createdUniqueIds });
  } catch (error) {
    console.error("Error generando IDs únicos:", error);
    res.status(500).json({ error: "Error generando etiquetas" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
