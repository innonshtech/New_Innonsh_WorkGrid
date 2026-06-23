// src/middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const secret = new TextEncoder().encode(JWT_SECRET);

import { rateLimit, RateLimitConfig } from '@/lib/rate-limiter';

// Public routes
const publicRoutes = ['/login', '/auth/register', '/register'];

// Role-based protected routes
const protectedRoutes = [
  { path: '/super-admin/audit-logs', roles: ['super_admin', 'admin', 'hr'] },
  { path: '/super-admin', roles: ['super_admin'] },
  { path: '/dashboard', roles: ['super_admin', 'admin', 'employee', 'attendance_only'] },
  { path: '/dashboard/payroll', roles: ['admin', 'super_admin'] },
  { path: '/dashboard/crm', roles: ['admin', 'super_admin', 'employee'] },
  { path: '/dashboard/tasks', roles: ['admin', 'super_admin', 'employee'] },
  { path: '/dashboard/projects', roles: ['admin', 'super_admin', 'employee'] },
  
  // Enforce rigid SaaS API layer security instead of relying manually on route-level validation
  { path: '/api/v1/super-admin', roles: ['super_admin'], isApi: true },
  { path: '/api/handbook', roles: ['admin', 'super_admin', 'employee', 'attendance_only'], isApi: true },
  
  // Specific exceptions allowing any designated employee to approve team requests, evaluated before the broader /api/v1/admin block
  { path: '/api/v1/admin/tasks', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/payroll/loans', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/payroll/employees', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/employees', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/attendance', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/payroll/settings', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/payroll/leaves', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/crm/organizations', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/organizations', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/approvals', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/payroll/leave-applications', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/payroll/overtime', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/payroll/comp-off', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/payroll/v2/calculate-preview', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/payroll/form16', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/payroll/investments', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/finance/expenses', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/finance/cost-centers', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/crm/business-units', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/crm/teams', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/engagement', roles: ['admin', 'super_admin', 'employee'], isApi: true },
  { path: '/api/v1/admin/helpdesk', roles: ['admin', 'super_admin', 'employee', 'attendance_only'], isApi: true },
  
  // Staff Augmentation Route Protections
  { path: '/admin/staffing', roles: ['admin', 'super_admin', 'recruiter'] },
  { path: '/api/v1/admin/staffing', roles: ['admin', 'super_admin', 'recruiter'], isApi: true },
  { path: '/api/v1/admin/notifications', roles: ['admin', 'super_admin', 'recruiter', 'employee'], isApi: true },

  { path: '/api/v1/admin', roles: ['admin', 'super_admin'], isApi: true },
  { path: '/api/v1/employee', roles: ['employee', 'attendance_only', 'admin', 'super_admin'], isApi: true },
];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isApiPath = pathname.startsWith('/api/');

  // Handle CORS Preflight explicitly
  if (req.method === 'OPTIONS' && isApiPath) {
    return addCorsHeaders(new NextResponse(null, { status: 200 }), req);
  }

  // Apply Rate Limiting for all API routes
  if (isApiPath) {
    let limitConfig = RateLimitConfig.DEFAULT;
    if (pathname.startsWith('/api/v1/login')) {
      limitConfig = RateLimitConfig.LOGIN;
    }
    const rateLimitResponse = rateLimit(req, limitConfig);
    if (rateLimitResponse) return rateLimitResponse;
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    let res = NextResponse.next();
    res = addSecurityHeaders(res);
    return isApiPath ? addCorsHeaders(res, req) : res;
  }

  // Find protected route config
  const routeConfig = protectedRoutes.find(route =>
    pathname.startsWith(route.path)
  );

  // If not in protectedRoutes, but it's an API path, we should still handle it carefully
  // but for now, we follow the existing logic of allowing it if not matched.
  if (!routeConfig) {
    // Optional: could enforce that ALL /api/v1/ routes MUST be in protectedRoutes
    let res = NextResponse.next();
    res = addSecurityHeaders(res);
    return isApiPath ? addCorsHeaders(res, req) : res;
  }

  // Check for token in cookies
  const token = req.cookies.get('authToken')?.value || req.cookies.get('employee_token')?.value;

  if (!token) {
    if (routeConfig.isApi || isApiPath) {
      let res = NextResponse.json({ error: "Unauthorized: No active session" }, { status: 401 });
      return addCorsHeaders(res, req);
    }
    console.log(`Middleware: Redirecting to login - No token found for ${pathname}`);
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'Please login first');
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    console.log(`[MIDDLEWARE DEBUG] pathname: ${pathname}, routeConfig.path: ${routeConfig?.path}, routeConfig.roles: ${JSON.stringify(routeConfig?.roles)}, payload.role: ${payload?.role}`);

    // Role-based access check
    if (!routeConfig.roles.includes(payload.role)) {
      console.warn(`Middleware: Unauthorized access attempt for ${pathname} (Role: ${payload.role})`);
      
      if (routeConfig.isApi || isApiPath) {
        let res = NextResponse.json({ error: `Forbidden: Role ${payload.role} does not have permission for this route.` }, { status: 403 });
        return addCorsHeaders(res, req);
      }
      
      const url = req.nextUrl.clone();
      url.pathname = '/unauthorized';
      url.searchParams.set('message', 'You do not have access to this page');
      return NextResponse.redirect(url);
    }

    // Pass the payload strictly into isolated Next Request Headers
    // Allows the global database singleton to reliably filter multi-tenancy via x-org-id
    const requestHeaders = new Headers(req.headers);
    if (payload.organizationId) {
      requestHeaders.set("x-organization-id", payload.organizationId);
    }
    requestHeaders.set("x-user-role", payload.role || "");
    requestHeaders.set("x-user-id", payload.id || "");

    let finalResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    finalResponse = addSecurityHeaders(finalResponse);
    return isApiPath ? addCorsHeaders(finalResponse, req) : finalResponse;
  } catch (error) {
    console.error(`Middleware: Token verification failed for ${pathname}:`, error.message);
    
    if (routeConfig.isApi || isApiPath) {
      let res = NextResponse.json({ error: "Session expired or invalid token." }, { status: 401 });
      return addCorsHeaders(res, req);
    }
    
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'Session expired. Please login again.');
    return NextResponse.redirect(url);
  }
}

// Apply middleware completely globally bypassing arbitrary Next caches for explicit api traffic
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|_next/data).*)'],
};

function addSecurityHeaders(response) {
  const headers = response.headers;
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
}

function addCorsHeaders(response, req) {
  const origin = req.headers.get('origin') || '*';
  const headers = response.headers;
  
  // Dynamic origin to support credentials securely
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-role, x-user-id, x-organization-id');
  headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}
