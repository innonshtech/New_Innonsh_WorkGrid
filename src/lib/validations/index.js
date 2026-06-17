import { z } from 'zod';

// ==========================================
// Employee Validation Schemas
// ==========================================

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters long")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirm password do not match",
  path: ["confirmPassword"]
});

// ==========================================
// Recruitment Validation Schemas
// ==========================================

export const CreateJobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  workplaceType: z.enum(['On-site', 'Remote', 'Hybrid']).optional().default('On-site'),
  headcount: z.number().min(1).optional().default(1),
  experienceLevel: z.enum(['Entry', 'Mid', 'Senior', 'Executive', 'Fresher', '1-3 years', '3-5 years', '5-10 years', '10+ years']).optional().nullable(),
  hiringManagerName: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.array(z.string()).optional(),
  salaryRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().default('INR')
  }).optional(),
  targetDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
});

export const UpdateJobSchema = CreateJobSchema.partial();
