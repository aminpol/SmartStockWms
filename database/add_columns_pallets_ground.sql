-- Script para agregar columnas planta y usuario a la tabla pallets_ground
-- Ejecutar este script en la base de datos para actualizar la estructura de la tabla

-- Agregar columna 'planta' para almacenar la planta seleccionada (UPF-22 o UPF-30)
ALTER TABLE pallets_ground 
ADD COLUMN planta VARCHAR(20) DEFAULT 'UPF-22';

-- Agregar columna 'usuario' para almacenar el nombre del usuario que recibe el pallet
ALTER TABLE pallets_ground 
ADD COLUMN usuario VARCHAR(100) DEFAULT 'Desconocido';

-- Opcional: Agregar índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_pallets_ground_planta ON pallets_ground(planta);
CREATE INDEX idx_pallets_ground_usuario ON pallets_ground(usuario);

-- Opcional: Agregar constraint para asegurar que solo se permitan valores válidos de planta
-- ALTER TABLE pallets_ground 
-- ADD CONSTRAINT chk_planta_valida 
-- CHECK (planta IN ('UPF-22', 'UPF-30'));

-- Confirmar los cambios
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'pallets_ground' 
AND column_name IN ('planta', 'usuario')
ORDER BY column_name;
