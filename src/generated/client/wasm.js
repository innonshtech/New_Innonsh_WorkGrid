
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.14.0
 * Query Engine version: e9771e62de70f79a5e1c604a2d7c8e2a0a874b48
 */
Prisma.prismaVersion = {
  client: "5.14.0",
  engine: "e9771e62de70f79a5e1c604a2d7c8e2a0a874b48"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  name: 'name',
  email: 'email',
  password: 'password',
  role: 'role',
  roleId: 'roleId',
  permissions: 'permissions',
  status: 'status',
  organizationId: 'organizationId',
  companyName: 'companyName',
  phone: 'phone',
  industry: 'industry',
  companySize: 'companySize',
  plan: 'plan',
  planExpiresAt: 'planExpiresAt',
  isEmailVerified: 'isEmailVerified',
  department: 'department',
  position: 'position',
  employeeId: 'employeeId',
  isActive: 'isActive',
  sessionToken: 'sessionToken',
  forgotPasswordToken: 'forgotPasswordToken',
  forgotPasswordExpires: 'forgotPasswordExpires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  orgId: 'orgId',
  name: 'name',
  description: 'description',
  email: 'email',
  phone: 'phone',
  street: 'street',
  status: 'status',
  website: 'website',
  memberCount: 'memberCount',
  established: 'established',
  logo: 'logo',
  linkedinCompanyId: 'linkedinCompanyId',
  createdById: 'createdById',
  updatedById: 'updatedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  password: 'password',
  role: 'role',
  roleId: 'roleId',
  isCompliant: 'isCompliant',
  isTDSApplicable: 'isTDSApplicable',
  taxRegime: 'taxRegime',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  bloodGroup: 'bloodGroup',
  dateOfJoining: 'dateOfJoining',
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  department: 'department',
  departmentId: 'departmentId',
  employeeType: 'employeeType',
  employeeTypeId: 'employeeTypeId',
  category: 'category',
  categoryId: 'categoryId',
  organizationId: 'organizationId',
  businessUnitId: 'businessUnitId',
  teamId: 'teamId',
  costCenterId: 'costCenterId',
  designation: 'designation',
  reportingManager: 'reportingManager',
  teamLead: 'teamLead',
  workLocation: 'workLocation',
  assignedOfficeId: 'assignedOfficeId',
  biometricDeviceId: 'biometricDeviceId',
  defaultShift: 'defaultShift',
  workState: 'workState',
  holidayListId: 'holidayListId',
  bankAccountNumber: 'bankAccountNumber',
  bankName: 'bankName',
  ifscCode: 'ifscCode',
  branch: 'branch',
  branchAddress: 'branchAddress',
  panNumber: 'panNumber',
  aadharNumber: 'aadharNumber',
  workingHr: 'workingHr',
  otApplicable: 'otApplicable',
  esicApplicable: 'esicApplicable',
  pfApplicable: 'pfApplicable',
  pfType: 'pfType',
  probation: 'probation',
  probationDuration: 'probationDuration',
  isAttending: 'isAttending',
  gratuityApplicable: 'gratuityApplicable',
  hraApplicable: 'hraApplicable',
  compOffBalance: 'compOffBalance',
  status: 'status',
  createdById: 'createdById',
  updatedById: 'updatedById',
  payslipStructure: 'payslipStructure',
  variablePayStructure: 'variablePayStructure',
  attendanceApproval: 'attendanceApproval',
  documents: 'documents',
  address: 'address',
  temporaryAddress: 'temporaryAddress',
  permanentAddress: 'permanentAddress',
  emergencyContact: 'emergencyContact',
  sessionToken: 'sessionToken',
  forgotPasswordToken: 'forgotPasswordToken',
  forgotPasswordExpires: 'forgotPasswordExpires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  date: 'date',
  checkIn: 'checkIn',
  checkOut: 'checkOut',
  totalHours: 'totalHours',
  status: 'status',
  isProxy: 'isProxy',
  proxyDetails: 'proxyDetails',
  overtimeHours: 'overtimeHours',
  dayType: 'dayType',
  workedHours: 'workedHours',
  notes: 'notes',
  location: 'location',
  attendanceMethod: 'attendanceMethod',
  distanceFromOffice: 'distanceFromOffice',
  isGeofenceVerified: 'isGeofenceVerified',
  verificationFailureReason: 'verificationFailureReason',
  ipAddress: 'ipAddress',
  deviceId: 'deviceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  employeeCode: 'employeeCode',
  employeeName: 'employeeName',
  organizationId: 'organizationId',
  organizationType: 'organizationType',
  department: 'department',
  month: 'month',
  year: 'year',
  leaves: 'leaves',
  summary: 'summary',
  annualLeaveBalance: 'annualLeaveBalance',
  status: 'status',
  notes: 'notes',
  createdById: 'createdById',
  updatedById: 'updatedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HelpdeskTicketScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  subject: 'subject',
  category: 'category',
  priority: 'priority',
  status: 'status',
  description: 'description',
  comments: 'comments',
  assignedTo: 'assignedTo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  businessUnitId: 'businessUnitId',
  departmentName: 'departmentName',
  status: 'status',
  permissions: 'permissions',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OfficeLocationScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  locationName: 'locationName',
  address: 'address',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TeamScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  departmentId: 'departmentId',
  teamName: 'teamName',
  name: 'name',
  teamLeadId: 'teamLeadId',
  description: 'description',
  status: 'status',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BusinessUnitScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  unitName: 'unitName',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DesignationScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  title: 'title',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeTypeScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  departmentId: 'departmentId',
  type: 'type',
  employeeType: 'employeeType',
  status: 'status',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeCategoryScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  departmentId: 'departmentId',
  employeeTypeId: 'employeeTypeId',
  categoryName: 'categoryName',
  employeeCategory: 'employeeCategory',
  supportedDocuments: 'supportedDocuments',
  status: 'status',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  roleName: 'roleName',
  permissions: 'permissions',
  status: 'status',
  roleData: 'roleData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  name: 'name',
  slug: 'slug',
  module: 'module',
  description: 'description',
  actions: 'actions',
  createdById: 'createdById',
  updatedById: 'updatedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalaryComponentScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  name: 'name',
  type: 'type',
  calculationType: 'calculationType',
  percentageOf: 'percentageOf',
  defaultValue: 'defaultValue',
  category: 'category',
  isTaxable: 'isTaxable',
  isStatutory: 'isStatutory',
  enabled: 'enabled',
  description: 'description',
  displayOrder: 'displayOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollConfigScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  companyId: 'companyId',
  configData: 'configData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollRunScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  month: 'month',
  year: 'year',
  status: 'status',
  processedBy: 'processedBy',
  runData: 'runData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayslipScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  organizationId: 'organizationId',
  payrollRunId: 'payrollRunId',
  payslipId: 'payslipId',
  month: 'month',
  year: 'year',
  basicSalary: 'basicSalary',
  grossSalary: 'grossSalary',
  totalDeductions: 'totalDeductions',
  netSalary: 'netSalary',
  workingDays: 'workingDays',
  presentDays: 'presentDays',
  leaveDays: 'leaveDays',
  paidLeaveDays: 'paidLeaveDays',
  unpaidLeaveDays: 'unpaidLeaveDays',
  overtimeHours: 'overtimeHours',
  overtimeAmount: 'overtimeAmount',
  totalDays: 'totalDays',
  weeklyOffs: 'weeklyOffs',
  halfDays: 'halfDays',
  holidays: 'holidays',
  paidDays: 'paidDays',
  lopDays: 'lopDays',
  status: 'status',
  paymentDate: 'paymentDate',
  paymentMethod: 'paymentMethod',
  notes: 'notes',
  organizationName: 'organizationName',
  salaryType: 'salaryType',
  employeeType: 'employeeType',
  earnings: 'earnings',
  deductions: 'deductions',
  pfDetails: 'pfDetails',
  esicDetails: 'esicDetails',
  professionalTax: 'professionalTax',
  leaveDetails: 'leaveDetails',
  isPFApplicable: 'isPFApplicable',
  isESICApplicable: 'isESICApplicable',
  isPTApplicable: 'isPTApplicable',
  generatedById: 'generatedById',
  approvedById: 'approvedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BonusScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  amount: 'amount',
  reason: 'reason',
  date: 'date',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId',
  modelData: 'modelData'
};

exports.Prisma.LoanScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  amount: 'amount',
  emi: 'emi',
  status: 'status',
  loanData: 'loanData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ShiftRosterScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  date: 'date',
  shiftData: 'shiftData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaxCalculationScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  taxData: 'taxData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  name: 'name',
  description: 'description',
  status: 'status',
  projectData: 'projectData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaskScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  projectId: 'projectId',
  employeeId: 'employeeId',
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  dueDate: 'dueDate',
  taskData: 'taskData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TimesheetScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  projectId: 'projectId',
  taskId: 'taskId',
  date: 'date',
  hours: 'hours',
  status: 'status',
  timesheetData: 'timesheetData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PerformanceGoalScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  title: 'title',
  status: 'status',
  progress: 'progress',
  goalData: 'goalData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AppraisalScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  managerId: 'managerId',
  status: 'status',
  appraisalData: 'appraisalData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SkillScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  name: 'name',
  category: 'category',
  proficiency: 'proficiency',
  lastAssessed: 'lastAssessed',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.JobRequisitionScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  departmentId: 'departmentId',
  title: 'title',
  status: 'status',
  jobData: 'jobData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CandidateScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  jobRequisitionId: 'jobRequisitionId',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  status: 'status',
  candidateData: 'candidateData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OfferLetterScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  candidateId: 'candidateId',
  status: 'status',
  offerData: 'offerData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaffingClientScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  name: 'name',
  status: 'status',
  clientData: 'clientData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaffingRequirementScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  clientId: 'clientId',
  title: 'title',
  status: 'status',
  requirementData: 'requirementData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExitRequestScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  status: 'status',
  resignationDate: 'resignationDate',
  lastWorkingDate: 'lastWorkingDate',
  reason: 'reason',
  exitData: 'exitData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationConfigScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  configData: 'configData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  title: 'title',
  message: 'message',
  isRead: 'isRead',
  type: 'type',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ShoutOutScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  fromEmployeeId: 'fromEmployeeId',
  toEmployeeId: 'toEmployeeId',
  message: 'message',
  shoutOutData: 'shoutOutData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PulseSurveyScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  title: 'title',
  status: 'status',
  surveyData: 'surveyData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ActivityLogScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  userId: 'userId',
  action: 'action',
  module: 'module',
  logData: 'logData',
  createdAt: 'createdAt'
};

exports.Prisma.AssetScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  name: 'name',
  status: 'status',
  assetData: 'assetData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubscriptionScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  plan: 'plan',
  status: 'status',
  subscriptionData: 'subscriptionData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DemoRequestScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  name: 'name',
  email: 'email',
  company: 'company',
  status: 'status',
  requestData: 'requestData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HolidayListScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  name: 'name',
  year: 'year',
  isDefault: 'isDefault',
  applicableLocations: 'applicableLocations',
  status: 'status',
  holidayListData: 'holidayListData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HolidayScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  holidayListId: 'holidayListId',
  organizationId: 'organizationId',
  name: 'name',
  date: 'date',
  isRestricted: 'isRestricted',
  status: 'status',
  holidayData: 'holidayData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RestrictedHolidayClaimScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  employeeId: 'employeeId',
  holidayId: 'holidayId',
  year: 'year',
  status: 'status',
  claimData: 'claimData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssetexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomTemplateScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DocumentScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  name: 'name',
  description: 'description',
  documentCategory: 'documentCategory',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DocumentexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeCategoryexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeConfigScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeConfigexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeSubCategoryScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  employeeSubCategory: 'employeeSubCategory',
  employeeCategoryId: 'employeeCategoryId',
  departmentId: 'departmentId',
  employeeTypeId: 'employeeTypeId',
  status: 'status',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeSubCategoryexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeTypeexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BankScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrganizationexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TemplateScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TemplateconstScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DemoRequestexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PulseResponseScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExitRequestexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CostCenterScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExpenseScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.JournalEntryScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VendorScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VendorInvoiceScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FnFSettlementScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FnFSettlementexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HandbookDocumentScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApprovalWorkflowScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceRegularizationScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceThresholdScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceThresholdconstScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ComplianceReportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ComplianceReportexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompOffRequestScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DocumentReminderScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DocumentRequirementScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OvertimeRequestScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetroAdjustmentScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollVariableInputScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VariablePayConfigScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StatutoryConfigScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmploymentHistoryScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvestmentDeclarationScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveApplicationScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveApplicationexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkingShiftScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductCatalogScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductCatalogexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InterviewFeedbackScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OnboardingChecklistScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaffingCandidateScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaffingCandidateconstScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaffingClientconstScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaffingRequirementconstScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaffingSubmissionScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaffingSubmissionconstScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CareerPathScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProjectexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaskexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TimesheetexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TimesheetEntryScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TimesheetEntryexportScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserconstScalarFieldEnum = {
  id: 'id',
  mongoId: 'mongoId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  status: 'status',
  modelData: 'modelData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollComponentMasterScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  code: 'code',
  name: 'name',
  category: 'category',
  subCategory: 'subCategory',
  formulaType: 'formulaType',
  formulaConfig: 'formulaConfig',
  dependsOn: 'dependsOn',
  isTaxable: 'isTaxable',
  isPartOfGross: 'isPartOfGross',
  isPartOfCTC: 'isPartOfCTC',
  isPFWageComponent: 'isPFWageComponent',
  isESIWageComponent: 'isESIWageComponent',
  displayOrder: 'displayOrder',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollSalaryTemplateScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  description: 'description',
  employeeType: 'employeeType',
  isDefault: 'isDefault',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollTemplateComponentScalarFieldEnum = {
  id: 'id',
  templateId: 'templateId',
  componentCode: 'componentCode',
  overrideFormula: 'overrideFormula',
  isMandatory: 'isMandatory',
  displayOrder: 'displayOrder',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollEmployeeSalaryScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  organizationId: 'organizationId',
  templateId: 'templateId',
  ctc: 'ctc',
  basicSalary: 'basicSalary',
  grossSalary: 'grossSalary',
  componentValues: 'componentValues',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  revisionReason: 'revisionReason',
  revisionLetter: 'revisionLetter',
  status: 'status',
  approvedById: 'approvedById',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollPFConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  pfWageComponents: 'pfWageComponents',
  pfCeiling: 'pfCeiling',
  employeePFRate: 'employeePFRate',
  employerPFRate: 'employerPFRate',
  epsRate: 'epsRate',
  adminChargeRate: 'adminChargeRate',
  edliRate: 'edliRate',
  restrictToCeiling: 'restrictToCeiling',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollESIConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  grossThreshold: 'grossThreshold',
  employeeRate: 'employeeRate',
  employerRate: 'employerRate',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollPTSlabConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  state: 'state',
  slabFrom: 'slabFrom',
  slabTo: 'slabTo',
  amount: 'amount',
  monthOverrides: 'monthOverrides',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollLWFConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  state: 'state',
  employeeAmount: 'employeeAmount',
  employerAmount: 'employerAmount',
  frequency: 'frequency',
  applicableMonths: 'applicableMonths',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollTaxSlabConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  regime: 'regime',
  financialYear: 'financialYear',
  slabFrom: 'slabFrom',
  slabTo: 'slabTo',
  rate: 'rate',
  surchargeThreshold: 'surchargeThreshold',
  surchargeRate: 'surchargeRate',
  cessRate: 'cessRate',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollTaxSectionConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  sectionCode: 'sectionCode',
  name: 'name',
  maxLimit: 'maxLimit',
  applicableRegime: 'applicableRegime',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollBonusConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  bonusType: 'bonusType',
  name: 'name',
  calculationMethod: 'calculationMethod',
  percentage: 'percentage',
  flatAmount: 'flatAmount',
  eligibleComponents: 'eligibleComponents',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollOTConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  baseSalaryComponents: 'baseSalaryComponents',
  workingDaysPerMonth: 'workingDaysPerMonth',
  workingHoursPerDay: 'workingHoursPerDay',
  otMultiplier: 'otMultiplier',
  maxOTHoursPerMonth: 'maxOTHoursPerMonth',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollGratuityConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  minServiceYears: 'minServiceYears',
  daysPerYear: 'daysPerYear',
  divisor: 'divisor',
  maxAmount: 'maxAmount',
  eligibleComponents: 'eligibleComponents',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollRoundingConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  componentType: 'componentType',
  roundingMethod: 'roundingMethod',
  decimalPlaces: 'decimalPlaces',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollCalculationLogScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  payrollMonth: 'payrollMonth',
  payrollYear: 'payrollYear',
  payrollRunId: 'payrollRunId',
  stepNumber: 'stepNumber',
  stepName: 'stepName',
  componentCode: 'componentCode',
  formulaUsed: 'formulaUsed',
  inputValues: 'inputValues',
  outputValue: 'outputValue',
  outputData: 'outputData',
  executionTimeMs: 'executionTimeMs',
  status: 'status',
  errorMessage: 'errorMessage',
  calculatedById: 'calculatedById',
  createdAt: 'createdAt'
};

exports.Prisma.PayrollRunV2ScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  runCode: 'runCode',
  month: 'month',
  year: 'year',
  financialYear: 'financialYear',
  status: 'status',
  currentStep: 'currentStep',
  totalEmployees: 'totalEmployees',
  processedEmployees: 'processedEmployees',
  errorEmployees: 'errorEmployees',
  totalGross: 'totalGross',
  totalDeductions: 'totalDeductions',
  totalNet: 'totalNet',
  bankFileUrl: 'bankFileUrl',
  complianceReportUrl: 'complianceReportUrl',
  processedById: 'processedById',
  lockedById: 'lockedById',
  lockedAt: 'lockedAt',
  closedAt: 'closedAt',
  runLog: 'runLog',
  errorLog: 'errorLog',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollRunEmployeeScalarFieldEnum = {
  id: 'id',
  runId: 'runId',
  employeeId: 'employeeId',
  salaryAssignmentId: 'salaryAssignmentId',
  payrollDays: 'payrollDays',
  presentDays: 'presentDays',
  lopDays: 'lopDays',
  payableDays: 'payableDays',
  weeklyOffs: 'weeklyOffs',
  holidays: 'holidays',
  paidLeaves: 'paidLeaves',
  unpaidLeaves: 'unpaidLeaves',
  halfDays: 'halfDays',
  basicEarned: 'basicEarned',
  grossEarnings: 'grossEarnings',
  totalEarnings: 'totalEarnings',
  totalStatutory: 'totalStatutory',
  totalTax: 'totalTax',
  totalOtherDeductions: 'totalOtherDeductions',
  totalDeductions: 'totalDeductions',
  netSalary: 'netSalary',
  earningsBreakdown: 'earningsBreakdown',
  deductionsBreakdown: 'deductionsBreakdown',
  statutoryBreakdown: 'statutoryBreakdown',
  taxBreakdown: 'taxBreakdown',
  attendanceBreakdown: 'attendanceBreakdown',
  bonusAmount: 'bonusAmount',
  overtimeAmount: 'overtimeAmount',
  reimbursementAmount: 'reimbursementAmount',
  loanRecovery: 'loanRecovery',
  advanceRecovery: 'advanceRecovery',
  arrearAmount: 'arrearAmount',
  leaveEncashment: 'leaveEncashment',
  status: 'status',
  errorMessage: 'errorMessage',
  calculatedAt: 'calculatedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollFinancialYearScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  isLocked: 'isLocked',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollWorkflowConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  workflowType: 'workflowType',
  approvalLevels: 'approvalLevels',
  status: 'status',
  effectiveFrom: 'effectiveFrom',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollWorkflowInstanceScalarFieldEnum = {
  id: 'id',
  workflowConfigId: 'workflowConfigId',
  entityType: 'entityType',
  entityId: 'entityId',
  currentLevel: 'currentLevel',
  currentStatus: 'currentStatus',
  initiatedById: 'initiatedById',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollWorkflowStepScalarFieldEnum = {
  id: 'id',
  instanceId: 'instanceId',
  level: 'level',
  assignedToRole: 'assignedToRole',
  assignedToId: 'assignedToId',
  action: 'action',
  comments: 'comments',
  actionAt: 'actionAt',
  autoApproveDeadline: 'autoApproveDeadline',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollQueryScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  category: 'category',
  subject: 'subject',
  description: 'description',
  month: 'month',
  year: 'year',
  status: 'status',
  priority: 'priority',
  assignedToId: 'assignedToId',
  resolvedAt: 'resolvedAt',
  resolution: 'resolution',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollQueryCommentScalarFieldEnum = {
  id: 'id',
  queryId: 'queryId',
  commentById: 'commentById',
  commentByName: 'commentByName',
  commentByRole: 'commentByRole',
  message: 'message',
  attachmentUrl: 'attachmentUrl',
  createdAt: 'createdAt'
};

exports.Prisma.PayrollNotificationScalarFieldEnum = {
  id: 'id',
  recipientId: 'recipientId',
  recipientRole: 'recipientRole',
  type: 'type',
  title: 'title',
  message: 'message',
  entityType: 'entityType',
  entityId: 'entityId',
  isRead: 'isRead',
  readAt: 'readAt',
  createdAt: 'createdAt'
};

exports.Prisma.PayrollAuditLogScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  action: 'action',
  module: 'module',
  entityType: 'entityType',
  entityId: 'entityId',
  oldValue: 'oldValue',
  newValue: 'newValue',
  performedById: 'performedById',
  performedByName: 'performedByName',
  performedByRole: 'performedByRole',
  ipAddress: 'ipAddress',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  User: 'User',
  Organization: 'Organization',
  Employee: 'Employee',
  Attendance: 'Attendance',
  Leave: 'Leave',
  HelpdeskTicket: 'HelpdeskTicket',
  Department: 'Department',
  OfficeLocation: 'OfficeLocation',
  Team: 'Team',
  BusinessUnit: 'BusinessUnit',
  Designation: 'Designation',
  EmployeeType: 'EmployeeType',
  EmployeeCategory: 'EmployeeCategory',
  Role: 'Role',
  Permission: 'Permission',
  SalaryComponent: 'SalaryComponent',
  PayrollConfig: 'PayrollConfig',
  PayrollRun: 'PayrollRun',
  Payslip: 'Payslip',
  Bonus: 'Bonus',
  Loan: 'Loan',
  ShiftRoster: 'ShiftRoster',
  TaxCalculation: 'TaxCalculation',
  Project: 'Project',
  Task: 'Task',
  Timesheet: 'Timesheet',
  PerformanceGoal: 'PerformanceGoal',
  Appraisal: 'Appraisal',
  Skill: 'Skill',
  JobRequisition: 'JobRequisition',
  Candidate: 'Candidate',
  OfferLetter: 'OfferLetter',
  StaffingClient: 'StaffingClient',
  StaffingRequirement: 'StaffingRequirement',
  ExitRequest: 'ExitRequest',
  NotificationConfig: 'NotificationConfig',
  Notification: 'Notification',
  ShoutOut: 'ShoutOut',
  PulseSurvey: 'PulseSurvey',
  ActivityLog: 'ActivityLog',
  Asset: 'Asset',
  Subscription: 'Subscription',
  DemoRequest: 'DemoRequest',
  HolidayList: 'HolidayList',
  Holiday: 'Holiday',
  RestrictedHolidayClaim: 'RestrictedHolidayClaim',
  Assetexport: 'Assetexport',
  CustomTemplate: 'CustomTemplate',
  Document: 'Document',
  Documentexport: 'Documentexport',
  EmployeeCategoryexport: 'EmployeeCategoryexport',
  EmployeeConfig: 'EmployeeConfig',
  EmployeeConfigexport: 'EmployeeConfigexport',
  EmployeeSubCategory: 'EmployeeSubCategory',
  EmployeeSubCategoryexport: 'EmployeeSubCategoryexport',
  EmployeeTypeexport: 'EmployeeTypeexport',
  Bank: 'Bank',
  Organizationexport: 'Organizationexport',
  Template: 'Template',
  Templateconst: 'Templateconst',
  DemoRequestexport: 'DemoRequestexport',
  PulseResponse: 'PulseResponse',
  ExitRequestexport: 'ExitRequestexport',
  CostCenter: 'CostCenter',
  Expense: 'Expense',
  JournalEntry: 'JournalEntry',
  Vendor: 'Vendor',
  VendorInvoice: 'VendorInvoice',
  FnFSettlement: 'FnFSettlement',
  FnFSettlementexport: 'FnFSettlementexport',
  HandbookDocument: 'HandbookDocument',
  ApprovalWorkflow: 'ApprovalWorkflow',
  Attendanceexport: 'Attendanceexport',
  AttendanceRegularization: 'AttendanceRegularization',
  AttendanceThreshold: 'AttendanceThreshold',
  AttendanceThresholdconst: 'AttendanceThresholdconst',
  ComplianceReport: 'ComplianceReport',
  ComplianceReportexport: 'ComplianceReportexport',
  CompOffRequest: 'CompOffRequest',
  DocumentReminder: 'DocumentReminder',
  DocumentRequirement: 'DocumentRequirement',
  OvertimeRequest: 'OvertimeRequest',
  RetroAdjustment: 'RetroAdjustment',
  PayrollVariableInput: 'PayrollVariableInput',
  VariablePayConfig: 'VariablePayConfig',
  StatutoryConfig: 'StatutoryConfig',
  Employeeexport: 'Employeeexport',
  EmploymentHistory: 'EmploymentHistory',
  InvestmentDeclaration: 'InvestmentDeclaration',
  Leaveexport: 'Leaveexport',
  LeaveApplication: 'LeaveApplication',
  LeaveApplicationexport: 'LeaveApplicationexport',
  WorkingShift: 'WorkingShift',
  ProductCatalog: 'ProductCatalog',
  ProductCatalogexport: 'ProductCatalogexport',
  InterviewFeedback: 'InterviewFeedback',
  OnboardingChecklist: 'OnboardingChecklist',
  StaffingCandidate: 'StaffingCandidate',
  StaffingCandidateconst: 'StaffingCandidateconst',
  StaffingClientconst: 'StaffingClientconst',
  StaffingRequirementconst: 'StaffingRequirementconst',
  StaffingSubmission: 'StaffingSubmission',
  StaffingSubmissionconst: 'StaffingSubmissionconst',
  CareerPath: 'CareerPath',
  Projectexport: 'Projectexport',
  Taskexport: 'Taskexport',
  Timesheetexport: 'Timesheetexport',
  TimesheetEntry: 'TimesheetEntry',
  TimesheetEntryexport: 'TimesheetEntryexport',
  Userconst: 'Userconst',
  PayrollComponentMaster: 'PayrollComponentMaster',
  PayrollSalaryTemplate: 'PayrollSalaryTemplate',
  PayrollTemplateComponent: 'PayrollTemplateComponent',
  PayrollEmployeeSalary: 'PayrollEmployeeSalary',
  PayrollPFConfig: 'PayrollPFConfig',
  PayrollESIConfig: 'PayrollESIConfig',
  PayrollPTSlabConfig: 'PayrollPTSlabConfig',
  PayrollLWFConfig: 'PayrollLWFConfig',
  PayrollTaxSlabConfig: 'PayrollTaxSlabConfig',
  PayrollTaxSectionConfig: 'PayrollTaxSectionConfig',
  PayrollBonusConfig: 'PayrollBonusConfig',
  PayrollOTConfig: 'PayrollOTConfig',
  PayrollGratuityConfig: 'PayrollGratuityConfig',
  PayrollRoundingConfig: 'PayrollRoundingConfig',
  PayrollCalculationLog: 'PayrollCalculationLog',
  PayrollRunV2: 'PayrollRunV2',
  PayrollRunEmployee: 'PayrollRunEmployee',
  PayrollFinancialYear: 'PayrollFinancialYear',
  PayrollWorkflowConfig: 'PayrollWorkflowConfig',
  PayrollWorkflowInstance: 'PayrollWorkflowInstance',
  PayrollWorkflowStep: 'PayrollWorkflowStep',
  PayrollQuery: 'PayrollQuery',
  PayrollQueryComment: 'PayrollQueryComment',
  PayrollNotification: 'PayrollNotification',
  PayrollAuditLog: 'PayrollAuditLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
