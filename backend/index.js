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
      "SELECT * FROM usuarios WHERE usuario = ? AND contraseña = ?",
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
      "SELECT unit FROM materiales WHERE id_code = ?",
      [code]
    );
    const unit = rows.length > 0 ? rows[0].unit : "UND";

    await db.query(
      `INSERT INTO historial_movimientos 
      (Id_codigo, Descripcion, Movimiento, Unit, T_movimi, Estado, Usuario, Turno, Fecha) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      SELECT Id_codigo, Descripcion, Movimiento, Unit, T_movimi, Estado, Usuario, Turno, Fecha
      FROM historial_movimientos
      WHERE Id_codigo = ?
    `;

    const params = [codigo];

    // Agregar filtro por tipo si se proporciona
    if (tipo && ["Entro", "Salio", "Movimiento"].includes(tipo)) {
      query += " AND T_movimi = ?";
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
      "SELECT * FROM materiales WHERE id_code = ?",
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
      return res.status(400).json({ error: "Código y descripción son requeridos" });
    }

    // Verificar si ya existe
    const [existing] = await db.query(
      "SELECT id_code FROM materiales WHERE id_code = ?",
      [id_code]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Ya existe un material con ese código" });
    }

    // Insertar nuevo material
    const [result] = await db.query(
      "INSERT INTO materiales (id_code, description, unit, type) VALUES (?, ?, ?, ?)",
      [id_code, description, unit || 'UNIDADES', type || 'PRODUCTO']
    );

    res.status(201).json({
      message: "Material creado exitosamente",
      id: result.insertId,
      id_code,
      description,
      unit,
      type
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
      "SELECT id_code FROM materiales WHERE id_code = ?",
      [code]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    // Actualizar material
    await db.query(
      "UPDATE materiales SET description = ?, unit = ?, type = ? WHERE id_code = ?",
      [description, unit || 'UNIDADES', type || 'PRODUCTO', code]
    );

    res.json({
      message: "Material actualizado exitosamente",
      id_code: code,
      description,
      unit,
      type
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
      "SELECT id_code FROM materiales WHERE id_code = ?",
      [code]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    // Verificar si tiene stock asociado
    const [stockCheck] = await db.query(
      "SELECT COUNT(*) as count FROM stock_ubicaciones WHERE id = ?",
      [code]
    );

    if (stockCheck[0].count > 0) {
      return res.status(400).json({ 
        error: "No se puede eliminar el material porque tiene stock asociado" 
      });
    }

    // Eliminar material
    await db.query("DELETE FROM materiales WHERE id_code = ?", [code]);

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
       WHERE id = ?
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
    const userName = typeof user === 'object' && user !== null ? user.usuario : user;

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
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'ubicaciones' 
         AND COLUMN_NAME = 'activa'`
      );
      const hasActivaColumn = columns.length > 0;

      let posicionOrigen, posicionDestino;
      if (hasActivaColumn) {
        // Si tiene columna activa, validar con ella
        [posicionOrigen] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = ? AND activa = TRUE",
          [fromPosition]
        );
        [posicionDestino] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = ? AND activa = TRUE",
          [toPosition]
        );
      } else {
        // Si no tiene columna activa, solo validar que existen
        [posicionOrigen] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = ?",
          [fromPosition]
        );
        [posicionDestino] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = ?",
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
      console.warn("Error validando posiciones (tabla puede no existir aún):", posError.message);
      // Continuar sin validación si la tabla no existe
    }

    // Obtener registro de origen (asumimos un producto por ubicación)
    const [origenRows] = await db.query(
      "SELECT id, descrip, cantidad FROM stock_ubicaciones WHERE posicion = ?",
      [fromPosition]
    );

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
      await db.query(
        "UPDATE stock_ubicaciones SET cantidad = ?, Usuario = ? WHERE id = ? AND posicion = ?",
        [nuevaCantidadOrigen, userName, origen.id, fromPosition]
      );
    } else {
      await db.query(
        "DELETE FROM stock_ubicaciones WHERE id = ? AND posicion = ?",
        [origen.id, fromPosition]
      );
    }

    // Actualizar/crear destino
    const [destRows] = await db.query(
      "SELECT cantidad FROM stock_ubicaciones WHERE id = ? AND posicion = ?",
      [origen.id, toPosition]
    );

    let totalDestino = qty;

    if (destRows.length > 0) {
      const actualDest = parseFloat(destRows[0].cantidad) || 0;
      totalDestino = actualDest + qty;
      await db.query(
        "UPDATE stock_ubicaciones SET cantidad = ?, Usuario = ? WHERE id = ? AND posicion = ?",
        [totalDestino, userName, origen.id, toPosition]
      );
    } else {
      await db.query(
        "INSERT INTO stock_ubicaciones (id, descrip, cantidad, posicion, Usuario) VALUES (?, ?, ?, ?, ?)",
        [origen.id, origen.descrip, totalDestino, toPosition, userName]
      );
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
    const userName = typeof user === 'object' && user !== null ? user.usuario : user;

    if (!code || !position || !userName || quantity == null) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Cantidad inválida" });
    }

    // Validar que la posición existe en el sistema
    try {
      // Verificar si la columna 'activa' existe en la tabla ubicaciones
      const [columns] = await db.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'ubicaciones' 
         AND COLUMN_NAME = 'activa'`
      );
      const hasActivaColumn = columns.length > 0;

      let ubicaciones;
      if (hasActivaColumn) {
        // Si tiene columna activa, validar con ella
        [ubicaciones] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = ? AND activa = TRUE",
          [position]
        );
      } else {
        // Si no tiene columna activa, solo validar que existe
        [ubicaciones] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = ?",
          [position]
        );
      }

      if (ubicaciones.length === 0) {
        return res.status(400).json({
          error: `La posición "${position}" no existe en el sistema. Por favor, ingrese una posición válida.`,
        });
      }
    } catch (posError) {
      // Si la tabla no existe o hay un error, registrar pero continuar (para compatibilidad)
      console.warn("Error validando posición (tabla puede no existir aún):", posError.message);
      // Continuar sin validación si la tabla no existe
    }

    // Traer descripción desde materiales
    const [materials] = await db.query(
      "SELECT description FROM materiales WHERE id_code = ?",
      [code]
    );

    if (materials.length === 0) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    const descrip = materials[0].description;

    // Ver si ya existe algún registro en esa posición con OTRO código
    const [otrosEnPosicion] = await db.query(
      "SELECT id FROM stock_ubicaciones WHERE posicion = ? AND id <> ?",
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
      "SELECT cantidad FROM stock_ubicaciones WHERE id = ? AND posicion = ?",
      [code, position]
    );

    let newQuantity = qty;

    // Verificar si la columna lote existe en la tabla
    const [columns] = await db.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'stock_ubicaciones' 
       AND COLUMN_NAME = 'lote'`
    );
    const hasLoteColumn = columns.length > 0;

    if (rows.length > 0) {
      const actual = parseFloat(rows[0].cantidad) || 0;
      newQuantity = actual + qty;

      if (hasLoteColumn && lote) {
        await db.query(
          "UPDATE stock_ubicaciones SET cantidad = ?, Usuario = ?, lote = ? WHERE id = ? AND posicion = ?",
          [newQuantity, userName, lote || null, code, position]
        );
      } else {
        await db.query(
          "UPDATE stock_ubicaciones SET cantidad = ?, Usuario = ? WHERE id = ? AND posicion = ?",
          [newQuantity, userName, code, position]
        );
      }
    } else {
      if (hasLoteColumn) {
        await db.query(
          "INSERT INTO stock_ubicaciones (id, descrip, cantidad, posicion, Usuario, lote) VALUES (?, ?, ?, ?, ?, ?)",
          [code, descrip, newQuantity, position, userName, lote || null]
        );
      } else {
        await db.query(
          "INSERT INTO stock_ubicaciones (id, descrip, cantidad, posicion, Usuario) VALUES (?, ?, ?, ?, ?)",
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
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error interno al ingresar stock: ${error.message}` 
      : "Error interno al ingresar stock";
    res.status(500).json({ error: errorMessage });
  }
});

// Endpoint para consultar stock por ubicación
app.get("/api/stock/ubicacion/:posicion", async (req, res) => {
  try {
    const { posicion } = req.params;

    if (!posicion) {
      return res.status(400).json({ error: "Ubicación no proporcionada" });
    }

    const [rows] = await db.query(
      `SELECT id, descrip, cantidad, posicion
       FROM stock_ubicaciones
       WHERE posicion = ?`,
      [posicion]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No hay stock en esta ubicación" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error consultando ubicación:", error);
    res.status(500).json({ error: "Error interno al consultar ubicación" });
  }
});

// Endpoint para retirar stock (Picking)
app.post("/api/stock/retirar", async (req, res) => {
  try {
    const { code, position, quantity, user } = req.body;

    // Extraer el nombre de usuario si user es un objeto, sino usar el string directamente
    const userName = typeof user === 'object' && user !== null ? user.usuario : user;

    if (!code || !position || !userName || quantity == null) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Cantidad inválida" });
    }

    // Validar que la posición existe en el sistema
    try {
      // Verificar si la columna 'activa' existe en la tabla ubicaciones
      const [columns] = await db.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'ubicaciones' 
         AND COLUMN_NAME = 'activa'`
      );
      const hasActivaColumn = columns.length > 0;

      let ubicaciones;
      if (hasActivaColumn) {
        // Si tiene columna activa, validar con ella
        [ubicaciones] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = ? AND activa = TRUE",
          [position]
        );
      } else {
        // Si no tiene columna activa, solo validar que existe
        [ubicaciones] = await db.query(
          "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = ?",
          [position]
        );
      }

      if (ubicaciones.length === 0) {
        return res.status(400).json({
          error: `La posición "${position}" no existe en el sistema. Por favor, ingrese una posición válida.`,
        });
      }
    } catch (posError) {
      // Si la tabla no existe o hay un error, registrar pero continuar (para compatibilidad)
      console.warn("Error validando posición (tabla puede no existir aún):", posError.message);
      // Continuar sin validación si la tabla no existe
    }

    // Verificar stock actual
    const [rows] = await db.query(
      "SELECT cantidad FROM stock_ubicaciones WHERE id = ? AND posicion = ?",
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
        "UPDATE stock_ubicaciones SET cantidad = ?, Usuario = ? WHERE id = ? AND posicion = ?",
        [nuevaCantidad, userName, code, position]
      );
    } else {
      await db.query(
        "DELETE FROM stock_ubicaciones WHERE id = ? AND posicion = ?",
        [code, position]
      );
    }

    res.json({
      message: "Retiro exitoso",
      cantidadRestante: nuevaCantidad,
    });

    // Registrar movimiento en historial
    const descrip = rows[0].descrip || "Sin descripción";

    await registrarMovimiento(
      code,
      descrip,
      `-${qty}`,
      "Salio",
      "Despachado",
      userName
    );
  } catch (error) {
  }
});

// Endpoint para buscar material por código
app.get("/api/materials/:code", async (req, res) => {
  try {
    const { code } = req.params;
    // La tabla se llama 'materiales' y las columnas son 'id_code', 'description', 'unit', 'type'
    const [rows] = await db.query(
      "SELECT * FROM materiales WHERE id_code = ?",
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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    // Verificar que la tabla ubicaciones existe (el usuario la crea manualmente)
    try {
      const [tables] = await db.query(
        `SELECT name 
         FROM sqlite_master 
         WHERE type='table' 
         AND name='ubicaciones'`
      );
      
      if (tables.length > 0) {
        console.log('Tabla "ubicaciones" encontrada');
      } else {
        console.log('⚠️  Tabla "ubicaciones" no encontrada. Asegúrate de crearla con la columna "ubicaciones"');
      }
    } catch (error) {
      console.warn('No se pudo verificar la tabla ubicaciones:', error.message);
    }
  } catch (error) {
    console.error("Error inicializando DB:", error);
  }
};

initDB();

// ==================== ENDPOINTS DE GESTIÓN DE UBICACIONES ====================

// Listar todas las ubicaciones
app.get("/api/ubicaciones", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM ubicaciones ORDER BY ubicaciones ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error listando ubicaciones:", error);
    res.status(500).json({ error: "Error interno al listar ubicaciones" });
  }
});

// Obtener una ubicación específica
app.get("/api/ubicaciones/:ubicacion", async (req, res) => {
  try {
    const { ubicacion } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM ubicaciones WHERE ubicaciones = ?",
      [ubicacion]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Ubicación no encontrada" });
    }

    res.json(rows[0]);
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
      return res.status(400).json({ error: "El código de ubicación es requerido" });
    }

    // Verificar si ya existe
    const [existing] = await db.query(
      "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = ?",
      [ubicaciones.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "La ubicación ya existe" });
    }

    // Verificar si la columna activa existe
    const [columns] = await db.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'ubicaciones' 
       AND COLUMN_NAME = 'activa'`
    );
    const hasActivaColumn = columns.length > 0;

    if (hasActivaColumn) {
      await db.query(
        "INSERT INTO ubicaciones (ubicaciones, descripcion, activa) VALUES (?, ?, ?)",
        [ubicaciones.trim(), descripcion || null, activa !== undefined ? activa : true]
      );
    } else {
      await db.query(
        "INSERT INTO ubicaciones (ubicaciones, descripcion) VALUES (?, ?)",
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
      "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = ?",
      [ubicacion]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Ubicación no encontrada" });
    }

    // Verificar si la columna activa existe
    const [columns] = await db.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'ubicaciones' 
       AND COLUMN_NAME = 'activa'`
    );
    const hasActivaColumn = columns.length > 0;

    if (hasActivaColumn) {
      await db.query(
        "UPDATE ubicaciones SET descripcion = ?, activa = ? WHERE ubicaciones = ?",
        [descripcion || null, activa !== undefined ? activa : true, ubicacion]
      );
    } else {
      await db.query(
        "UPDATE ubicaciones SET descripcion = ? WHERE ubicaciones = ?",
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
      "SELECT ubicaciones FROM ubicaciones WHERE ubicaciones = ?",
      [ubicacion]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Ubicación no encontrada" });
    }

    // Verificar si hay stock en esta ubicación
    const [stock] = await db.query(
      "SELECT COUNT(*) as count FROM stock_ubicaciones WHERE posicion = ?",
      [ubicacion]
    );

    // Verificar si la columna activa existe
    const [columns] = await db.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'ubicaciones' 
       AND COLUMN_NAME = 'activa'`
    );
    const hasActivaColumn = columns.length > 0;

    if (stock[0].count > 0 && hasActivaColumn) {
      // Si hay stock y tiene columna activa, solo desactivar
      await db.query(
        "UPDATE ubicaciones SET activa = FALSE WHERE ubicaciones = ?",
        [ubicacion]
      );
      res.json({
        message: "Ubicación desactivada (hay stock asociado)",
        ubicaciones: ubicacion,
      });
    } else {
      // Si no hay stock o no tiene columna activa, eliminar completamente
      await db.query("DELETE FROM ubicaciones WHERE ubicaciones = ?", [ubicacion]);
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
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

    res.json({ ids: createdUniqueIds });
  } catch (error) {
    console.error("Error generando IDs únicos:", error);
    res.status(500).json({ error: "Error generando etiquetas" });
  }
});
