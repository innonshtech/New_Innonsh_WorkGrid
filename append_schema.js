const fs = require('fs');

const appendText = `
model SalaryComponent {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  name            String    @unique
  type            String
  calculationType String
  percentageOf    String    @default("Basic")
  defaultValue    Float     @default(0)
  category        String    @default("Standard")
  isTaxable       Boolean   @default(true)
  isStatutory     Boolean   @default(false)
  enabled         Boolean   @default(true)
  description     String?
  displayOrder    Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model PayrollConfig {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  companyId       String?
  configData      Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model PayrollRun {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  organizationId  String?
  month           Int
  year            Int
  status          String    @default("Draft")
  processedBy     String?
  runData         Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  payslips        Payslip[]
}

model Payslip {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String
  organizationId  String
  payrollRunId    String?
  payslipId       String    @unique
  month           Int
  year            Int
  
  basicSalary     Float
  grossSalary     Float
  totalDeductions Float
  netSalary       Float
  
  workingDays     Float
  presentDays     Float
  leaveDays       Float     @default(0)
  paidLeaveDays   Float     @default(0)
  unpaidLeaveDays Float     @default(0)
  overtimeHours   Float     @default(0)
  overtimeAmount  Float     @default(0)
  totalDays       Float     @default(0)
  weeklyOffs      Float     @default(0)
  halfDays        Float     @default(0)
  holidays        Float     @default(0)
  paidDays        Float     @default(0)
  lopDays         Float     @default(0)
  
  status          String    @default("Draft")
  paymentDate     DateTime?
  paymentMethod   String?
  notes           String?
  
  organizationName String
  salaryType      String
  employeeType    String?
  
  earnings        Json?
  deductions      Json?
  pfDetails       Json?
  esicDetails     Json?
  professionalTax Float     @default(0)
  leaveDetails    Json?

  isPFApplicable   Boolean   @default(false)
  isESICApplicable Boolean   @default(false)
  isPTApplicable   Boolean   @default(false)

  generatedById   String
  approvedById    String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  payrollRun      PayrollRun? @relation(fields: [payrollRunId], references: [id])
}

model Bonus {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String?
  amount          Float
  reason          String?
  date            DateTime?
  status          String    @default("Pending")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Loan {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String?
  amount          Float
  emi             Float?
  status          String    @default("Active")
  loanData        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model ShiftRoster {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String?
  date            DateTime?
  shiftData       Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model TaxCalculation {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String?
  taxData         Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
`;

fs.appendFileSync('prisma/schema.prisma', appendText);
console.log("Appended Payroll models to schema.prisma");
