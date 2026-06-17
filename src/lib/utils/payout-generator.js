
/**
 * Utility to generate Bank Advice CSV for Salary Payout
 * Matches standard bank upload formats (HDFC, ICICI, SBI, etc.)
 * typically: Account No, Amount, Beneficiary Name, IFSC, Remarks
 */

export const generateBankAdviceCSV = (payslips) => {
    // CSV Header
    const headers = [
        "Beneficiary Name",
        "Account Number",
        "IFSC Code",
        "Amount",
        "Payment Date",
        "Remarks",
        "Email",
        "Mobile"
    ];

    const rows = payslips.map(slip => {
        const bank = slip.employee?.salaryDetails?.bankAccount || {};
        const amount = slip.netSalary || 0;
        const name = `${slip.employee?.personalDetails?.firstName || ''} ${slip.employee?.personalDetails?.lastName || ''}`.trim();
        const remarks = `Salary ${slip.month}/${slip.year}`;

        return [
            name,
            bank.accountNumber || "",
            bank.ifscCode || "",
            amount.toFixed(2),
            new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }), // DD/MM/YYYY
            remarks,
            slip.employee?.personalDetails?.email || "",
            slip.employee?.personalDetails?.phone || ""
        ];
    });

    // Combine header and rows
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    return csvContent;
};

/**
 * HDFC Bulk NEFT/RTGS Format
 * Cols: Beneficiary A/c, Amount, Beneficiary Name, Trans Type (N/R), IFSC, Sender A/c, Remarks
 */
export const generateHDFCPayout = (payslips, senderAccountNumber = "") => {
    const rows = payslips.map(slip => {
        const bank = slip.employee?.salaryDetails?.bankAccount || {};
        const amount = (slip.netSalary || 0).toFixed(2);
        const name = `${slip.employee?.personalDetails?.firstName || ''} ${slip.employee?.personalDetails?.lastName || ''}`.trim();
        const transType = (slip.netSalary > 200000) ? "R" : "N"; // R for RTGS (>2L), N for NEST
        const remarks = `SALARY ${slip.month}-${slip.year}`;

        return [
            bank.accountNumber || "",
            amount,
            name,
            transType,
            bank.ifscCode || "",
            senderAccountNumber,
            remarks
        ];
    });

    return rows.map(row => row.join(",")).join("\n");
};

/**
 * ICICI i-Core Format
 * Cols: Pymt Method, Activation Date, Amount, BenefName, BenefAccNo, IFSC, Mobile, Email, Remarks
 */
export const generateICICIPayout = (payslips) => {
    const today = new Date();
    const activationDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    const rows = payslips.map(slip => {
        const bank = slip.employee?.salaryDetails?.bankAccount || {};
        const amount = (slip.netSalary || 0).toFixed(2);
        const name = `${slip.employee?.personalDetails?.firstName || ''} ${slip.employee?.personalDetails?.lastName || ''}`.trim();
        
        return [
            "N", // NEFT
            activationDate,
            amount,
            name,
            bank.accountNumber || "",
            bank.ifscCode || "",
            slip.employee?.personalDetails?.phone || "",
            slip.employee?.personalDetails?.email || "",
            `SALARY ${slip.month}-${slip.year}`
        ];
    });

    return rows.map(row => row.join(",")).join("\n");
};
