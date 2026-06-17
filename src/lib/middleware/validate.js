import { NextResponse } from 'next/server';

/**
 * A higher-order function to wrap Next.js App Router API handlers with Zod validation.
 * 
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {Function} handler - The original API route handler (req, context, validatedData)
 * @returns {Function} A wrapped API route handler
 */
export const validateRequest = (schema, handler) => {
  return async (req, context) => {
    try {
      let dataToValidate = {};
      
      // Extract data based on request method
      if (req.method === 'GET' || req.method === 'DELETE') {
        const url = new URL(req.url);
        dataToValidate = Object.fromEntries(url.searchParams);
      } else {
        // Handle POST, PUT, PATCH
        const text = await req.text();
        if (text) {
          dataToValidate = JSON.parse(text);
        }
      }

      // Validate the data against the provided schema
      // This strips out any unknown fields if the schema uses .strip() or default behavior
      const validatedData = schema.parse(dataToValidate);
      
      // Pass the strongly typed, validated data to the actual handler
      return await handler(req, context, validatedData);

    } catch (error) {
      if (error.name === 'ZodError') {
        // Return structured validation errors
        return NextResponse.json({ 
          error: "Validation failed", 
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 });
      }
      
      console.error('Validation middleware error:', error);
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
  };
};
