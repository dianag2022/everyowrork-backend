// ==================== src/middleware/validation.ts (MEJORADO) ====================
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

type SchemaInput = Joi.Schema | Record<string, Joi.Schema> | undefined;

// Helper para convertir schema a ObjectSchema de Joi
function toObjectSchema(input: SchemaInput): Joi.ObjectSchema | undefined {
  if (!input) return undefined;

  // Si ya es un schema de Joi
  if (input && typeof (input as any).validate === 'function') {
    // Si ya es un ObjectSchema, devolverlo tal como está
    return input as Joi.ObjectSchema;
  }

  // Si es un objeto plano con reglas de Joi
  if (input && typeof input === 'object') {
    return Joi.object(input as Record<string, Joi.Schema>);
  }

  return undefined;
}

export const validateRequest = (schema: {
  body?: SchemaInput;
  query?: SchemaInput;
  params?: SchemaInput;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: string[] = [];

      const validatePart = (
        partName: 'body' | 'query' | 'params', 
        inputSchema: SchemaInput, 
        value: any
      ) => {
        const joiSchema = toObjectSchema(inputSchema);
        if (!joiSchema) return;

        const { error } = joiSchema.validate(value, { 
          abortEarly: false, 
          allowUnknown: false, 
          convert: true,
          stripUnknown: true
        });

        if (error) {
          const messages = error.details.map((d: any) => d.message).join(', ');
          errors.push(`${partName}: ${messages}`);
        }
      };

      // Validar cada parte de la request
      validatePart('params', schema.params, req.params);
      validatePart('query', schema.query, req.query);
      validatePart('body', schema.body, req.body);

      if (errors.length > 0) {
        return res.status(400).json({
          error: {
            message: 'Validation failed',
            details: errors,
            status: 400
          }
        });
      }

      next();
    } catch (err) {
      console.error('Validation middleware error:', err);
      return res.status(500).json({ 
        error: {
          message: 'Internal validation error',
          status: 500
        }
      });
    }
  };
};

// Schemas comunes reutilizables
export const commonSchemas = {
  // Para parámetros de ID
  uuidParam: {
    id: Joi.string().uuid().required()
  },
  
  // Para paginación
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  },
  
  // Para búsquedas
  search: {
    q: Joi.string().trim().min(1).max(100).optional(),
    category: Joi.string().trim().optional(),
    location: Joi.string().trim().optional()
  }
};