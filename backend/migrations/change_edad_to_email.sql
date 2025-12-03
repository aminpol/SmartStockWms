-- Script SQL para cambiar el campo 'edad' por 'email' en la tabla usuarios
-- Ejecutar este script en MySQL Workbench o desde la línea de comandos de MySQL

USE inventario_db;

-- Cambiar la columna edad a email
ALTER TABLE usuarios 
CHANGE COLUMN edad email VARCHAR(255);

-- Verificar el cambio
DESCRIBE usuarios;
