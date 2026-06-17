// utils/validation.js
export const validators = {
  // Alphabets + spaces only (1-40 chars)
  name: (v) => /^[A-Za-z\s]{1,40}$/.test(v?.trim() || ''),

  // Required (non-empty string)
  required: (v) => !!v && v.toString().trim().length > 0,

  // Email (RFC-like)
  email: (v) => /^\S+@\S+\.\S+$/.test(v || ''),

  // Indian mobile – 10 digits starting with 6-9
  phone: (v) => /^[6-9]\d{9}$/.test(v?.replace(/\D/g, '') || ''),

  // Positive number (including decimals) - for basic salary and amounts
  positiveNumber: (v) => /^\d+(\.\d+)?$/.test(v) && parseFloat(v) > 0,

  // Account number – 9-18 digits
  accountNumber: (v) => /^\d{9,18}$/.test(v),

  // IFSC – 11 alphanumeric characters
  ifsc: (v) => /^[A-Z0-9]{11}$/.test((v || '').toUpperCase()),

  // PAN – 5 letters + 4 digits + 1 letter
  pan: (v) => /^[A-Z]{5}\d{4}[A-Z]$/.test((v || '').toUpperCase()),

  // Aadhar – exactly 12 digits
  aadhar: (v) => /^\d{12}$/.test(v),

  // ZIP – 6 digits
  zip: (v) => !v || /^\d{6}$/.test(v),

  // Website URL (simple validator)
  website: (v) => !v || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v),
};

// Format phone number (e.g., "9876543210" -> "987 654 3210")
export const formatPhoneNumber = (value) => {
  const phone = value.replace(/\D/g, '');
  if (phone.length <= 3) return phone;
  if (phone.length <= 7) return `${phone.slice(0, 3)} ${phone.slice(3)}`;
  return `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7, 10)}`;
};

// Format PAN number (e.g., "ABCDE1234F" -> "ABCDE 1234 F")
export const formatPanNumber = (value) => {
  const pan = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (pan.length <= 5) return pan;
  if (pan.length <= 9) return `${pan.slice(0, 5)} ${pan.slice(5)}`;
  return `${pan.slice(0, 5)} ${pan.slice(5, 9)} ${pan.slice(9, 10)}`;
};

// Format Aadhar number (e.g., "123456789012" -> "1234 5678 9012")
export const formatAadharNumber = (value) => {
  const aadhar = value.replace(/\D/g, '');
  if (aadhar.length <= 4) return aadhar;
  if (aadhar.length <= 8) return `${aadhar.slice(0, 4)} ${aadhar.slice(4)}`;
  return `${aadhar.slice(0, 4)} ${aadhar.slice(4, 8)} ${aadhar.slice(8, 12)}`;
};
export const calculateProfessionalTax = (grossSalary, gender, month) => {
  // Determine if it's February (handles both numeric 2 and string "February"/"2")
  const isFebruary =
    month === 2 ||
    month === "2" ||
    (typeof month === 'string' && month.toLowerCase() === 'february');

  // Maharashtra PT Rules:
  // Men:
  //   Up to ₹7,500: Nil
  //   ₹7,501 to ₹10,000: ₹175
  //   Above ₹10,000: ₹200 (₹300 in February)
  // Women:
  //   Up to ₹10,000: Nil
  //   Above ₹10,000: ₹200 (₹300 in February)

  if (gender === "Female") {
    if (grossSalary <= 10000) return 0;
    return isFebruary ? 300 : 200;
  } else {
    // Default to Male logic for "Male" or other genders as per Maharashtra slabs
    if (grossSalary <= 7500) return 0;
    if (grossSalary <= 10000) return 175;
    return isFebruary ? 300 : 200;
  }
};

export const calculateAge = (dob) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Calculate PF (Provident Fund)
// Employee: 12% of Basic + DA (taking Basic for now) capped at 15000
// Employer: 13% of Basic + DA capped at 15000
export const calculatePF = (basicSalary) => {
  // Ensure basicSalary is a number
  const basic = parseFloat(basicSalary) || 0;
  
  // Cap wages at 15,000 for PF calculation
  const pfWages = Math.min(basic, 15000);
  
  // Calculate PF (12% Employee, 13% Employer)
  // Rounding to nearest rupee as per standard practice
  const employeePF = Math.round((pfWages * 12) / 100);
  const employerPF = Math.round((pfWages * 13) / 100);
  
  return {
    employeePF,
    employerPF,
    wages: pfWages
  };
};

// Calculate ESIC
// Employee: 0.75% of Gross Salary
// Employer: 3.25% of Gross Salary
// ESIC is applicable only if Gross Salary <= 21000
export const calculateESIC = (grossSalary) => {
  const gross = parseFloat(grossSalary) || 0;
  
  // ESIC ceiling is 21000
  // Note: Once covered, usually covered for contribution period even if salary exceeds, 
  // but for simple calculation we check 21000 limit.
  // Actually, if > 21000, ESIC is 0.
  
  // However, often users want to force ESIC. The flag esicApplicable handles that check externally.
  // This helper just calculates values assuming it IS applicable.
  
  const employeeESIC = Math.ceil(gross * 0.0075);
  const employerESIC = Math.ceil(gross * 0.0325);
  
  return {
    employeeESIC,
    employerESIC
  };
};
