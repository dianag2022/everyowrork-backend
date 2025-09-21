// ==================== src/middleware/auth.ts (CONSOLIDADO) ====================
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

// Añadir logs de depuración
console.log('Environment Variables Check:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? '✓' : '✗',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗'
});


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and Service Role Key must be defined in environment variables');
}

// Cliente de Supabase para el backend con service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    user_metadata?: any;
  };
}

// Middleware principal de autenticación
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Missing authorization token',
          status: 401
        }
      });
    }

    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token verification failed:', error);
      return res.status(403).json({
        error: {
          message: 'Invalid or expired token',
          status: 403
        }
      });
    }

    // Establecer información del usuario en el request
    req.user = {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'user',
      user_metadata: user.user_metadata
    };

    console.log('Authenticated user:', req.user.email, 'Role:', req.user.role);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: {
        message: 'Authentication error',
        status: 500
      }
    });
  }
};

// Middleware para requerir roles específicos
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          status: 401
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`Access denied. User role: ${req.user.role}, Required roles: ${roles.join(', ')}`);
      return res.status(403).json({
        error: {
          message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
          status: 403
        }
      });
    }

    next();
  };
};

// Middleware opcional - verificar token pero no requerir autenticación
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email!,
          role: user.user_metadata?.role || 'user',
          user_metadata: user.user_metadata
        };
      }
    }

    // Siempre continuar, con o sin usuario
    next();
  } catch (error) {
    // En caso de error, continuar sin autenticación
    console.warn('Optional auth error (continuing without auth):', error);
    next();
  }
};

// Middleware para solo admins
export const requireAdmin = [
  authenticateToken,
  requireRole(['admin'])
];

// Middleware para usuarios autenticados (cualquier rol)
export const requireAuth = [
  authenticateToken
];