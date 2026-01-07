-- 1. Asegurar que la columna lote existe y es NOT NULL en stock_ubicaciones
-- Primero permitimos nulos por si hay datos, luego rellenamos, y finalmente ponemos constraint
DO $$ 
BEGIN 
    -- Agregar columna lote si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_ubicaciones' AND column_name = 'lote') THEN
        ALTER TABLE stock_ubicaciones ADD COLUMN lote TEXT;
    END IF;
END $$;

-- Rellenar valores nulos con string vacío para consistencia
UPDATE stock_ubicaciones SET lote = '' WHERE lote IS NULL;

-- Cambiar lote a NOT NULL con default
ALTER TABLE stock_ubicaciones ALTER COLUMN lote SET DEFAULT '';
ALTER TABLE stock_ubicaciones ALTER COLUMN lote SET NOT NULL;

-- 2. Actualizar la PRIMARY KEY de stock_ubicaciones
-- Dropear PK actual (usualmente llamada stock_ubicaciones_pkey)
ALTER TABLE stock_ubicaciones DROP CONSTRAINT IF EXISTS stock_ubicaciones_pkey;
-- Crear nueva PK que incluya lote
ALTER TABLE stock_ubicaciones ADD PRIMARY KEY (id, posicion, lote);

-- 3. Asegurar columnas en historial_movimientos
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historial_movimientos' AND column_name = 'lote') THEN
        ALTER TABLE historial_movimientos ADD COLUMN lote TEXT DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historial_movimientos' AND column_name = 'estado') THEN
        ALTER TABLE historial_movimientos ADD COLUMN estado TEXT DEFAULT 'Almacenado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historial_movimientos' AND column_name = 'planta') THEN
        ALTER TABLE historial_movimientos ADD COLUMN planta VARCHAR(50);
    END IF;
END $$;

-- Rellenar historial antiguo
UPDATE historial_movimientos SET lote = '' WHERE lote IS NULL;
