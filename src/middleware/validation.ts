// src/middleware/validation.ts
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

type SchemaInput = Joi.Schema | Record<string, Joi.Schema> | undefined;

function toObjectSchema(input: SchemaInput, sampleObj: Record<string, any> = {}) {
  // If it's already a Joi schema (has validate), return it
  // (We treat any Joi.Schema as acceptable)
  // NOTE: Joi schema objects expose a validate() function at runtime.
  if (input && typeof (input as any).validate === 'function') {
    // If it's already an object schema, just return it.
    // If it's a single Joi rule (like Joi.string()), we need to map it to a key.
    const schemaAny: any = input;
    // If it's already an object schema (no reliable public flag), but usually user passes Joi.object()
    // We'll assume it's valid and return as-is.
    return input as Joi.ObjectSchema;
  }

  // If input is a plain object like { serviceId: Joi.string().uuid() }
  if (input && typeof input === 'object') {
    return Joi.object(input as Record<string, Joi.Schema>);
  }

  // If nothing given, default to allow any
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

      const validatePart = (partName: 'body' | 'query' | 'params', inputSchema: SchemaInput, value: any) => {
        if (!inputSchema) return;

        // If inputSchema is a Joi schema (single rule) but not an object schema,
        // we still accept it (use as-is only if it's an object schema),
        // otherwise convert plain object to Joi.object(...)
        let joiSchema: Joi.ObjectSchema | Joi.Schema | undefined = undefined;

        if (typeof (inputSchema as any)?.validate === 'function') {
          // It's a Joi schema. If it's not an object schema and we are validating params (which is an object),
          // try to turn it into an object schema mapping of the request keys
          const maybeSchema: any = inputSchema;
          // Heuristic: if the value to validate is an object (req.params, req.query, req.body)
          // and the provided schema is not an object schema, try to convert:
          if (partName === 'params' && typeof value === 'object' && !Joi.isSchema(maybeSchema?.describe?.())) {
            // We'll try to detect if inputSchema is a single rule (e.g. Joi.string()).
            // Build object schema by mapping to request keys (if single key present).
            const keys = Object.keys(value || {});
            if (keys.length === 1) {
              joiSchema = Joi.object({ [keys[0]]: inputSchema as Joi.Schema });
            } else {
              // If there are multiple keys but the user passed a non-object Joi schema, fallback to Joi.object()
              joiSchema = Joi.object().fork([], (s: any) => s); // fallback empty object schema
            }
          } else {
            joiSchema = inputSchema as Joi.Schema;
          }
        } else if (typeof inputSchema === 'object') {
          joiSchema = Joi.object(inputSchema as Record<string, Joi.Schema>);
        }

        if (!joiSchema) return;

        // Validate with abortEarly: false so we get full list of errors
        const { error } = (joiSchema as any).validate(value, { abortEarly: false, allowUnknown: false, convert: true });

        if (error) {
          errors.push(`${partName}: ${error.details.map((d: any) => d.message).join(', ')}`);
        }
      };

      validatePart('body', schema.body, req.body);
      validatePart('query', schema.query, req.query);
      validatePart('params', schema.params, req.params);

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }

      next();
    } catch (err) {
      console.error('Validation middleware error', err);
      return res.status(500).json({ error: 'Internal validation error' });
    }
  };
};
