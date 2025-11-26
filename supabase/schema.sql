-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: usuarios (Users)
CREATE TABLE usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('conductor', 'pasajero', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: lineas (Bus Routes/Lines)
CREATE TABLE lineas (
    id_linea UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    tarifa DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    color VARCHAR(7) DEFAULT '#2563eb',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: paradas (Bus Stops)
CREATE TABLE paradas (
    id_parada UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: ruta_parada (Route-Stop Association - Weak Entity)
CREATE TABLE ruta_parada (
    id_linea UUID NOT NULL REFERENCES lineas(id_linea) ON DELETE CASCADE,
    id_parada UUID NOT NULL REFERENCES paradas(id_parada) ON DELETE CASCADE,
    orden INTEGER NOT NULL,
    PRIMARY KEY (id_linea, id_parada, orden),
    CONSTRAINT unique_orden_per_linea UNIQUE (id_linea, orden)
);

-- Table: unidades (Bus Units)
CREATE TABLE unidades (
    id_unidad UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_linea UUID NOT NULL REFERENCES lineas(id_linea) ON DELETE RESTRICT,
    placa VARCHAR(20) NOT NULL UNIQUE,
    modelo VARCHAR(100),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: posicion_actual (Current Position)
CREATE TABLE posicion_actual (
    id_posicion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_unidad UUID NOT NULL REFERENCES unidades(id_unidad) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    velocidad DECIMAL(5, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'en_ruta',
    CONSTRAINT unique_unidad_posicion UNIQUE (id_unidad)
);

-- Table: unidad_conductor (Unit-Driver Relationship - 1:1)
CREATE TABLE unidad_conductor (
    id_unidad UUID PRIMARY KEY REFERENCES unidades(id_unidad) ON DELETE CASCADE,
    id_usuario UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_finalizacion TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table: favoritos (Favorites)
CREATE TABLE favoritos (
    id_favorito UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    tipo_favorito VARCHAR(50) NOT NULL CHECK (tipo_favorito IN ('parada', 'linea')),
    id_referencia UUID NOT NULL, -- Can reference parada or linea
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_favorite UNIQUE (id_usuario, tipo_favorito, id_referencia)
);

-- Table: posicion_historica (Historical Position - for analytics)
CREATE TABLE posicion_historica (
    id_historico UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_unidad UUID NOT NULL REFERENCES unidades(id_unidad) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    velocidad DECIMAL(5, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'en_ruta'
);

-- Indexes for performance
CREATE INDEX idx_ruta_parada_linea ON ruta_parada(id_linea);
CREATE INDEX idx_ruta_parada_parada ON ruta_parada(id_parada);
CREATE INDEX idx_unidades_linea ON unidades(id_linea);
CREATE INDEX idx_posicion_actual_unidad ON posicion_actual(id_unidad);
CREATE INDEX idx_posicion_historica_unidad_timestamp ON posicion_historica(id_unidad, timestamp DESC);
CREATE INDEX idx_favoritos_usuario ON favoritos(id_usuario);
CREATE INDEX idx_unidad_conductor_usuario ON unidad_conductor(id_usuario);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for usuarios updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to archive position to historical table
CREATE OR REPLACE FUNCTION archive_position()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO posicion_historica (id_unidad, timestamp, latitud, longitud, velocidad, status)
    VALUES (OLD.id_unidad, OLD.timestamp, OLD.latitud, OLD.longitud, OLD.velocidad, OLD.status);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to archive old positions
CREATE TRIGGER archive_old_position BEFORE UPDATE ON posicion_actual
    FOR EACH ROW EXECUTE FUNCTION archive_position();

