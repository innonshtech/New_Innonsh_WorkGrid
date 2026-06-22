/**
 * ═══════════════════════════════════════════════════════════
 * LOAN & ADVANCE RECOVERY ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * LOAN RECOVERY:
 *   Outstanding Loan - Monthly EMI
 *   Track: Total Loan, Recovered Amount, Pending Amount, Recovery Schedule
 * 
 * ADVANCE RECOVERY:
 *   Advance Amount - Configured Recovery
 */

export class LoanRecoveryEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate loan recovery for the month
   * 
   * @param {Array} activeLoans - From ConfigLoader.loadActiveLoans()
   * @returns {object} Loan recovery breakdown
   */
  calculate(activeLoans) {
    if (this.logger) this.logger.startStep(12, 'CALCULATE_LOAN_RECOVERY');

    const result = {
      loans: [],
      totalLoanRecovery: 0,
      totalAdvanceRecovery: 0,
      totalRecovery: 0,
    };

    if (!activeLoans || activeLoans.length === 0) {
      if (this.logger) {
        this.logger.log(12, 'CALCULATE_LOAN_RECOVERY', 'LOAN',
          'No active loans', {}, 0, result);
      }
      return result;
    }

    for (const loan of activeLoans) {
      const loanData = loan.loanData && typeof loan.loanData === 'object' ? loan.loanData : {};
      const emi = Number(loan.emi || loanData.emi || loanData.emiAmount || 0);
      const totalAmount = Number(loan.amount || loanData.principalAmount || loanData.amount || 0);
      const recoveredAmount = Number(loanData.recoveredAmount || loanData.totalRepaid || 0);
      const pendingAmount = totalAmount - recoveredAmount;
      const loanType = loanData.loanType || loanData.type || 'LOAN';

      if (emi <= 0) continue;

      // Don't recover more than pending
      const recoveryAmount = this.roundingEngine.salary(Math.min(emi, Math.max(0, pendingAmount)));

      const loanEntry = {
        loanId: loan.id,
        loanType,
        totalLoan: totalAmount,
        emi,
        recoveredSoFar: recoveredAmount,
        pendingAmount,
        recoveryThisMonth: recoveryAmount,
      };

      result.loans.push(loanEntry);

      if (loanType === 'ADVANCE' || loanType === 'SALARY_ADVANCE') {
        result.totalAdvanceRecovery += recoveryAmount;
      } else {
        result.totalLoanRecovery += recoveryAmount;
      }
    }

    result.totalRecovery = result.totalLoanRecovery + result.totalAdvanceRecovery;

    if (this.logger) {
      this.logger.log(12, 'CALCULATE_LOAN_RECOVERY', 'LOAN',
        `${result.loans.length} active loan(s), total recovery = ₹${result.totalRecovery}`,
        { loanCount: activeLoans.length },
        result.totalRecovery,
        result
      );
    }

    return result;
  }
}
