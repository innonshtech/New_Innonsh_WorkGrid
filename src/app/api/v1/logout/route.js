// // src/app/api/auth/logout/route.js
// import { NextResponse } from 'next/server';

// export async function POST() {
//   const res = NextResponse.json({ message: 'Logged out successfully' });

//   // ✅ Clear cookie
//   res.cookies.set('authToken', '', {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     path: '/',
//     expires: new Date(0), // expire immediately
//   });

//   return res;
// }

// import { cookies } from 'next/headers';
// import userSchema from '../../../../lib/db/models/User';
// import EmpSchema from '../../../../lib/db/models/payroll/Employee';
// import { connectToDatabase } from '../../../lib/mongodb';

// export async function POST() {
//   try {
//     const cookieStore = cookies();
//     const sessionToken = cookieStore.get('sessionToken')?.value;

//     if (sessionToken) {
//       await connectToDatabase();
//       await userSchema.findOneAndUpdate(
//         {
//           sessionToken
//         },
//         {
//           $unset: {
//             sessionToken: 1
//           }
//         }
//       );
//       await EmpSchema.findOneAndUpdate(
//         {
//           sessionToken
//         },
//         {
//           $unset: {
//             sessionToken: 1
//           }
//         }
//       );

//     }

//     // Clear the session cookie
//     cookieStore.delete('sessionToken');

//     return new Response(JSON.stringify({
//       message: 'Logout successful'
//     }), {
//       status: 200
//     });

//   } catch (error) {
//     console.error('Logout error:', error);
//     return new Response(JSON.stringify({
//       message: 'Logout failed'
//     }), {
//       status: 500
//     });
//   }
// }

// src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import jwt from 'jsonwebtoken';
import { logActivity } from '@/lib/logger';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    

    const token = req.cookies.get('authToken')?.value || req.cookies.get('employee_token')?.value;
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (!token && !refreshToken) {
      return NextResponse.json({ message: 'No session found' }, { status: 401 });
    }

    let decoded;
    try {
      if (token) decoded = jwt.verify(token, JWT_SECRET);
      else throw new Error("No auth token");
    } catch (error) {
      try {
        if (refreshToken) {
          const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || `${JWT_SECRET}_refresh_fallback`;
          decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        } else {
          throw new Error("No refresh token");
        }
      } catch (refreshError) {
        console.error('Invalid token during logout:', error.message, refreshError.message);
        // Even if token is invalid, we should clear the cookies
        const res = NextResponse.json({ message: 'Logged out (session was invalid)' });
        res.cookies.set('authToken', '', { maxAge: 0, path: '/' });
        res.cookies.set('employee_token', '', { maxAge: 0, path: '/' });
        res.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
        return res;
      }
    }

    const { id, role, department } = decoded;

    // Unset sessionToken in appropriate collection
    if (role === 'admin' || role === 'super_admin' || (department && department.toLowerCase() === 'admin')) {
      await prisma.user.updateMany({ where: { id }, data: { sessionToken: null } });
    } else {
      // Covers employee, supervisor, attendance_only
      await prisma.employee.updateMany({ where: { id }, data: { sessionToken: null } });
    }

    await logActivity({
      action: "logout",
      entity: (role === 'admin' || role === 'super_admin') ? "User" : "Employee",
      entityId: id,
      description: `User logged out: ${id} (${role})`,
      performedBy: {
        userId: id,
        role: role
      },
      req: req
    });

    const res = NextResponse.json({ message: 'Logged out successfully' });
    res.cookies.set('authToken', '', { maxAge: 0, path: '/' });
    res.cookies.set('employee_token', '', { maxAge: 0, path: '/' });
    res.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Server error: ' + error.message }, { status: 500 });
  }
}
