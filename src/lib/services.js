import { supabase } from './supabase';

// ============================================
// PROFILE SERVICES (Supabase Auth)
// ============================================

export const profileService = {
  /**
   * Get user profile by auth user ID (from auth.uid())
   */
  async getById(userId) {
    const { data, error } = await supabase
      .from('perfiles_usuario')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update user profile (nombre, rol)
   */
  async update(userId, updates) {
    const { data, error } = await supabase
      .from('perfiles_usuario')
      .update({
        nombre: updates.nombre,
        rol: updates.rol,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// LEGACY USER SERVICES (deprecado - usar Supabase Auth)
// ============================================

export const userService = {
  /**
   * @deprecated Usar supabase.auth.signUp() - Mantenido para referencia
   */
  async register() {
    throw new Error('Usar Supabase Auth: supabase.auth.signUp()');
  },

  /**
   * @deprecated Usar supabase.auth.signInWithPassword() - Mantenido para referencia
   */
  async login() {
    throw new Error('Usar Supabase Auth: supabase.auth.signInWithPassword()');
  },

  /**
   * Obtener perfil de usuario (compatibilidad)
   */
  async getUserById(userId) {
    return profileService.getById(userId);
  }
};

// ============================================
// LINEA (ROUTE) SERVICES
// ============================================

export const lineaService = {
  /**
   * Get all bus lines/routes
   */
  async getAll() {
    const { data, error } = await supabase
      .from('lineas')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get line by ID
   */
  async getById(lineaId) {
    const { data, error } = await supabase
      .from('lineas')
      .select('*')
      .eq('id_linea', lineaId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new line
   */
  async create(lineaData) {
    const { data, error } = await supabase
      .from('lineas')
      .insert([{
        nombre: lineaData.nombre,
        tarifa: lineaData.tarifa || 0,
        color: lineaData.color || '#2563eb'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get all stops for a line with order
   */
  async getStopsByLine(lineaId) {
    const { data, error } = await supabase
      .from('ruta_parada')
      .select(`
        orden,
        paradas:paradas (*)
      `)
      .eq('id_linea', lineaId)
      .order('orden', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// PARADA (STOP) SERVICES
// ============================================

export const paradaService = {
  /**
   * Get all bus stops
   */
  async getAll() {
    const { data, error } = await supabase
      .from('paradas')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get stop by ID
   */
  async getById(paradaId) {
    const { data, error } = await supabase
      .from('paradas')
      .select('*')
      .eq('id_parada', paradaId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new stop
   */
  async create(paradaData) {
    const { data, error } = await supabase
      .from('paradas')
      .insert([{
        nombre: paradaData.nombre,
        latitud: paradaData.latitud,
        longitud: paradaData.longitud,
        direccion: paradaData.direccion || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Add stop to a route with order
   */
  async addToRoute(lineaId, paradaId, orden) {
    const { data, error } = await supabase
      .from('ruta_parada')
      .insert([{
        id_linea: lineaId,
        id_parada: paradaId,
        orden: orden
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update a bus stop
   */
  async update(paradaId, paradaData) {
    const { data, error } = await supabase
      .from('paradas')
      .update({
        nombre: paradaData.nombre,
        latitud: paradaData.latitud,
        longitud: paradaData.longitud,
        direccion: paradaData.direccion || null
      })
      .eq('id_parada', paradaId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Delete a bus stop
   */
  async delete(paradaId) {
    const { error } = await supabase
      .from('paradas')
      .delete()
      .eq('id_parada', paradaId);
    
    if (error) throw error;
    return true;
  }
};

// ============================================
// UNIDAD (BUS) SERVICES
// ============================================

export const unidadService = {
  /**
   * Get all bus units
   */
  async getAll() {
    const { data, error } = await supabase
      .from('unidades')
      .select(`
        *,
        lineas:lineas (*),
        posicion_actual:posicion_actual (*)
      `);
    
    if (error) throw error;
    return data;
  },

  /**
   * Get active bus units
   */
  async getActive() {
    const { data, error } = await supabase
      .from('unidades')
      .select(`
        *,
        lineas:lineas (*),
        posicion_actual:posicion_actual (*)
      `)
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  },

  /**
   * Get units by line
   */
  async getByLine(lineaId) {
    const { data, error } = await supabase
      .from('unidades')
      .select(`
        *,
        lineas:lineas (*),
        posicion_actual:posicion_actual (*)
      `)
      .eq('id_linea', lineaId);
    
    if (error) throw error;
    return data;
  },

  /**
   * Get unit by ID
   */
  async getById(unidadId) {
    const { data, error } = await supabase
      .from('unidades')
      .select(`
        *,
        lineas:lineas (*),
        posicion_actual:posicion_actual (*),
        unidad_conductor:unidad_conductor (
          usuarios:usuarios (*)
        )
      `)
      .eq('id_unidad', unidadId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new unit
   */
  async create(unidadData) {
    const { data, error } = await supabase
      .from('unidades')
      .insert([{
        id_linea: unidadData.id_linea,
        placa: unidadData.placa,
        modelo: unidadData.modelo || null,
        is_active: unidadData.is_active || false
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Assign driver to unit
   */
  async assignDriver(unidadId, usuarioId) {
    // First, deactivate any existing active assignment for this driver
    await supabase
      .from('unidad_conductor')
      .update({ is_active: false, fecha_finalizacion: new Date().toISOString() })
      .eq('id_usuario', usuarioId)
      .eq('is_active', true);

    // Create new assignment
    const { data, error } = await supabase
      .from('unidad_conductor')
      .insert([{
        id_unidad: unidadId,
        id_usuario: usuarioId,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update unit active status
   */
  async updateActiveStatus(unidadId, isActive) {
    const { data, error } = await supabase
      .from('unidades')
      .update({ is_active: isActive })
      .eq('id_unidad', unidadId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// POSICION (POSITION) SERVICES
// ============================================

export const posicionService = {
  /**
   * Update current position of a unit
   */
  async updatePosition(unidadId, positionData) {
    // Use upsert to update or insert
    const { data, error } = await supabase
      .from('posicion_actual')
      .upsert({
        id_unidad: unidadId,
        latitud: positionData.latitud,
        longitud: positionData.longitud,
        velocidad: positionData.velocidad || 0,
        status: positionData.status || 'en_ruta',
        timestamp: new Date().toISOString()
      }, {
        onConflict: 'id_unidad'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get current position of a unit
   */
  async getCurrentPosition(unidadId) {
    const { data, error } = await supabase
      .from('posicion_actual')
      .select('*')
      .eq('id_unidad', unidadId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  /**
   * Get all current positions for active units
   */
  async getAllCurrentPositions() {
    const { data, error } = await supabase
      .from('posicion_actual')
      .select(`
        *,
        unidades:unidades (
          *,
          lineas:lineas (*)
        )
      `);
    
    if (error) throw error;
    return data;
  },

  /**
   * Get historical positions for a unit
   */
  async getHistoricalPositions(unidadId, limit = 100) {
    const { data, error } = await supabase
      .from('posicion_historica')
      .select('*')
      .eq('id_unidad', unidadId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// FAVORITOS (FAVORITES) SERVICES
// ============================================

export const favoritosService = {
  /**
   * Get user favorites
   */
  async getUserFavorites(usuarioId) {
    const { data, error } = await supabase
      .from('favoritos')
      .select('*')
      .eq('id_usuario', usuarioId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Add favorite
   */
  async addFavorite(usuarioId, tipoFavorito, idReferencia) {
    const { data, error } = await supabase
      .from('favoritos')
      .insert([{
        id_usuario: usuarioId,
        tipo_favorito: tipoFavorito,
        id_referencia: idReferencia
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Remove favorite
   */
  async removeFavorite(favoritoId) {
    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('id_favorito', favoritoId);
    
    if (error) throw error;
    return true;
  }
};

