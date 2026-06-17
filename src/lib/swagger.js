import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'WorkGrid HRMS API Reference',
    version: '1.0.0',
    description: 'Complete API documentation for the WorkGrid Human Resource Management System.',
    contact: {
      name: 'WorkGrid Support',
      email: 'support@WorkGrid.in',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development Server',
    },
    {
      url: 'https://api.WorkGrid.in',
      description: 'Production Server',
    },
  ],
  components: {
    securitySchemes: {
      superAdminAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'authToken',
        description: 'JWT Auth token for Super Admin (Paste token generated from login here)',
      },
      adminAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'authToken',
        description: 'JWT Auth token for Admin (Paste token generated from login here)',
      },
      employeeAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'employee_token',
        description: 'JWT Auth token for Employees (Paste token generated from login here)',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Detailed error message' },
        },
      },
      Employee: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
          employeeId: { type: 'string', example: 'EMP001' },
          role: { type: 'string', example: 'employee' },
          personalDetails: {
            type: 'object',
            properties: {
              firstName: { type: 'string', example: 'Rahul' },
              lastName: { type: 'string', example: 'Sharma' },
              email: { type: 'string', example: 'rahul.sharma@bizmate.in' },
              phone: { type: 'string', example: '9999999999' }
            }
          },
          jobDetails: {
            type: 'object',
            properties: {
              department: { type: 'string', example: 'Engineering' },
              designation: { type: 'string', example: 'Software Engineer' },
            }
          },
          status: { type: 'string', example: 'Active' },
        },
      },
      Leave: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '87f1a2b3c4d5e6f7a8b9c0d1' },
          employeeId: { type: 'string', example: 'EMP001' },
          employeeName: { type: 'string', example: 'Rahul Sharma' },
          month: { type: 'number', example: 3 },
          year: { type: 'number', example: 2026 },
          status: { type: 'string', example: 'Pending' },
          leaves: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', example: '2026-03-22' },
                leaveType: { type: 'string', example: 'Paid' },
                reason: { type: 'string', example: 'Viral fever' }
              }
            }
          }
        }
      },
      JobRequisition: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65f...job1' },
          title: { type: 'string', example: 'AI/ML Engineer' },
          department: { type: 'string', example: 'Engineering' },
          location: { type: 'string', example: 'Remote' },
          role: { type: 'string', example: 'Developer' },
          priority: { type: 'string', example: 'High' },
          status: { type: 'string', example: 'Open' },
          experienceLevel: { type: 'string', example: 'Mid' },
          hiringManagerName: { type: 'string', example: 'Aniket Patil' },
          description: { type: 'string', example: 'Job description text...' },
          requirements: { type: 'array', items: { type: 'string' } },
        }
      },
      Candidate: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65f...cand1' },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane@example.com' },
          phone: { type: 'string', example: '+91 9876543210' },
          jobRequisition: { type: 'string', description: 'ID of the JobRequisition' },
          status: { type: 'string', example: 'Applied' },
          fitScore: { type: 'number', example: 85 },
          parsedResume: { type: 'object' },
          resumeUrl: { type: 'string', example: '/uploads/resumes/resume.pdf' }
        }
      }
    },
  },
  security: [
    { superAdminAuth: [] },
    { adminAuth: [] },
    { employeeAuth: [] }
  ],
  paths: {
    // ==========================================
    // 8. PUBLIC CAREERS (NEW)
    // ==========================================
    '/api/v1/public/careers/jobs': {
      get: {
        tags: ['Public Careers'],
        summary: 'List Open Job Openings',
        responses: { 200: { description: 'Success' } }
      }
    },
    '/api/v1/public/careers/apply': {
      post: {
        tags: ['Public Careers'],
        summary: 'Submit Job Application',
        description: 'Upload resume and candidate details. Resume is processed by AI.',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  jobId: { type: 'string' },
                  resume: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Created' } }
      }
    },
    '/api/v1/public/careers/status': {
      get: {
        tags: ['Public Careers'],
        summary: 'Check Application Status',
        parameters: [{ name: 'email', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Success' } }
      }
    },

    // ==========================================
    // 9. RECRUITMENT MANAGEMENT (ADMIN)
    // ==========================================
    '/api/v1/admin/recruitment/jobs': {
      get: {
        tags: ['Recruitment Admin'],
        summary: 'List All Job Requisitions',
        security: [{ adminAuth: [] }],
        responses: { 200: { description: 'Success' } }
      },
      post: {
        tags: ['Recruitment Admin'],
        summary: 'Create Job Requisition',
        security: [{ adminAuth: [] }],
        responses: { 201: { description: 'Created' } }
      }
    },
    '/api/v1/admin/recruitment/candidates': {
      get: {
        tags: ['Recruitment Admin'],
        summary: 'List All Candidates',
        security: [{ adminAuth: [] }],
        responses: { 200: { description: 'Success' } }
      }
    },
    '/api/v1/admin/recruitment/analytics': {
      get: {
        tags: ['Recruitment Admin'],
        summary: 'Get Recruitment Dashboard Analytics',
        security: [{ adminAuth: [] }],
        responses: { 200: { description: 'Success' } }
      }
    },
    '/api/v1/admin/recruitment/ai/fit-score': {
      post: {
        tags: ['AI Powered Recruitment'],
        summary: 'Calculate AI Fit Score',
        security: [{ adminAuth: [] }],
        responses: { 200: { description: 'Score calculated' } }
      }
    },
    '/api/v1/admin/recruitment/ai/generate-jd': {
      post: {
        tags: ['AI Powered Recruitment'],
        summary: 'Generate AI Job Description',
        security: [{ adminAuth: [] }],
        responses: { 200: { description: 'JD Generated' } }
      }
    },
    // ==========================================
    // 0. PROJECT TRACKING (NEW)
    // ==========================================
    '/api/v1/admin/tasks/projects': {
      get: {
        tags: ['Project Tracking'],
        summary: 'List Projects',
        security: [{ adminAuth: [] }, { employeeAuth: [] }],
        responses: { 200: { description: 'Success' } }
      },
      post: {
        tags: ['Project Tracking'],
        summary: 'Create Project',
        security: [{ adminAuth: [] }],
        responses: { 201: { description: 'Created' } }
      }
    },
    '/api/v1/admin/tasks/utilization': {
      get: {
        tags: ['Project Tracking'],
        summary: 'Get Resource Utilization',
        description: 'Calculates team productivity and workload intensity.',
        security: [{ adminAuth: [] }],
        parameters: [
            { name: 'startDate', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'endDate', in: 'query', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Success' } }
      }
    },
    // ==========================================
    // 10. COMPANY REGISTRATION
    // ==========================================
    '/api/v1/register': {
      post: {
        tags: ['Company Registration'],
        summary: 'Register New Company/Admin',
        description: 'SaaS Registration â€” saves an access request with company details in PENDING state. No organization is created until the Super Admin approves it.',
        security: [], // Public endpoint
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'admin@globaltech.com' },
                  password: { type: 'string', example: 'SecureP@ssw0rd' },
                  confirmPassword: { type: 'string', example: 'SecureP@ssw0rd' },
                  companyName: { type: 'string', example: 'GlobalTech Hub' },
                  phone: { type: 'string', example: '9876543210' },
                  companySize: { type: 'string', example: '50-200' },
                  industry: { type: 'string', example: 'IT Services' },
                },
                required: ['name', 'email', 'password', 'confirmPassword', 'companyName'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Request submitted successfully',
            content: { 'application/json': { schema: { type: 'object', example: { message: "Request submitted! We'll review and activate your account within 24 hours." } } } },
          },
          409: {
            description: 'Conflict - Email already exists',
            content: { 'application/json': { schema: { type: 'object', example: { errors: { email: "A request with this email is already pending approval. We'll contact you soon." } } } } },
          },
          422: {
            description: 'Unprocessable Entity - Validation Errors',
            content: { 'application/json': { schema: { type: 'object', example: { errors: { password: "Password must be at least 8 characters, contain an uppercase letter and a special character" } } } } },
          },
        },
      },
    },

    '/api/v1/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User Login',
        description: 'Authenticates a user and sets an HttpOnly cookie with the JWT token (authToken for admins, employee_token for employees).',
        security: [], // Public endpoint
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'rahul.sharma@WorkGrid.in' },
                  password: { type: 'string', example: 'SecureP@ssw0rd' },
                  role: { type: 'string', example: 'employee' }
                },
                required: ['username', 'password'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { type: 'object', example: { success: true, message: 'Login successful', user: { id: '65f1a2...', role: 'employee' } } } } },
            headers: { 'Set-Cookie': { description: 'employee_token=abc...; HttpOnly; Path=/' } },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse', example: { success: false, error: 'Invalid email or password' } } } } },
        },
      },
    },
    '/api/v1/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'User Logout',
        description: 'Clears the authentication cookie.',
        responses: {
          200: { description: 'Logout successful', content: { 'application/json': { schema: { example: { success: true, message: 'Logged out successfully' } } } } },
        },
      },
    },
    '/api/v1/session': {
      get: {
        tags: ['Authentication'],
        summary: 'Get Current Session',
        description: 'Returns the currently authenticated user based on the cookie payload.',
        responses: {
          200: { description: 'Session valid', content: { 'application/json': { schema: { example: { success: true, user: { id: '65f1a2...', name: 'Rahul Sharma', role: 'employee' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { example: { success: false, error: 'No active session found' } } } } },
        },
      },
    },

    '/api/v1/admin/payroll/employees': {
      get: {
        tags: ['Employees'],
        summary: 'List Employees',
        description: 'Retrieves a list of all employees in the organization.',
        security: [{ adminAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: { description: 'List of employees', content: { 'application/json': { schema: { example: { success: true, data: [{ _id: '...', employeeId: 'EMP001', personalDetails: { firstName: 'Rahul', lastName: 'Sharma' }, jobDetails: { department: 'Engineering' } }] } } } } },
        },
      },
      post: {
        tags: ['Employees'],
        summary: 'Create Employee',
        security: [{ adminAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                example: { employeeId: 'EMP002', personalDetails: { firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@WorkGrid.in', phone: '9876543210' }, jobDetails: { department: 'Marketing', designation: 'Manager' }, salaryDetails: { bankAccount: { accountNumber: '1234', bankName: 'HDFC', ifscCode: 'HDFC001' } }, workingHr: 9 },
              },
            },
          },
        },
        responses: {
          201: { description: 'Employee created' },
        },
      },
    },
    '/api/v1/admin/payroll/employees/{id}': {
      get: {
        tags: ['Employees'],
        summary: 'Get Employee Details',
        security: [{ adminAuth: [] }, { employeeAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Employee details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } } } },
      },
      patch: {
        tags: ['Employees'],
        summary: 'Update Employee',
        security: [{ adminAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { example: { jobDetails: { department: 'Product' } } } } } },
        responses: { 200: { description: 'Employee updated' } },
      },
      delete: {
        tags: ['Employees'],
        summary: 'Delete Employee',
        security: [{ adminAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Employee deleted' } },
      },
    },

    '/api/v1/admin/payroll/attendance/mark': {
      post: {
        tags: ['Attendance'],
        summary: 'Mark Attendance (Punch In/Out)',
        security: [{ employeeAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                example: { action: 'punch_in', location: { lat: 19.0760, lng: 72.8777 }, ipAddress: '103.11.22.33' },
              },
            },
          },
        },
        responses: {
          200: { description: 'Attendance marked', content: { 'application/json': { schema: { example: { success: true, message: 'Punched strictly at 09:05 AM', status: 'Present' } } } } },
        },
      },
    },
    '/api/v1/admin/payroll/attendance/history': {
      get: {
        tags: ['Attendance'],
        summary: 'Get Attendance History',
        security: [{ adminAuth: [] }, { employeeAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', example: '2026-03-01' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', example: '2026-03-31' } },
        ],
        responses: { 200: { description: 'History retrieved', content: { 'application/json': { schema: { example: { success: true, data: [{ date: '2026-03-20', punchIn: '09:05:00', punchOut: '18:10:00', status: 'Present', durationHours: 9.08 }] } } } } } },
      },
    },
    '/api/v1/admin/payroll/attendance/summary': {
      get: {
        tags: ['Attendance'],
        summary: 'Get Attendance Summary',
        security: [{ adminAuth: [] }, { employeeAuth: [] }],
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer', example: 3 } },
          { name: 'year', in: 'query', schema: { type: 'integer', example: 2026 } },
        ],
        responses: { 200: { description: 'Summary data', content: { 'application/json': { schema: { example: { success: true, summary: { presentDays: 20, absentDays: 1, halfDays: 1, totalWorkingDays: 22 } } } } } } },
      },
    },

    '/api/v1/admin/payroll/leaves': {
      get: {
        tags: ['Leave Management'],
        summary: 'Get Leave Applications',
        description: 'For employees: gets their leaves. For admins: gets all leaves.',
        security: [{ adminAuth: [] }, { employeeAuth: [] }],
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer', example: 3 } },
          { name: 'year', in: 'query', schema: { type: 'integer', example: 2026 } },
        ],
        responses: { 200: { description: 'Leave List', content: { 'application/json': { schema: { example: { success: true, data: [{ _id: '...', employeeId: 'EMP001', employeeName: 'Rahul Sharma', month: 3, year: 2026, status: 'Draft', leaves: [{ date: '2026-03-22', leaveType: 'Paid' }] }] } } } } } },
      },
      post: {
        tags: ['Leave Management'],
        summary: 'Apply for Leave',
        security: [{ adminAuth: [] }, { employeeAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { example: { employeeId: '65f...', month: 3, year: 2026, leaves: [{ date: '2026-03-22', leaveType: 'Paid', reason: 'Viral fever' }] } } } },
        },
        responses: { 201: { description: 'Leave applied' } },
      },
    },
    '/api/v1/admin/payroll/leaves/{id}': {
      patch: {
        tags: ['Leave Management'],
        summary: 'Approve/Reject Leave',
        security: [{ adminAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { example: { status: 'Approved' } } } } },
        responses: { 200: { description: 'State updated' } },
      },
    },

    '/api/v1/admin/payroll/run': {
      post: {
        tags: ['Payroll'],
        summary: 'Initialize Payroll Run',
        security: [{ adminAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { example: { month: 3, year: 2026, orgId: '65e...', generatedBy: '65a...' } } } },
        },
        responses: { 201: { description: 'Payroll run initialized', content: { 'application/json': { schema: { example: { success: true, runId: 'PRUN-202603-4512', status: 'Draft' } } } } } },
      },
    },
    '/api/v1/admin/payroll/payslips': {
      get: {
        tags: ['Payroll'],
        summary: 'List All Payslips (Admin)',
        security: [{ adminAuth: [] }],
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer', example: 3 } },
          { name: 'year', in: 'query', schema: { type: 'integer', example: 2026 } },
        ],
        responses: { 200: { description: 'Payslips generated', content: { 'application/json': { schema: { example: { success: true, data: [{ employeeId: 'EMP001', basic: 22500, netSalary: 42100, status: 'Generated' }] } } } } } },
      },
    },
    '/api/v1/admin/payroll/payslips/{employeeId}': {
      get: {
        tags: ['Payroll'],
        summary: 'Get Employee Payslip',
        security: [{ adminAuth: [] }, { employeeAuth: [] }],
        parameters: [
            { name: 'employeeId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'month', in: 'query', schema: { type: 'integer', example: 3 } },
            { name: 'year', in: 'query', schema: { type: 'integer', example: 2026 } }
        ],
        responses: { 200: { description: 'Detailed payslip data' } },
      },
    },

    '/api/v1/super-admin/pending-requests': {
      get: {
        tags: ['Super Admin'],
        summary: 'Get Pending Client Registrations',
        security: [{ superAdminAuth: [] }, { adminAuth: [] }],
        responses: { 200: { description: 'List of pending organizations', content: { 'application/json': { schema: { example: { success: true, requests: [{ _id: '...', companyName: 'GlobalTech Hub', email: 'admin@globaltech.com', industry: 'IT Services', requestedAt: '2026-03-19T10:00:00Z' }] } } } } } },
      },
    },
    '/api/v1/super-admin/approve-request': {
      post: {
        tags: ['Super Admin'],
        summary: 'Approve/Reject Client Registration',
        security: [{ superAdminAuth: [] }, { adminAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { example: { userId: '12345abcd', action: 'approve' } } } },
        },
        responses: { 200: { description: 'Action recorded', content: { 'application/json': { schema: { example: { success: true, message: 'Client approved and onboarding email sent.' } } } } } },
      },
    },

    '/api/v1/employee/profile': {
      get: {
        tags: ['Employee'],
        summary: 'Get Own Profile',
        security: [{ employeeAuth: [] }],
        responses: {
          200: {
            description: 'Employee profile retrieved',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } }
          }
        }
      }
    },
    '/api/v1/employee/attendance': {
      get: {
        tags: ['Employee'],
        summary: 'Get Own Attendance Log',
        security: [{ employeeAuth: [] }],
        responses: { 
          200: { 
            description: 'Success', 
            content: { 'application/json': { schema: { type: 'object', example: { success: true, data: [{ date: '2026-03-20', punchIn: '09:00', punchOut: '17:00' }] } } } } 
          } 
        }
      }
    },
    '/api/v1/employee/leaves': {
      get: {
        tags: ['Employee'],
        summary: 'Get Own Leave Requests',
        security: [{ employeeAuth: [] }],
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { type: 'object', example: { success: true, data: [{ date: '2026-03-22', leaveType: 'Paid', status: 'Approved' }] } } } }
          }
        }
      },
      post: {
        tags: ['Employee'],
        summary: 'Apply for Leave',
        security: [{ employeeAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  leaveType: { type: 'string', example: 'Sick Leave' },
                  date: { type: 'string', example: '2026-03-24' },
                  reason: { type: 'string', example: 'Medical appointment' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Leave applied successfully' } }
      }
    },
    '/api/v1/employee/payslips': {
      get: {
        tags: ['Employee'],
        summary: 'Get Own Payslips',
        security: [{ employeeAuth: [] }],
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { type: 'object', example: { success: true, data: [{ month: 3, year: 2026, netSalary: 45000, status: 'Generated' }] } } } }
          }
        }
      }
    }
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/app/api/**/*.js'], // Will pick up any JSDoc annotations in routes to merge with above
};

export default swaggerJsdoc(options);
