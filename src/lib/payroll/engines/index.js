/**
 * ═══════════════════════════════════════════════════════════
 * PAYROLL CALCULATION ENGINE — MODULE INDEX
 * ═══════════════════════════════════════════════════════════
 * 
 * Central export for all payroll engine sub-modules.
 * 
 * Usage:
 *   import { PayrollCalculationEngine } from '@/lib/payroll/engines';
 * 
 *   const engine = new PayrollCalculationEngine();
 *   const result = await engine.calculate({
 *     employeeId: 'emp-123',
 *     month: 6,
 *     year: 2026,
 *     organizationId: 'org-456',
 *   });
 * 
 * Sub-Engines (can also be imported individually):
 *   - FormulaEngine         → Evaluates FIXED, PERCENTAGE, DERIVED, CONDITIONAL, SLAB formulas
 *   - ConfigLoader          → Loads all config from database
 *   - RoundingEngine        → Configuration-driven rounding
 *   - CalculationLogger     → Audit logging for every calculation
 *   - AttendanceEngine      → LOP & proration
 *   - PFEngine              → Provident Fund
 *   - ESIEngine             → Employee State Insurance
 *   - PTEngine              → Professional Tax (slab-based, state-wise)
 *   - LWFEngine             → Labour Welfare Fund
 *   - BonusEngine           → Monthly/Quarterly/Yearly/Performance/Festival Bonus
 *   - OvertimeEngine        → OT with configurable multiplier
 *   - LoanRecoveryEngine    → Loan & Advance recovery
 *   - ArrearEngine          → Salary revision arrears
 *   - GratuityEngine        → Gratuity with configurable formula
 *   - LeaveEncashmentEngine → Leave encashment
 *   - TaxEngine             → TDS, Old/New regime, projections
 */

// Main Orchestrator
export { PayrollCalculationEngine } from './payroll-calculation-engine.js';

// Core Infrastructure
export { FormulaEngine } from './formula-engine.js';
export { ConfigLoader } from './config-loader.js';
export { RoundingEngine } from './rounding-engine.js';
export { CalculationLogger } from './calculation-logger.js';

// Attendance & Proration
export { AttendanceEngine } from './attendance-engine.js';

// Statutory Engines
export { PFEngine } from './pf-engine.js';
export { ESIEngine } from './esi-engine.js';
export { PTEngine } from './pt-engine.js';
export { LWFEngine } from './lwf-engine.js';

// Benefits Engines
export { BonusEngine } from './bonus-engine.js';
export { OvertimeEngine } from './overtime-engine.js';
export { LeaveEncashmentEngine } from './leave-encashment-engine.js';
export { GratuityEngine } from './gratuity-engine.js';

// Recovery Engines
export { LoanRecoveryEngine } from './loan-recovery-engine.js';
export { ArrearEngine } from './arrear-engine.js';

// Tax Engine
export { TaxEngine } from './tax-engine.js';

// Workflow Engine
export { WorkflowEngine } from './workflow-engine.js';

// Payslip PDF Engine
export { PayslipPDFEngine } from './payslip-pdf-engine.js';

// Bank File Engine
export { BankFileEngine } from './bank-file-engine.js';

// Compliance Engine
export { ComplianceEngine } from './compliance-engine.js';

// Form 16 Engine
export { Form16Engine } from './form16-engine.js';





