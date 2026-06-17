const fs = require('fs');

const appendText = `
// Tasks & Talent
model Project {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  organizationId  String?
  name            String
  description     String?
  status          String    @default("Active")
  projectData     Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Task {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  projectId       String?
  employeeId      String?
  title           String
  description     String?
  status          String    @default("Pending")
  priority        String    @default("Medium")
  dueDate         DateTime?
  taskData        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Timesheet {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String?
  projectId       String?
  taskId          String?
  date            DateTime?
  hours           Float     @default(0)
  status          String    @default("Draft")
  timesheetData   Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model PerformanceGoal {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String?
  title           String
  status          String    @default("Active")
  progress        Float     @default(0)
  goalData        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Appraisal {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String?
  managerId       String?
  status          String    @default("Draft")
  appraisalData   Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Skill {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  name            String    @unique
  category        String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Recruitment & Staffing
model JobRequisition {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  organizationId  String?
  departmentId    String?
  title           String
  status          String    @default("Open")
  jobData         Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Candidate {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  jobRequisitionId String?
  firstName       String
  lastName        String
  email           String
  phone           String?
  status          String    @default("New")
  candidateData   Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model OfferLetter {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  candidateId     String?
  status          String    @default("Draft")
  offerData       Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model StaffingClient {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  organizationId  String?
  name            String
  status          String    @default("Active")
  clientData      Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model StaffingRequirement {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  clientId        String?
  title           String
  status          String    @default("Open")
  requirementData Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Engagement & HR
model ExitRequest {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String?
  status          String    @default("Pending")
  resignationDate DateTime?
  lastWorkingDate DateTime?
  reason          String?
  exitData        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model NotificationConfig {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String?
  configData      Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Notification {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  employeeId      String?
  title           String
  message         String
  isRead          Boolean   @default(false)
  type            String    @default("System")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model ShoutOut {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  fromEmployeeId  String?
  toEmployeeId    String?
  message         String
  shoutOutData    Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model PulseSurvey {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  organizationId  String?
  title           String
  status          String    @default("Active")
  surveyData      Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Core System
model ActivityLog {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  userId          String?
  action          String
  module          String
  logData         Json?
  createdAt       DateTime  @default(now())
}

model Asset {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  organizationId  String?
  employeeId      String?
  name            String
  status          String    @default("Available")
  assetData       Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Subscription {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  organizationId  String?
  plan            String
  status          String    @default("Active")
  subscriptionData Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model DemoRequest {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  name            String
  email           String
  company         String?
  status          String    @default("New")
  requestData     Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
`;

fs.appendFileSync('prisma/schema.prisma', appendText);
console.log("Appended remaining models to schema.prisma");
