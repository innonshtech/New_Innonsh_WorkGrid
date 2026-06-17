import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { logActivity } from "@/lib/logger";

const MAX_ROWS = 2000;

function normalizeKey(key) {
  return String(key || "").trim().toLowerCase();
}

function asString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).toString().replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function isProbablyObjectId(value) {
  const s = asString(value);
  return /^[a-f0-9]{24}$/i.test(s);
}

function excelDateToJSDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  // Excel serial date number
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  }

  const s = asString(value);
  if (!s) return null;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  return null;
}

function getCell(row, candidates) {
  for (const c of candidates) {
    const v = row[normalizeKey(c)];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}

function parseRowsFromWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) return [];

  const ws = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: true });

  return rawRows
    .map((r) => {
      const out = {};
      for (const [k, v] of Object.entries(r || {})) {
        out[normalizeKey(k)] = v;
      }
      return out;
    })
    .filter((r) => Object.values(r).some((v) => asString(v) !== ""));
}

async function getNextEmployeeIdSeed() {
  const lastEmployee = await prisma.employee.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { employeeId: true }
  });
  const last = lastEmployee?.employeeId ? String(lastEmployee.employeeId) : "";
  const lastNum = parseInt(last.replace(/\D/g, ""), 10);
  return Number.isFinite(lastNum) ? lastNum + 1 : 1;
}

function buildEmployeeId(n) {
  return `EMP${String(n).padStart(3, "0")}`;
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

    const form = await request.formData();
    const file = form.get("file");
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ success: false, error: "Invalid file upload" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const rows = parseRowsFromWorkbook(buf);

    if (!rows.length) {
      return NextResponse.json({ success: false, error: "No rows found in the sheet" }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { success: false, error: `Too many rows. Max allowed is ${MAX_ROWS}` },
        { status: 400 }
      );
    }

    const orgIdFromAuth = authUser.organizationId ? String(authUser.organizationId) : null;
    const needsOrgFromSheet = authUser.role === "super_admin" && !orgIdFromAuth;

    // Load org data (optional but nice for employee.jobDetails.organization).
    // Stores { prismaId: string, name: string } keyed by original (potentially legacy mongo) orgId
    const orgDataById = new Map();
    async function getOrgData(orgIdMaybeMongo) {
      const key = String(orgIdMaybeMongo);
      if (orgDataById.has(key)) return orgDataById.get(key);
      const org = await prisma.organization.findFirst({
        where: { OR: [{ id: orgIdMaybeMongo }, { mongoId: orgIdMaybeMongo }] },
        select: { id: true, name: true }
      });
      const data = { prismaId: org?.id || null, name: org?.name || "" };
      orgDataById.set(key, data);
      return data;
    }

    // Preload departments for the org (when org is fixed).
    // deptMap: key is original (potentially legacy mongo) orgId, value is another map: lowerName -> { id, departmentName }
    const deptMap = new Map();
    async function ensureDeptMap(orgIdMaybeMongo) {
      const orgKey = String(orgIdMaybeMongo);
      if (deptMap.has(orgKey)) return;

      const orgData = await getOrgData(orgIdMaybeMongo);
      const actualOrgId = orgData.prismaId;
      if (!actualOrgId) {
        deptMap.set(orgKey, new Map());
        return;
      }

      const depts = await prisma.department.findMany({
        where: { organizationId: actualOrgId },
        select: { id: true, departmentName: true }
      });
      const m = new Map();
      for (const d of depts) {
        m.set(String(d.departmentName || "").trim().toLowerCase(), { id: d.id, departmentName: d.departmentName });
      }
      deptMap.set(orgKey, m);
    }

    const errors = [];
    const toInsert = [];
    const rowMeta = [];

    // First pass: validate + normalize + build docs.
    let employeeIdSeed = await getNextEmployeeIdSeed();

    const emailsInFile = new Map(); // emailLower -> rowNumber
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // header row is 1
      const row = rows[i];

      const firstName = asString(getCell(row, ["firstName", "first name"]));
      const lastName = asString(getCell(row, ["lastName", "last name"]));
      const email = asString(getCell(row, ["email", "emailAddress", "email address"])).toLowerCase();
      const phone = asString(getCell(row, ["phone", "mobile", "mobileNumber", "mobile number"])).replace(/\s/g, "");
      const dateOfJoiningRaw = getCell(row, ["dateOfJoining", "date of joining", "doj"]);
      const doj = excelDateToJSDate(dateOfJoiningRaw);

      const designation = asString(getCell(row, ["designation", "jobTitle", "job title"]));
      const workingHr = asNumber(getCell(row, ["workingHr", "working hours", "workingHours", "working hours (per day)"])) ?? 8;

      const basicSalary = asNumber(getCell(row, ["basicSalary", "basic salary"])) ?? null;
      const salaryType = asString(getCell(row, ["salaryType", "salary type"])) || "monthly";

      const bankAccountNumber = asString(getCell(row, ["bankAccountNumber", "accountNumber", "account number"]));
      const bankName = asString(getCell(row, ["bankName", "bank name"]));
      const ifscCode = asString(getCell(row, ["ifscCode", "ifsc", "ifsc code"])).toUpperCase();

      const departmentIdRaw = getCell(row, ["departmentId", "department id"]);
      const departmentNameRaw = asString(getCell(row, ["departmentName", "department name", "department"]));

      const organizationIdRaw = needsOrgFromSheet ? getCell(row, ["organizationId", "organization id"]) : null;
      const currentOrgIdMaybeMongo = needsOrgFromSheet ? asString(organizationIdRaw) : orgIdFromAuth;

      if (!currentOrgIdMaybeMongo) {
        errors.push({ row: rowNumber, email, error: "Organization is required (missing auth org and organizationId column)" });
        continue;
      }

      const orgData = await getOrgData(currentOrgIdMaybeMongo);
      const actualOrgId = orgData.prismaId;
      const organizationName = orgData.name;

      if (!actualOrgId) {
        errors.push({ row: rowNumber, email, error: `Organization not found for ID: ${currentOrgIdMaybeMongo}` });
        continue;
      }

      if (!firstName || !lastName || !email || !phone || !doj) {
        errors.push({
          row: rowNumber,
          email,
          error: "Missing required fields: firstName, lastName, email, phone, dateOfJoining",
        });
        continue;
      }

      if (!designation) {
        errors.push({ row: rowNumber, email, error: "Designation is required" });
        continue;
      }

      if (!basicSalary || basicSalary <= 0) {
        errors.push({ row: rowNumber, email, error: "basicSalary must be > 0" });
        continue;
      }

      if (!bankAccountNumber || !bankName || !ifscCode) {
        errors.push({
          row: rowNumber,
          email,
          error: "Missing bank details: bankAccountNumber, bankName, ifscCode",
        });
        continue;
      }

      const emailKey = email.toLowerCase();
      if (emailsInFile.has(emailKey)) {
        errors.push({
          row: rowNumber,
          email,
          error: `Duplicate email in file (already used on row ${emailsInFile.get(emailKey)})`,
        });
        continue;
      }
      emailsInFile.set(emailKey, rowNumber);

      // Department lookup
      let departmentId = null;
      let departmentName = "";
      if (departmentIdRaw && isProbablyObjectId(departmentIdRaw)) {
        const existingDept = await prisma.department.findFirst({
            where: { OR: [{ id: asString(departmentIdRaw) }, { mongoId: asString(departmentIdRaw) }] },
            select: { id: true, departmentName: true }
        });
        if (!existingDept) {
            errors.push({
                row: rowNumber,
                email,
                error: `Department ID not found: ${departmentIdRaw}`,
            });
            continue;
        }
        departmentId = existingDept.id;
        departmentName = existingDept.departmentName || "";
      } else if (departmentNameRaw) {
        await ensureDeptMap(currentOrgIdMaybeMongo);
        const m = deptMap.get(currentOrgIdMaybeMongo);
        const d = m.get(departmentNameRaw.trim().toLowerCase());
        if (!d) {
          errors.push({
            row: rowNumber,
            email,
            error: `Department not found: ${departmentNameRaw} for organization ID ${currentOrgIdMaybeMongo}`,
          });
          continue;
        }
        departmentId = String(d.id);
        departmentName = d.departmentName;
      } else {
        errors.push({ row: rowNumber, email, error: "Department is required (departmentName or departmentId)" });
        continue;
      }

      const employeeId = asString(getCell(row, ["employeeId", "employee id"])) || buildEmployeeId(employeeIdSeed++);

      const doc = {
        employeeId,
        role: asString(getCell(row, ["role"])) || "employee",
        status: asString(getCell(row, ["status"])) || "Active",
        firstName,
        lastName,
        email,
        phone,
        dateOfJoining: doj,
        organizationId: actualOrgId,
        departmentId,
        department: departmentName || departmentNameRaw || "Unknown",
        designation,
        workingHr,
        payslipStructure: {
          salaryType,
          basicSalary,
          earnings: [],
          deductions: [],
          additionalFields: [],
        },
        bankAccountNumber,
        bankName,
        ifscCode,
        createdById: authUser.id,
      };

      toInsert.push(doc);
      rowMeta.push({ row: rowNumber, email, employeeId });
    }

    if (!toInsert.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid rows to import",
          summary: { created: 0, skipped: 0, failed: errors.length },
          errors,
        },
        { status: 400 }
      );
    }

    // Pre-check existing emails to skip duplicates already in DB.
    const allEmails = toInsert.map((d) => d.email.toLowerCase());
    const existing = await prisma.employee.findMany({
      where: {
        email: { in: allEmails },
      },
      select: {
        email: true
      }
    });
    const existingEmails = new Set(existing.map((e) => String(e.email || "").toLowerCase()));

    const filteredDocs = [];
    const filteredMeta = [];
    let skipped = 0;
    for (let i = 0; i < toInsert.length; i++) {
      const email = String(toInsert[i].email || "").toLowerCase();
      if (existingEmails.has(email)) {
        skipped++;
        continue;
      }
      filteredDocs.push(toInsert[i]);
      filteredMeta.push(rowMeta[i]);
    }

    let created = 0;
    let failed = errors.length;

    if (filteredDocs.length) {
      try {
        const insertResult = await prisma.employee.createMany({
          data: filteredDocs,
        });
        created = insertResult.count;
      } catch (err) {
        created = 0;
        const meta = filteredMeta[0] || {};
        errors.push({
          row: meta.row || null,
          email: meta.email || null,
          error: err.message || "Failed to insert employees (database constraint violation or other error)",
        });
      }
    }

    failed = errors.length;

    await logActivity({
      action: "bulk_imported",
      entity: "Employee",
      description: `Bulk import employees: created=${created}, skipped=${skipped}, failed=${failed}`,
      performedBy: { userId: authUser.id, name: authUser.name, role: authUser.role },
      details: { created, skipped, failed },
      req: request,
    });

    return NextResponse.json({
      success: true,
      message: "Bulk import processed",
      summary: { created, skipped, failed },
      errors,
    });
  } catch (error) {
    const msg = error?.message || "Server error";
    const status = msg.startsWith("Unauthorized") ? 401 : msg.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}