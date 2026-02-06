-- ==========================================================
-- SCRIPT DE RECREACIÓN DE BASE DE DATOS (POSTGRESQL - NEON.TECH)
-- ==========================================================

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    documento TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT,
    edad INTEGER,
    empresa_contratista TEXT,
    usuario TEXT UNIQUE NOT NULL,
    contraseña TEXT NOT NULL,
    tipo_usuario TEXT NOT NULL, -- 'bodega', 'administrativo', 'administrador'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Posiciones/Ubicaciones
CREATE TABLE IF NOT EXISTS posiciones (
    Posiciones_Eti TEXT PRIMARY KEY,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Materiales (Maestro de productos)
CREATE TABLE IF NOT EXISTS materiales (
    id_code TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    unit TEXT DEFAULT 'UNIDADES',
    type TEXT DEFAULT 'PRODUCTO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Stock por Ubicación (Inventario Principal)
CREATE TABLE IF NOT EXISTS stock_ubicaciones (
    id TEXT NOT NULL,
    descrip TEXT,
    cantidad NUMERIC DEFAULT 0,
    posicion TEXT NOT NULL,
    Usuario TEXT,
    lote TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, posicion)
);

-- 5. Tabla de Historial de Movimientos (Auditoría)
CREATE TABLE IF NOT EXISTS historial_movimientos (
    id SERIAL PRIMARY KEY,
    Id_codigo TEXT,
    Descripcion TEXT,
    Movimiento TEXT, -- Cantidad movida
    Unit TEXT,
    T_movimi TEXT, -- 'Entro', 'Salio', 'Movimiento'
    Estado TEXT,
    Usuario TEXT,
    Turno TEXT,
    Fecha TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Pallets Recibidos (Específica para zona GROUND)
CREATE TABLE IF NOT EXISTS pallets_ground (
    id SERIAL PRIMARY KEY,
    codigo_interno TEXT,
    codigo TEXT,
    numero_pallet TEXT,
    lote TEXT,
    peso TEXT,
    planta TEXT,
    turno INTEGER,
    kg INTEGER,
    ubicacion TEXT DEFAULT 'GROUND',
    usuario TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Stock en GROUND (Para soporte de múltiples lotes/pallets)
CREATE TABLE IF NOT EXISTS stock_ground (
    id TEXT,
    descrip TEXT,
    cantidad NUMERIC,
    posicion TEXT,
    Usuario TEXT,
    lote TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de Ubicaciones (Complementaria para validaciones)
CREATE TABLE IF NOT EXISTS ubicaciones (
    ubicaciones TEXT PRIMARY KEY,
    descripcion TEXT,
    activa BOOLEAN DEFAULT TRUE
);

-- ==========================================================
-- DATOS INICIALES REQUERIDOS
-- ==========================================================

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (documento, nombre, apellido, edad, empresa_contratista, usuario, contraseña, tipo_usuario)
VALUES ('00000000', 'Administrador', 'Sistema', 30, 'Interno', 'admin', 'admin123', 'administrador')
ON CONFLICT (documento) DO NOTHING;

-- Insertar ubicación GROUND por defecto
INSERT INTO ubicaciones (ubicaciones, descripcion, activa)
VALUES ('GROUND', 'Ubicación de Recepción', TRUE)
ON CONFLICT (ubicaciones) DO NOTHING;

-- Insertar posición GROUND por defecto
INSERT INTO posiciones (Posiciones_Eti, descripcion, activa)
VALUES ('GROUND', 'Zona de Recepción de Planta', TRUE)
ON CONFLICT (Posiciones_Eti) DO NOTHING;
