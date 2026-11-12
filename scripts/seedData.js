/**
 * Seed script for Supabase - creates líneas, paradas, unidades and posiciones.
 * Run: node scripts/seedData.js
 *
 * Requires .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * Or: node --env-file=.env scripts/seedData.js (Node 20.6+)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env (fallback when running without npm run seed / --env-file)
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    let env = readFileSync(envPath, 'utf8');
    if (env.charCodeAt(0) === 0xfeff) env = env.slice(1);
    env.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const [, key, val] = match;
        process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
      }
    });
  }
}
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Isla de Margarita - datos de prueba
const lineasData = [
  { nombre: 'RA-1 Ruta Norte - Playas (Playa El Agua)', tarifa: 2.5, color: '#2563eb' },
  { nombre: 'RA-2 Ruta Sur - Deportes Acuáticos (Playa El Yaque)', tarifa: 2.5, color: '#16a34a' },
  { nombre: 'RA-3 Ruta Este - Surf y Aventura (Playa Parguito)', tarifa: 2.5, color: '#dc2626' },
  { nombre: 'RA-4 Ruta Oeste - Playa Caribe', tarifa: 2.5, color: '#ca8a04' },
  { nombre: 'RA-5 Ruta Central - La Restinga', tarifa: 2.5, color: '#7c3aed' },
];

const paradasData = [
  { nombre: 'Terminal Porlamar', latitud: 10.9577, longitud: -63.8497, lineaIndex: 0 },
  { nombre: 'Centro Comercial Sambil', latitud: 10.9699, longitud: -63.8456, lineaIndex: 0 },
  { nombre: 'Playa El Agua Norte', latitud: 11.0894, longitud: -63.9235, lineaIndex: 0 },
  { nombre: 'Aeropuerto Internacional', latitud: 10.9129, longitud: -63.9666, lineaIndex: 1 },
  { nombre: 'Costa Azul', latitud: 10.8934, longitud: -63.9445, lineaIndex: 1 },
  { nombre: 'Playa El Yaque Kitesurf', latitud: 10.8756, longitud: -63.9356, lineaIndex: 1 },
  { nombre: 'La Asunción Centro', latitud: 11.0337, longitud: -63.8625, lineaIndex: 2 },
  { nombre: 'Mirador Cerro Copey', latitud: 11.0756, longitud: -63.8234, lineaIndex: 2 },
  { nombre: 'Playa Parguito Surf Point', latitud: 11.0923, longitud: -63.8567, lineaIndex: 2 },
  { nombre: 'Juan Griego Puerto', latitud: 11.0834, longitud: -63.9687, lineaIndex: 3 },
  { nombre: 'Fortín La Galera', latitud: 11.0945, longitud: -63.9823, lineaIndex: 3 },
  { nombre: 'Playa Caribe Oeste', latitud: 11.0678, longitud: -64.0134, lineaIndex: 3 },
  { nombre: 'Boca de Río', latitud: 10.8945, longitud: -64.0567, lineaIndex: 4 },
  { nombre: 'Embarcadero La Restinga', latitud: 10.8234, longitud: -64.0923, lineaIndex: 4 },
];

async function seedData() {
  try {
    console.log('Seeding database...\n');

    // 1. Create lineas
    const lineas = [];
    for (const linea of lineasData) {
      const { data, error } = await supabase
        .from('lineas')
        .insert([{ nombre: linea.nombre, tarifa: linea.tarifa, color: linea.color }])
        .select()
        .single();
      if (error) throw error;
      lineas.push(data);
      console.log('  ✓ Línea:', linea.nombre);
    }

    // 2. Create paradas
    const paradas = [];
    for (const parada of paradasData) {
      const { data, error } = await supabase
        .from('paradas')
        .insert([
          {
            nombre: parada.nombre,
            latitud: parada.latitud,
            longitud: parada.longitud,
            direccion: null,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      paradas.push(data);
      console.log('  ✓ Parada:', parada.nombre);
    }

    // 3. Create ruta_parada (associate stops to lines)
    const paradasPorLinea = {};
    for (let i = 0; i < paradasData.length; i++) {
      const idx = paradasData[i].lineaIndex;
      if (!paradasPorLinea[idx]) paradasPorLinea[idx] = [];
      paradasPorLinea[idx].push({ parada: paradas[i], orden: paradasPorLinea[idx].length + 1 });
    }
    for (const [lineaIdx, items] of Object.entries(paradasPorLinea)) {
      const linea = lineas[Number(lineaIdx)];
      for (const { parada, orden } of items) {
        const { error } = await supabase.from('ruta_parada').insert({
          id_linea: linea.id_linea,
          id_parada: parada.id_parada,
          orden,
        });
        if (error) throw error;
      }
    }
    console.log('  ✓ Ruta-Parada asociaciones creadas');

    // 4. Create unidades (buses)
    const unidades = [];
    const placas = ['ABC-001', 'ABC-002', 'ABC-003', 'ABC-004', 'ABC-005'];
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabase
        .from('unidades')
        .insert([
          {
            id_linea: lineas[i].id_linea,
            placa: placas[i],
            modelo: 'Mercedes Benz',
            is_active: i < 3,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      unidades.push(data);
      console.log('  ✓ Unidad:', placas[i], '(activa:', i < 3, ')');
    }

    // 5. Create posicion_actual

    const posicionesIniciales = [
      { lat: 10.9577, lng: -63.8497 },
      { lat: 10.9129, lng: -63.9666 },
      { lat: 11.0337, lng: -63.8625 },
      { lat: 11.0834, lng: -63.9687 },
      { lat: 10.8945, lng: -64.0567 },
    ];

    for (let i = 0; i < unidades.length; i++) {
      const pos = posicionesIniciales[i];
      const { error } = await supabase.from('posicion_actual').upsert(
        {
          id_unidad: unidades[i].id_unidad,
          latitud: pos.lat,
          longitud: pos.lng,
          velocidad: 0,
          status: 'en_ruta',
          timestamp: new Date().toISOString(),
        },
        { onConflict: 'id_unidad' }
      );
      if (error) throw error;
    }
    console.log('  ✓ Posiciones iniciales creadas');

    console.log('\n✅ Seed completado correctamente.');
    console.log('   Verifica los datos en el panel de Supabase.');
  } catch (error) {
    console.error('\n❌ Error en seed:', error.message);
    process.exit(1);
  }
}

seedData();
