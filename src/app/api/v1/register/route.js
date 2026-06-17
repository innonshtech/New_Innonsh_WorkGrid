// src/app/api/v1/register/route.js
// SaaS Registration — saves an access request in PENDING state.
// No org is created until the Super Admin approves the request.

import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcrypt';


const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => !v || /^[6-9]\d{9}$/.test(v.replace(/[\s\-]/g, ""));
const isStrongPass = (v) => v && v.length >= 8 && /[A-Z]/.test(v) && /[!@#$%^&*(),.?":{}|<>]/.test(v);

export async function POST(req) {
  try {
    

    const body = await req.json();
    const { name, email, password, confirmPassword, companyName, phone, companySize, industry } = body;

    // ── Validation ──────────────────────────────────────────
    const errors = {};
    if (!name?.trim())                errors.name           = "Full name is required";
    if (!email?.trim())               errors.email          = "Work email is required";
    else if (!isValidEmail(email))    errors.email          = "Enter a valid email address";
    if (!password)                    errors.password       = "Password is required";
    else if (!isStrongPass(password)) errors.password       = "Password must be at least 8 characters, contain an uppercase letter and a special character";
    if (!confirmPassword)             errors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!companyName?.trim())         errors.companyName    = "Company name is required";
    if (phone && !isValidPhone(phone)) errors.phone         = "Enter a valid 10-digit phone number";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    // ── Duplicate email check ────────────────────────────────
    const existingUser = await prisma.user.findFirst({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      const msg =
        existingUser.status === "pending"
          ? "A request with this email is already pending approval. We'll contact you soon."
          : "An account with this email already exists. Please log in.";
      return NextResponse.json({ errors: { email: msg } }, { status: 409 });
    }

    // ── Save as PENDING — NO org created yet ─────────────────
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await prisma.user.create({ data: {
      name:        name.trim(),
      email:       email.toLowerCase().trim(),
      password:    hashedPassword,
      role:        "admin",
      companyName: companyName.trim(),
      phone:       phone || "",
      plan:        "trial",
      isActive:    false,            // BLOCKED until super admin approves
      status:      "pending",        // approval queue flag
      industry:    industry || "",
      companySize: companySize || "",
    } });

    return NextResponse.json(
      { message: "Request submitted! We'll review and activate your account within 24 hours." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { errors: { email: "An account with this email already exists." } },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: "Server error. Please try again later." }, { status: 500 });
  }
}
