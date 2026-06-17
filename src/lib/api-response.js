// src/lib/api-response.js
import { NextResponse } from 'next/server';

export const ApiResponse = {
  success(data, status = 200, message = 'Success') {
    return NextResponse.json({ success: true, message, ...data }, { status });
  },

  error(message, status = 500, code = 'INTERNAL_ERROR', details = null) {
    return NextResponse.json(
      { success: false, error: { code, message, details } },
      { status }
    );
  },

  unauthorized(message = 'Unauthorized') {
    return this.error(message, 401, 'UNAUTHORIZED');
  },

  forbidden(message = 'Forbidden: Insufficient permissions') {
    return this.error(message, 403, 'FORBIDDEN');
  },

  notFound(message = 'Resource not found') {
    return this.error(message, 404, 'NOT_FOUND');
  },

  badRequest(message = 'Bad Request', details = null) {
    return this.error(message, 400, 'BAD_REQUEST', details);
  },

  paginated(data, total, page, limit, status = 200) {
    return NextResponse.json(
      {
        success: true,
        data,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
      { status }
    );
  },
};
