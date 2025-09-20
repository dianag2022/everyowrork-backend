import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno especificando la ruta exacta del archivo .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Depuración para ver si las variables se están cargando
console.log('Ruta del .env:', path.resolve(__dirname, '../../.env'));
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY está definida:', !!process.env.SUPABASE_KEY);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error('Variables de entorno no encontradas. Verifica tu archivo .env');
}

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);