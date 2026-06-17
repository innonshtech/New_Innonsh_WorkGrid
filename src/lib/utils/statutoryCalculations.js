export class StatutoryCalculator {
  static calculatePF(basicSalary, da = 0, isVoluntaryPF = false) {
    const grossSalary = basicSalary + da;
    const pfWageLimit = 15000; // Current PF wage limit

    let employeeContribution = 0;
    let employerContribution = 0;
    let pensionContribution = 0;

    if (isVoluntaryPF) {
      // Voluntary PF - 12% of actual basic + DA
      employeeContribution = grossSalary * 0.12;
      employerContribution = grossSalary * 0.12;
      pensionContribution = grossSalary * 0.0833;
    } else {
      // Standard PF - 12% of gross salary or limit, whichever is lower
      const pfBase = Math.min(grossSalary, pfWageLimit);
      employeeContribution = pfBase * 0.12;
      employerContribution = pfBase * 0.12;
      pensionContribution = pfBase * 0.0833;
    }

    // EDLI Charges (0.5% of PF base)
    const edliContribution = Math.min(grossSalary, pfWageLimit) * 0.005;

    // Admin Charges (0.5% of PF base)
    const adminCharges = Math.min(grossSalary, pfWageLimit) * 0.005;

    return {
      employeeContribution: Math.round(employeeContribution),
      employerContribution: Math.round(employerContribution),
      pensionContribution: Math.round(pensionContribution),
      edliContribution: Math.round(edliContribution),
      adminCharges: Math.round(adminCharges),
      totalEmployerContribution: Math.round(employerContribution + pensionContribution + edliContribution + adminCharges)
    };
  }

  static calculateESIC(grossSalary) {
    const esicWageLimit = 21000; // Current ESIC wage limit

    if (grossSalary <= esicWageLimit) {
      const employeeContribution = grossSalary * 0.0075; // 0.75%
      const employerContribution = grossSalary * 0.0325; // 3.25%

      return {
        employeeContribution: Math.round(employeeContribution),
        employerContribution: Math.round(employerContribution),
        totalContribution: Math.round(employeeContribution + employerContribution),
        isApplicable: true
      };
    }

    return {
      employeeContribution: 0,
      employerContribution: 0,
      totalContribution: 0,
      isApplicable: false
    };
  }

  static calculateProfessionalTax(grossSalary, state = 'Maharashtra', ptConfig = null) {

    // If dynamic config is provided, use it
    if (ptConfig && Array.isArray(ptConfig.ptSlabs) && ptConfig.ptSlabs.length > 0) {
      const currentMonth = ptConfig.month || (new Date().getMonth() + 1);
      const applicableSlab = ptConfig.ptSlabs.find(slab => grossSalary >= slab.minSalary && grossSalary <= slab.maxSalary);
      
      if (applicableSlab) {
        // Handle monthly exceptions (e.g., Maharashtra Feb: 300)
        if (applicableSlab.exceptionMonth === currentMonth && applicableSlab.exceptionTaxAmount !== null) {
          return applicableSlab.exceptionTaxAmount;
        }
        return applicableSlab.taxAmount;
      }
      return 0;
    }

    // Fallback to hardcoded rates if no config provided
    // Professional tax rates vary by state
    const stateRates = {
      'Maharashtra': [
        { min: 0, max: 7500, tax: 0 },
        { min: 7501, max: 10000, tax: 175 },
        { min: 10001, max: Infinity, tax: 200 }
      ],
      'Karnataka': [
        { min: 0, max: 15000, tax: 0 },
        { min: 15001, max: Infinity, tax: 200 }
      ],
      'Tamil Nadu': [
        { min: 0, max: 21000, tax: 0 },
        { min: 21001, max: 30000, tax: 135 },
        { min: 30001, max: 45000, tax: 315 },
        { min: 45001, max: 60000, tax: 690 },
        { min: 60001, max: 75000, tax: 1025 },
        { min: 75001, max: Infinity, tax: 1250 }
      ]
      // Add more states as needed
    };

    const rates = stateRates[state] || stateRates['Maharashtra'];
    const applicableRate = rates.find(rate => grossSalary >= rate.min && grossSalary <= rate.max);

    if (applicableRate) {
      // Hardcoded Fallback for Maharashtra Feb exception if ptConfig.month is passed or if current month is Feb
      const currentMonth = (ptConfig && ptConfig.month) || (new Date().getMonth() + 1);
      if (state === 'Maharashtra' && currentMonth === 2 && applicableRate.tax === 200) {
        return 300;
      }
      return applicableRate.tax;
    }
    return 0;
  }

  static calculateGratuity(basicSalary) {
    // Gratuity Calculation Formula: (Basic Salary * 15 / 26)
    // This is the amount for one year of service.
    // To get the monthly provision: ((Basic Salary * 15 / 26) / 12)

    if (!basicSalary || basicSalary <= 0) return 0;

    const yearlyGratuity = (basicSalary * 15) / 26;
    const monthlyGratuity = yearlyGratuity / 12;

    return Math.round(monthlyGratuity);
  }

  static calculateFor31Days(basicSalary, daysInMonth = 31, presentDays) {
    const dailyWage = basicSalary / daysInMonth;
    const payableAmount = dailyWage * presentDays;

    return {
      dailyWage: Math.round(dailyWage),
      payableAmount: Math.round(payableAmount),
      lopAmount: Math.round(basicSalary - payableAmount)
    };
  }
}