// 'use client';

// import { useState, useEffect } from 'react';
// import {
//   Save, X, Calculator, User, FileText, TrendingUp, Percent, DollarSign,
//   Plus, Trash2, ArrowLeft, AlertCircle, CheckCircle, Building, Calendar,
//   Loader2
// } from 'lucide-react';

// export default function TaxCalculator() {
//   const [loading, setLoading] = useState(false);
//   const [employeesLoading, setEmployeesLoading] = useState(true);
//   const [employees, setEmployees] = useState([]);

//   const [formData, setFormData] = useState({
//     employee: '',
//     financialYear: '',
//     totalEarnings: 0,
//     totalDeductions: 0,
//     taxDetails: [
//       { type: 'TDS', amount: 0, calculationMethod: 'As per Income Tax Act' },
//       { type: 'Professional Tax', amount: 0, calculationMethod: 'State-specific rates' }
//     ],
//     notes: ''
//   });

//   const [calculatedValues, setCalculatedValues] = useState({
//     taxableIncome: 0,
//     totalTax: 0
//   });

//   const [errors, setErrors] = useState({});

//   // Fetch employees on component mount
//   useEffect(() => {
//     fetchEmployees();
//   }, []);

//   // Set default financial year
//   useEffect(() => {
//     const currentDate = new Date();
//     const currentYear = currentDate.getFullYear();
//     const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

//     // Financial year in India starts from April (month 4)
//     let financialYear;
//     if (currentMonth >= 4) {
//       // Current year April to next year March
//       financialYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
//     } else {
//       // Previous year April to current year March
//       financialYear = `${currentYear - 1}-${String(currentYear).slice(-2)}`;
//     }

//     setFormData(prev => ({
//       ...prev,
//       financialYear
//     }));
//   }, []);

//   // Calculate values when relevant fields change
//   useEffect(() => {
//     calculateValues();
//   }, [formData.totalEarnings, formData.totalDeductions, formData.taxDetails]);

//   const fetchEmployees = async () => {
//     try {
//       setEmployeesLoading(true);
//       const response = await fetch('/api/v1/admin/payroll/employees');

//       if (!response.ok) {
//         throw new Error('Failed to fetch employees');
//       }

//       const data = await response.json();
//       setEmployees(data.employees || []);
//     } catch (error) {
//       console.error('Error fetching employees:', error);
//       alert('Failed to load employees. Please try again.');
//     } finally {
//       setEmployeesLoading(false);
//     }
//   };

//   const calculateValues = () => {
//     const taxableIncome = Math.max(0, (parseFloat(formData.totalEarnings) || 0) - (parseFloat(formData.totalDeductions) || 0));
//     const totalTax = formData.taxDetails.reduce((sum, tax) => sum + (parseFloat(tax.amount) || 0), 0);

//     setCalculatedValues({
//       taxableIncome,
//       totalTax
//     });
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: name.includes('Earnings') || name.includes('Deductions') 
//         ? parseFloat(value) || 0 
//         : value
//     }));

//     // Clear error when user starts typing
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const handleTaxDetailChange = (index, field, value) => {
//     const newTaxDetails = [...formData.taxDetails];
//     newTaxDetails[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
//     setFormData(prev => ({ ...prev, taxDetails: newTaxDetails }));
//   };

//   const addTaxDetail = () => {
//     setFormData(prev => ({
//       ...prev,
//       taxDetails: [...prev.taxDetails, { type: 'Other', amount: 0, calculationMethod: '' }]
//     }));
//   };

//   const removeTaxDetail = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       taxDetails: prev.taxDetails.filter((_, i) => i !== index)
//     }));
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.employee) newErrors.employee = 'Please select an employee';
//     if (!formData.financialYear) newErrors.financialYear = 'Financial year is required';
//     if (!formData.totalEarnings || formData.totalEarnings <= 0) newErrors.totalEarnings = 'Total earnings must be greater than 0';

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) {
//       return;
//     }

//     setLoading(true);

//     try {
//       const payload = {
//         employee: formData.employee,
//         financialYear: formData.financialYear,
//         totalEarnings: formData.totalEarnings,
//         totalDeductions: formData.totalDeductions,
//         taxDetails: formData.taxDetails,
//         notes: formData.notes,
//         taxableIncome: calculatedValues.taxableIncome,
//         totalTax: calculatedValues.totalTax,
//         status: 'Calculated'
//       };

//       const response = await fetch('/api/v1/admin/payroll/taxes', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to save tax calculation'  );
//       }

//       const result = await response.json();
//       console.log('Tax calculation completed:', result);
//       alert('Tax calculation completed successfully!');

//       // Reset form after successful submission
//       setFormData({
//         employee: '',
//         financialYear: formData.financialYear, // Keep the financial year
//         totalEarnings: 0,
//         totalDeductions: 0,
//         taxDetails: [
//           { type: 'TDS', amount: 0, calculationMethod: 'As per Income Tax Act' },
//           { type: 'Professional Tax', amount: 0, calculationMethod: 'State-specific rates' }
//         ],
//         notes: ''
//       });

//     } catch (error) {
//       console.error('Error calculating tax:', error);
//       alert(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBack = () => {
//     window.history.back();
//   };

//   const taxTypes = ['TDS', 'Professional Tax', 'Income Tax', 'ESI', 'PF', 'Other'];

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   const selectedEmployee = employees.find(emp => emp._id === formData.employee);

//   return (
//     <div className="min-h-screen bg-slate-50">
//       {/* Header */}
//       <div className="bg-white border-b border-slate-200">
//         <div className="max-w-7xl mx-auto px-6 py-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={handleBack}
//                 className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
//               >
//                 <ArrowLeft className="w-5 h-5" />
//               </button>
//               <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center">
//                 <Calculator className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-900">Tax Calculator</h1>
//                 <p className="text-slate-600 text-sm mt-0.5">Calculate employee tax deductions and liability</p>
//               </div>
//             </div>

//             <button
//               onClick={handleBack}
//               className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
//             >
//               <X className="w-4 h-4" />
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>

//       <form onSubmit={handleSubmit}>
//         <div className="max-w-7xl mx-auto px-6 py-8">
//           <div className="space-y-8">
//             {/* Progress Indicator */}
//             <div className="bg-white p-6 rounded-xl border border-slate-200">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-slate-900">Calculation Progress</h3>
//                 <div className="flex items-center space-x-2">
//                   <div className={`w-3 h-3 rounded-full ${formData.employee ? 'bg-yellow-500' : 'bg-slate-300'}`}></div>
//                   <div className={`w-3 h-3 rounded-full ${formData.totalEarnings > 0 ? 'bg-yellow-500' : 'bg-slate-300'}`}></div>
//                   <div className={`w-3 h-3 rounded-full ${calculatedValues.totalTax > 0 ? 'bg-yellow-500' : 'bg-slate-300'}`}></div>
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//                 <div className={`flex items-center space-x-2 ${formData.employee ? 'text-green-700' : 'text-slate-500'}`}>
//                   {formData.employee ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>}
//                   <span>Employee Selected</span>
//                 </div>
//                 <div className={`flex items-center space-x-2 ${formData.totalEarnings > 0 ? 'text-green-700' : 'text-slate-500'}`}>
//                   {formData.totalEarnings > 0 ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>}
//                   <span>Earnings Entered</span>
//                 </div>
//                 <div className={`flex items-center space-x-2 ${calculatedValues.totalTax > 0 ? 'text-green-700' : 'text-slate-500'}`}>
//                   {calculatedValues.totalTax > 0 ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>}
//                   <span>Tax Calculated</span>
//                 </div>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
//               {/* Employee Information */}
//               <div className="xl:col-span-2 space-y-8">
//                 <div className="bg-white rounded-xl border border-slate-200">
//                   <div className="p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
//                       <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
//                         <User className="w-4 h-4 text-yellow-600" />
//                       </div>
//                       Employee Information
//                     </h2>
//                     <p className="text-slate-600 text-sm mt-1">Select employee and financial period</p>
//                   </div>

//                   <div className="p-6 space-y-6">
//                     {/* Employee Selection */}
//                     <div className="space-y-2">
//                       <label className="block text-sm font-semibold text-slate-700">
//                         Select Employee <span className="text-red-500">*</span>
//                       </label>
//                       {employeesLoading ? (
//                         <div className="flex items-center space-x-2 py-3 px-4 border border-slate-300 rounded-lg bg-slate-50">
//                           <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
//                           <span className="text-slate-500 text-sm">Loading employees...</span>
//                         </div>
//                       ) : (
//                         <select
//                           name="employee"
//                           value={formData.employee}
//                           onChange={handleChange}
//                           className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white ${
//                             errors.employee ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
//                           }`}
//                         >
//                           <option value="">Choose an employee...</option>
//                           {employees.map(emp => (
//                             <option key={emp._id} value={emp._id}>
//                               {emp.employeeId} - {emp.personalDetails.firstName} {emp.personalDetails.lastName}
//                             </option>
//                           ))}
//                         </select>
//                       )}
//                       {errors.employee && (
//                         <div className="flex items-center space-x-1 text-red-600 text-xs">
//                           <AlertCircle className="w-3 h-3" />
//                           <span>{errors.employee}</span>
//                         </div>
//                       )}
//                     </div>

//                     {/* Selected Employee Info */}
//                     {selectedEmployee && (
//                       <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
//                         <div className="flex items-center space-x-3">
//                           <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
//                             <User className="w-5 h-5 text-white" />
//                           </div>
//                           <div>
//                             <div className="font-medium text-slate-900">
//                               {selectedEmployee.personalDetails.firstName} {selectedEmployee.personalDetails.lastName}
//                             </div>
//                             <div className="text-sm text-slate-600">Employee ID: {selectedEmployee.employeeId}</div>
//                             <div className="text-sm text-slate-600">Department: {selectedEmployee.jobDetails.department}</div>
//                             <div className="text-sm text-slate-600">Designation: {selectedEmployee.jobDetails.designation}</div>
//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     {/* Financial Year */}
//                     <div className="space-y-2">
//                       <label className="block text-sm font-semibold text-slate-700">
//                         Financial Year <span className="text-red-500">*</span>
//                       </label>
//                       <div className="relative">
//                         <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                         <input
//                           type="text"
//                           name="financialYear"
//                           value={formData.financialYear}
//                           onChange={handleChange}
//                           placeholder="YYYY-YY (e.g., 2024-25)"
//                           className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
//                             errors.financialYear ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
//                           }`}
//                         />
//                       </div>
//                       {errors.financialYear && (
//                         <div className="flex items-center space-x-1 text-red-600 text-xs">
//                           <AlertCircle className="w-3 h-3" />
//                           <span>{errors.financialYear}</span>
//                         </div>
//                       )}
//                     </div>

//                     {/* Earnings and Deductions */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div className="space-y-2">
//                         <label className="block text-sm font-semibold text-slate-700">
//                           Total Earnings <span className="text-red-500">*</span>
//                         </label>
//                         <div className="relative">
//                           <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                           <input
//                             type="number"
//                             name="totalEarnings"
//                             value={formData.totalEarnings || ''}
//                             onChange={handleChange}
//                             placeholder="0"
//                             step="0.01"
//                             min="0"
//                             className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
//                               errors.totalEarnings ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
//                             }`}
//                           />
//                         </div>
//                         {errors.totalEarnings && (
//                           <div className="flex items-center space-x-1 text-red-600 text-xs">
//                             <AlertCircle className="w-3 h-3" />
//                             <span>{errors.totalEarnings}</span>
//                           </div>
//                         )}
//                       </div>

//                       <div className="space-y-2">
//                         <label className="block text-sm font-semibold text-slate-700">Total Deductions</label>
//                         <div className="relative">
//                           <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                           <input
//                             type="number"
//                             name="totalDeductions"
//                             value={formData.totalDeductions || ''}
//                             onChange={handleChange}
//                             placeholder="0"
//                             step="0.01"
//                             min="0"
//                             className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Tax Details */}
//                 <div className="bg-white rounded-xl border border-slate-200">
//                   <div className="p-6 border-b border-slate-200">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
//                           <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
//                             <FileText className="w-4 h-4 text-blue-600" />
//                           </div>
//                           Tax Components
//                         </h2>
//                         <p className="text-slate-600 text-sm mt-1">Configure individual tax calculations</p>
//                       </div>
//                       <button
//                         type="button"
//                         onClick={addTaxDetail}
//                         className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors"
//                       >
//                         <Plus className="w-4 h-4" />
//                         Add Tax
//                       </button>
//                     </div>
//                   </div>

//                   <div className="p-6">
//                     <div className="space-y-4">
//                       {formData.taxDetails.map((tax, index) => (
//                         <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
//                           <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
//                             <div className="lg:col-span-3">
//                               <label className="block text-xs font-medium text-slate-600 mb-1">Tax Type</label>
//                               <select
//                                 value={tax.type}
//                                 onChange={(e) => handleTaxDetailChange(index, 'type', e.target.value)}
//                                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
//                               >
//                                 {taxTypes.map(type => (
//                                   <option key={type} value={type}>{type}</option>
//                                 ))}
//                               </select>
//                             </div>

//                             <div className="lg:col-span-3">
//                               <label className="block text-xs font-medium text-slate-600 mb-1">Amount (₹)</label>
//                               <div className="relative">
//                                 <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
//                                 <input
//                                   type="number"
//                                   value={tax.amount || ''}
//                                   onChange={(e) => handleTaxDetailChange(index, 'amount', e.target.value)}
//                                   placeholder="0"
//                                   step="0.01"
//                                   min="0"
//                                   className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
//                                 />
//                               </div>
//                             </div>

//                             <div className="lg:col-span-5">
//                               <label className="block text-xs font-medium text-slate-600 mb-1">Calculation Method</label>
//                               <input
//                                 type="text"
//                                 value={tax.calculationMethod}
//                                 onChange={(e) => handleTaxDetailChange(index, 'calculationMethod', e.target.value)}
//                                 placeholder="Calculation method or notes"
//                                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
//                               />
//                             </div>

//                             <div className="lg:col-span-1 flex items-end">
//                               {formData.taxDetails.length > 1 && (
//                                 <button
//                                   type="button"
//                                   onClick={() => removeTaxDetail(index)}
//                                   className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
//                                 >
//                                   <Trash2 className="w-4 h-4" />
//                                 </button>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Notes */}
//                 <div className="bg-white rounded-xl border border-slate-200">
//                   <div className="p-6">
//                     <label className="block text-sm font-semibold text-slate-700 mb-3">Additional Notes</label>
//                     <textarea
//                       name="notes"
//                       rows={4}
//                       value={formData.notes}
//                       onChange={handleChange}
//                       className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
//                       placeholder="Add any additional notes, comments, or special considerations for this tax calculation..."
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Calculation Summary Sidebar */}
//               <div className="xl:col-span-1">
//                 <div className="sticky top-6 space-y-6">
//                   <div className="bg-white rounded-xl border border-slate-200">
//                     <div className="p-6 border-b border-slate-200">
//                       <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
//                         <TrendingUp className="w-5 h-5 text-green-600" />
//                         Calculation Summary
//                       </h3>
//                     </div>

//                     <div className="p-6 space-y-4">
//                       <div className="space-y-3">
//                         <div className="flex justify-between items-center py-2">
//                           <span className="text-sm text-slate-600">Total Earnings</span>
//                           <span className="font-semibold text-slate-900">
//                             {formatCurrency(formData.totalEarnings)}
//                           </span>
//                         </div>

//                         <div className="flex justify-between items-center py-2 border-b border-slate-200">
//                           <span className="text-sm text-slate-600">Total Deductions</span>
//                           <span className="font-semibold text-red-600">
//                             -{formatCurrency(formData.totalDeductions)}
//                           </span>
//                         </div>

//                         <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded-lg">
//                           <span className="text-sm font-medium text-blue-900">Taxable Income</span>
//                           <span className="font-bold text-blue-900">
//                             {formatCurrency(calculatedValues.taxableIncome)}
//                           </span>
//                         </div>

//                         <div className="flex justify-between items-center py-2 bg-red-50 px-3 rounded-lg">
//                           <span className="text-sm font-medium text-red-900">Total Tax Liability</span>
//                           <span className="font-bold text-red-900">
//                             {formatCurrency(calculatedValues.totalTax)}
//                           </span>
//                         </div>

//                         {formData.totalEarnings > 0 && (
//                           <div className="flex justify-between items-center py-2 bg-amber-50 px-3 rounded-lg">
//                             <span className="text-sm font-medium text-amber-900">Effective Tax Rate</span>
//                             <span className="font-bold text-amber-900">
//                               {((calculatedValues.totalTax / formData.totalEarnings) * 100).toFixed(2)}%
//                             </span>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Action Buttons */}
//                   <div className="space-y-3">
//                     <button
//                       type="submit"
//                       disabled={loading || employeesLoading}
//                       className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       {loading ? (
//                         <>
//                           <Loader2 className="w-4 h-4 animate-spin" />
//                           Calculating...
//                         </>
//                       ) : (
//                         <>
//                           <Save className="w-4 h-4" />
//                           Calculate Tax
//                         </>
//                       )}
//                     </button>

//                     <button
//                       type="button"
//                       onClick={handleBack}
//                       className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
//                     >
//                       <X className="w-4 h-4" />
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </form>
//     </div>
//   );
// }


'use client';

import { useState, useEffect } from 'react';
import {
  Save, X, Calculator, User, FileText, TrendingUp, Percent, DollarSign,
  Plus, Trash2, ArrowLeft, AlertCircle, CheckCircle, Building, Calendar,
  Loader2, Shield, Home, Heart, Book, Info
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function TaxCalculator() {
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    employee: '',
    financialYear: '',
    // Salary Components
    basicSalary: 0,
    hra: 0,
    specialAllowance: 0,
    otherAllowances: 0,
    lta: 0,
    // Statutory Deductions (Monthly)
    pf: 0,
    pt: 0,
    esic: 0,
    // Deductions under Chapter VI-A (Annual)
    section80C: 0,    // PPF, ELSS, Life Insurance, etc. (Max: 1,50,000)
    section80D: 0,    // Health Insurance (Max: 25,000/50,000)
    section80CCD: 0,  // NPS (Max: 50,000)
    section80E: 0,    // Education Loan Interest
    section24: 0,     // Home Loan Interest (Max: 2,00,000)
    otherDeductions: 0,
    // Tax Regime Selection
    taxRegime: 'new', // 'old' or 'new'
    // Additional Info
    age: 'below-60',  // 'below-60', '60-80', 'above-80'
    rentPaid: 0,      // Monthly
    cityType: 'metro', // 'metro' or 'non-metro'
    notes: ''
  });

  const [calculatedValues, setCalculatedValues] = useState({
    grossSalary: 0,
    totalExemptions: 0,
    totalDeductions: 0,
    taxableIncome: 0,
    totalTax: 0,
    cess: 0,
    finalTax: 0,
    taxBreakup: []
  });

  const [errors, setErrors] = useState({});

  // Tax slabs for different regimes (FY 2024-25)
  const taxSlabs = {
    old: {
      'below-60': [
        { limit: 250000, rate: 0 },
        { limit: 500000, rate: 0.05 },
        { limit: 1000000, rate: 0.20 },
        { above: 1000000, rate: 0.30 }
      ],
      '60-80': [
        { limit: 300000, rate: 0 },
        { limit: 500000, rate: 0.05 },
        { limit: 1000000, rate: 0.20 },
        { above: 1000000, rate: 0.30 }
      ],
      'above-80': [
        { limit: 500000, rate: 0 },
        { limit: 1000000, rate: 0.20 },
        { above: 1000000, rate: 0.30 }
      ]
    },
    new: {
      'below-60': [
        { limit: 300000, rate: 0 },
        { limit: 600000, rate: 0.05 },
        { limit: 900000, rate: 0.10 },
        { limit: 1200000, rate: 0.15 },
        { limit: 1500000, rate: 0.20 },
        { above: 1500000, rate: 0.30 }
      ],
      '60-80': [
        { limit: 300000, rate: 0 },
        { limit: 600000, rate: 0.05 },
        { limit: 900000, rate: 0.10 },
        { limit: 1200000, rate: 0.15 },
        { limit: 1500000, rate: 0.20 },
        { above: 1500000, rate: 0.30 }
      ],
      'above-80': [
        { limit: 300000, rate: 0 },
        { limit: 600000, rate: 0.05 },
        { limit: 900000, rate: 0.10 },
        { limit: 1200000, rate: 0.15 },
        { limit: 1500000, rate: 0.20 },
        { above: 1500000, rate: 0.30 }
      ]
    }
  };

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Set default financial year
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    let financialYear;
    if (currentMonth >= 4) {
      financialYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
    } else {
      financialYear = `${currentYear - 1}-${String(currentYear).slice(-2)}`;
    }

    setFormData(prev => ({
      ...prev,
      financialYear
    }));
  }, []);

  // Calculate values when relevant fields change
  useEffect(() => {
    calculateTax();
  }, [formData]);

  // Auto-fill salary details and investments when employee is selected
  useEffect(() => {
    const autoFillData = async () => {
      if (formData.employee && employees.length > 0) {
        const selectedEmployee = employees.find(emp => emp._id === formData.employee);
        if (selectedEmployee && selectedEmployee.payslipStructure) {
          const { basicSalary, earnings } = selectedEmployee.payslipStructure;

          // Helper to calculate component amount (fixed or percentage)
          const getComponentAmount = (searchName) => {
            if (!earnings || !Array.isArray(earnings)) return 0;
            const component = earnings.find(e =>
              e.name.toLowerCase() === searchName.toLowerCase() ||
              e.name.toLowerCase().includes(searchName.toLowerCase())
            );

            if (!component) return 0;
            if (component.calculationType === 'percentage') {
              return (basicSalary * (component.percentage || 0)) / 100;
            }
            return component.fixedAmount || 0;
          };

          const hra = getComponentAmount('HRA') || getComponentAmount('House Rent');
          const specialAllowance = getComponentAmount('Special');
          const lta = getComponentAmount('LTA') || getComponentAmount('Leave Travel');

          // Statutory Deductions (Monthly)
          const findDeductionAmount = (searchName) => {
            if (!selectedEmployee.payslipStructure.deductions) return 0;
            const component = selectedEmployee.payslipStructure.deductions.find(d =>
              d.name.toLowerCase() === searchName.toLowerCase() ||
              d.name.toLowerCase().includes(searchName.toLowerCase())
            );
            if (!component || component.enabled === false) return 0;
            if (component.calculationType === 'percentage') {
              return (basicSalary * (component.percentage || 0)) / 100;
            }
            return component.fixedAmount || 0;
          };

          const pf = findDeductionAmount('Provident Fund') || findDeductionAmount('PF');
          const pt = findDeductionAmount('Professional Tax') || findDeductionAmount('PT');
          const esic = findDeductionAmount('ESIC');

          // Sum up other allowances (everything except the ones above and basic)
          const knownKeywords = ['hra', 'house rent', 'special', 'lta', 'leave travel'];
          const otherAllowances = (earnings || [])
            .filter(e => !knownKeywords.some(kw => e.name.toLowerCase().includes(kw)))
            .reduce((sum, e) => {
              const amount = e.calculationType === 'percentage'
                ? (basicSalary * (e.percentage || 0)) / 100
                : (e.fixedAmount || 0);
              return sum + amount;
            }, 0);

          // Update info
          setFormData(prev => ({
            ...prev,
            basicSalary: basicSalary || 0,
            hra: hra,
            specialAllowance: specialAllowance,
            lta: lta,
            otherAllowances: otherAllowances,
            pf: pf,
            pt: pt,
            esic: esic,
            taxRegime: selectedEmployee.taxRegime || prev.taxRegime
          }));

          // Now fetch Investment Declaration
          try {
            const fy = formData.financialYear || "2025-26";
            const response = await fetch(`/api/v1/admin/payroll/investments?employeeId=${formData.employee}&financialYear=${fy}`);
            const investment = await response.json();

            if (investment && investment.sections) {
              const { sections } = investment;
              setFormData(prev => ({
                ...prev,
                section80C: sections.section80C?.total || 0,
                section80D: sections.section80D?.total || 0,
                rentPaid: (sections.hra?.annualRent || 0) / 12,
                cityType: sections.hra?.city?.toLowerCase() === 'metro' ? 'metro' : 'non-metro',
                section24: sections.otherDeductions?.interestOnHomeLoan || 0, // Mapping if available
                otherDeductions: sections.otherDeductions?.others || 0
              }));
              toast.success(`Investment details loaded for ${selectedEmployee.personalDetails?.firstName}`);
            }
          } catch (error) {
            console.error('Error fetching investments:', error);
          }

          toast.success(`Salary structure loaded for ${selectedEmployee.personalDetails?.firstName}`);
        }
      }
    };

    autoFillData();
  }, [formData.employee, employees, formData.financialYear]);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await fetch('/api/v1/admin/payroll/employees');

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data.data || data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees. Please try again.');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const calculateHRAExemption = () => {
    const { basicSalary, hra, rentPaid, cityType } = formData;

    // HRA exemption is minimum of:
    // 1. Actual HRA received
    // 2. Rent paid minus 10% of basic salary
    // 3. 50% of basic (metro) or 40% of basic (non-metro)

    const fiftyPercentOfBasic = cityType === 'metro' ? basicSalary * 0.5 : basicSalary * 0.4;
    const rentMinusTenPercent = Math.max(0, rentPaid - (basicSalary * 0.1));

    return Math.min(hra, fiftyPercentOfBasic, rentMinusTenPercent);
  };

  const calculateTax = () => {
    // Multiply monthly values by 12 for annual calculation
    const annualBasic = formData.basicSalary * 12;
    const annualHRA = formData.hra * 12;
    const annualSpecial = formData.specialAllowance * 12;
    const annualOther = formData.otherAllowances * 12;
    const annualLTA = formData.lta * 12;
    const annualRent = formData.rentPaid * 12;

    // Calculate Annual Gross Salary
    const grossSalary = annualBasic + annualHRA + annualSpecial + annualOther + annualLTA;

    // Calculate HRA Exemption (Annual)
    const fiftyPercentOfBasic = formData.cityType === 'metro' ? annualBasic * 0.5 : annualBasic * 0.4;
    const rentMinusTenPercent = Math.max(0, annualRent - (annualBasic * 0.1));
    const hraExemption = Math.min(annualHRA, fiftyPercentOfBasic, rentMinusTenPercent);

    const totalExemptions = hraExemption;

    // Calculate Deductions (Annual)
    // Section 80C includes PF contribution
    const annualPF = formData.pf * 12;
    const section80C = Math.min(formData.section80C + annualPF, 150000);
    const section80D = formData.age === 'below-60' ? Math.min(formData.section80D, 25000) : Math.min(formData.section80D, 50000);
    const section80CCD = Math.min(formData.section80CCD, 50000);
    const section24 = Math.min(formData.section24, 200000);

    // Professional Tax is also a deduction from gross salary
    const annualPT = formData.pt * 12;

    // Standard Deduction (Annual)
    const standardDeduction = formData.taxRegime === 'new' ? 75000 : 50000;

    const totalDeductions = formData.taxRegime === 'old' ?
      section80C + section80D + section80CCD + formData.section80E + section24 + formData.otherDeductions + standardDeduction + annualPT :
      standardDeduction; // New regime only has standard deduction

    // Calculate Taxable Income
    const taxableIncome = Math.max(0, grossSalary - totalExemptions - totalDeductions);

    // Calculate Tax based on slabs
    const slabs = taxSlabs[formData.taxRegime][formData.age];
    let totalTax = 0;
    let remainingIncome = taxableIncome;
    const taxBreakup = [];

    // Handle the case where taxable income is 0 or negative
    if (taxableIncome <= 0) {
      setCalculatedValues({
        grossSalary,
        totalExemptions,
        totalDeductions,
        taxableIncome,
        totalTax: 0,
        cess: 0,
        finalTax: 0,
        taxBreakup: []
      });
      return;
    }

    // Calculate tax using slab system
    let previousLimit = 0;

    for (let i = 0; i < slabs.length; i++) {
      const slab = slabs[i];

      if (slab.above) {
        const taxOnThisSlab = remainingIncome * slab.rate;
        totalTax += taxOnThisSlab;
        taxBreakup.push({
          range: `Above ${formatCurrency(previousLimit)}`,
          amount: taxOnThisSlab,
          rate: `${Math.round(slab.rate * 100)}%`
        });
        break;
      } else {
        const slabRange = slab.limit - previousLimit;
        const taxableInThisSlab = Math.min(remainingIncome, slabRange);

        if (taxableInThisSlab > 0) {
          const taxOnThisSlab = taxableInThisSlab * slab.rate;
          totalTax += taxOnThisSlab;
          taxBreakup.push({
            range: `${formatCurrency(previousLimit)} - ${formatCurrency(slab.limit)}`,
            amount: taxOnThisSlab,
            rate: `${Math.round(slab.rate * 100)}%`
          });
        }

        remainingIncome -= taxableInThisSlab;
        previousLimit = slab.limit;

        if (remainingIncome <= 0) break;
      }
    }

    // Section 87A Rebate
    // Old Regime: Income <= 5L, tax rebate up to 12.5k
    // New Regime: Income <= 7L, tax rebate up to 25k (Note: Budget 2025 says 12L for New Regime, but let's stick to current code or standard 7L)
    // The current slabs in the code go up to 15L, so it's likely standard FY 2024-25 rules.
    let rebate = 0;
    if (formData.taxRegime === 'new' && taxableIncome <= 700000) {
      rebate = totalTax;
    } else if (formData.taxRegime === 'old' && taxableIncome <= 500000) {
      rebate = Math.min(totalTax, 12500);
    }

    totalTax = Math.max(0, totalTax - rebate);

    // Calculate Cess (4% of total tax)
    const cess = totalTax * 0.04;
    const finalTax = totalTax + cess;

    setCalculatedValues({
      grossSalary,
      totalExemptions,
      totalDeductions,
      taxableIncome,
      totalTax,
      cess,
      finalTax,
      taxBreakup
    });
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employee) newErrors.employee = 'Please select an employee';
    if (!formData.financialYear) newErrors.financialYear = 'Financial year is required';
    if (!formData.basicSalary || formData.basicSalary <= 0) newErrors.basicSalary = 'Basic salary must be greater than 0';

    // Validate deduction limits
    if (formData.section80C > 150000) newErrors.section80C = 'Section 80C cannot exceed ₹1,50,000';
    if (formData.section80D > (formData.age === 'below-60' ? 25000 : 50000)) {
      newErrors.section80D = `Section 80D cannot exceed ${formData.age === 'below-60' ? '₹25,000' : '₹50,000'}`;
    }
    if (formData.section80CCD > 50000) newErrors.section80CCD = 'Section 80CCD(1B) cannot exceed ₹50,000';
    if (formData.section24 > 200000) newErrors.section24 = 'Section 24 cannot exceed ₹2,00,000';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        employee: formData.employee,
        financialYear: formData.financialYear,

        // Salary Components
        basicSalary: formData.basicSalary,
        hra: formData.hra,
        specialAllowance: formData.specialAllowance,
        otherAllowances: formData.otherAllowances,
        lta: formData.lta,

        // Deductions
        section80C: formData.section80C,
        section80D: formData.section80D,
        section80CCD: formData.section80CCD,
        section80E: formData.section80E,
        section24: formData.section24,
        otherDeductions: formData.otherDeductions,

        // Additional Info
        taxRegime: formData.taxRegime,
        age: formData.age,
        rentPaid: formData.rentPaid,
        cityType: formData.cityType,
        notes: formData.notes,

        // Calculated Values
        calculatedValues: calculatedValues,

        status: 'Calculated'
      };

      const response = await fetch('/api/v1/admin/payroll/taxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save tax calculation');
      }

      const result = await response.json();
      console.log('Tax calculation completed:', result);
      toast.success('Tax calculation completed successfully!');

    } catch (error) {
      console.error('Error calculating tax:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const selectedEmployee = employees.find(emp => emp._id === formData.employee);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <Toaster />
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-11 h-11 bg-yellow-600 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Tax Calculator</h1>
                <p className="text-slate-600 text-sm mt-0.5">Calculate employee tax deductions and liability</p>
              </div>
            </div>

            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Tax Regime Selection */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tax Regime Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.taxRegime === 'new'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <input
                    type="radio"
                    name="taxRegime"
                    value="new"
                    checked={formData.taxRegime === 'new'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${formData.taxRegime === 'new' ? 'border-yellow-500 bg-yellow-500' : 'border-slate-400'
                      }`}>
                      {formData.taxRegime === 'new' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">New Tax Regime</div>
                      <div className="text-sm text-slate-600">Lower rates but fewer deductions</div>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.taxRegime === 'old'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <input
                    type="radio"
                    name="taxRegime"
                    value="old"
                    checked={formData.taxRegime === 'old'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${formData.taxRegime === 'old' ? 'border-yellow-500 bg-yellow-500' : 'border-slate-400'
                      }`}>
                      {formData.taxRegime === 'old' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Old Tax Regime</div>
                      <div className="text-sm text-slate-600">Higher rates with full deductions</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Inputs */}
              <div className="xl:col-span-2 space-y-8">
                {/* Employee Information */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                        <User className="w-4 h-4 text-yellow-600" />
                      </div>
                      Employee Information
                    </h2>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Employee Selection */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Select Employee <span className="text-red-500">*</span>
                      </label>
                      {employeesLoading ? (
                        <div className="flex items-center space-x-2 py-3 px-4 border border-slate-300 rounded-lg bg-slate-50">
                          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                          <span className="text-slate-500 text-sm">Loading employees...</span>
                        </div>
                      ) : (
                        <select
                          name="employee"
                          value={formData.employee}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white ${errors.employee ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                            }`}
                        >
                          <option value="">Choose an employee...</option>
                          {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>
                              {emp.employeeId} - {emp.personalDetails.firstName} {emp.personalDetails.lastName}
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.employee && (
                        <div className="flex items-center space-x-1 text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.employee}</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Year and Age */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Financial Year <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="financialYear"
                          value={formData.financialYear}
                          onChange={handleChange}
                          placeholder="YYYY-YY"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Age Group</label>
                        <select
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                        >
                          <option value="below-60">Below 60 years</option>
                          <option value="60-80">60 - 80 years</option>
                          <option value="above-80">Above 80 years</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Salary Components */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      Salary Components
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    {[
                      { name: 'basicSalary', label: 'Basic Salary', required: true },
                      { name: 'hra', label: 'House Rent Allowance (HRA)' },
                      { name: 'specialAllowance', label: 'Special Allowance' },
                      { name: 'otherAllowances', label: 'Other Allowances' },
                      { name: 'lta', label: 'Leave Travel Allowance (LTA)' }
                    ].map((field) => (
                      <div key={field.name} className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="number"
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            placeholder="0"
                            step="0.01"
                            min="0"
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors[field.name] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                              }`}
                          />
                        </div>
                        {errors[field.name] && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors[field.name]}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* HRA Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Monthly Rent Paid</label>
                        <div className="relative">
                          <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="number"
                            name="rentPaid"
                            value={formData.rentPaid || ''}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">City Type</label>
                        <select
                          name="cityType"
                          value={formData.cityType}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                        >
                          <option value="metro">Metro (50% of Basic)</option>
                          <option value="non-metro">Non-Metro (40% of Basic)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statutory Deductions */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                        <TrendingUp className="w-4 h-4 text-red-600" />
                      </div>
                      Statutory Deductions (Monthly)
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-500 mb-2 italic">These are automatically deducted from your monthly payslip.</p>
                    {[
                      { name: 'pf', label: 'Provident Fund (PF)' },
                      { name: 'pt', label: 'Professional Tax (PT)' },
                      { name: 'esic', label: 'ESIC' }
                    ].map((field) => (
                      <div key={field.name} className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">{field.label}</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="number"
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deductions (Only for Old Regime) */}
                {formData.taxRegime === 'old' && (
                  <div className="bg-white rounded-xl border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                          <Shield className="w-4 h-4 text-blue-600" />
                        </div>
                        Deductions (Chapter VI-A)
                      </h2>
                    </div>

                    <div className="p-6 space-y-4">
                      {[
                        { name: 'section80C', label: 'Section 80C (PPF, ELSS, etc.)', max: 150000, icon: Book },
                        { name: 'section80D', label: 'Section 80D (Health Insurance)', max: formData.age === 'below-60' ? 25000 : 50000, icon: Heart },
                        { name: 'section80CCD', label: 'Section 80CCD(1B) (NPS)', max: 50000, icon: Shield },
                        { name: 'section80E', label: 'Section 80E (Education Loan)', icon: Book },
                        { name: 'section24', label: 'Section 24 (Home Loan Interest)', max: 200000, icon: Home },
                        { name: 'otherDeductions', label: 'Other Deductions', icon: FileText }
                      ].map((field) => (
                        <div key={field.name} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-sm font-semibold text-slate-700">
                              {field.label}
                            </label>
                            {field.max && (
                              <span className="text-xs text-slate-500">Max: {formatCurrency(field.max)}</span>
                            )}
                          </div>
                          <div className="relative">
                            <field.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="number"
                              name={field.name}
                              value={formData[field.name] || ''}
                              onChange={handleChange}
                              placeholder="0"
                              step="0.01"
                              min="0"
                              max={field.max}
                              className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors[field.name] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                                }`}
                            />
                          </div>
                          {errors[field.name] && (
                            <div className="flex items-center space-x-1 text-red-600 text-xs">
                              <AlertCircle className="w-3 h-3" />
                              <span>{errors[field.name]}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Summary */}
              <div className="xl:col-span-1">
                <div className="sticky top-6 space-y-6">
                  {/* Calculation Summary */}
                  <div className="bg-white rounded-xl border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Tax Calculation Summary
                      </h3>
                      <div className="mt-2 text-sm text-slate-600">
                        Regime: <span className="font-medium capitalize">{formData.taxRegime}</span>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      {/* Income Breakdown */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-slate-600">Gross Salary</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(calculatedValues.grossSalary)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-slate-600">Exemptions (HRA)</span>
                          <span className="font-semibold text-green-600">
                            -{formatCurrency(calculatedValues.totalExemptions)}
                          </span>
                        </div>

                        {formData.taxRegime === 'old' && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-slate-600">Deductions</span>
                            <span className="font-semibold text-green-600">
                              -{formatCurrency(calculatedValues.totalDeductions)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded-lg border">
                          <span className="text-sm font-medium text-blue-900">Taxable Income</span>
                          <span className="font-bold text-blue-900">
                            {formatCurrency(calculatedValues.taxableIncome)}
                          </span>
                        </div>
                      </div>

                      {/* Tax Breakdown */}
                      {calculatedValues.taxBreakup.length > 0 && (
                        <div className="pt-4 border-t border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Tax Breakdown</h4>
                          <div className="space-y-2">
                            {calculatedValues.taxBreakup.map((slab, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">{slab.range} ({slab.rate})</span>
                                <span className="font-medium text-slate-900">{formatCurrency(slab.amount)}</span>
                              </div>
                            ))}

                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                              <span className="text-sm text-slate-600">Income Tax</span>
                              <span className="font-semibold text-slate-900">
                                {formatCurrency(calculatedValues.totalTax)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Health & Education Cess (4%)</span>
                              <span className="font-semibold text-slate-900">
                                {formatCurrency(calculatedValues.cess)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Final Result */}
                      <div className="pt-6 border-t border-slate-200">
                        <div className="bg-yellow-500 text-white p-4 rounded-xl">
                          <div className="text-xs uppercase font-bold opacity-80 mb-1">Total Annual Tax</div>
                          <div className="text-3xl font-black">
                            {formatCurrency(calculatedValues.finalTax)}
                          </div>
                          <div className="text-xs mt-2 opacity-80">
                            Estimated Monthly TDS: <span className="font-bold">{formatCurrency(Math.round(calculatedValues.finalTax / 12))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={loading || employeesLoading}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Calculation
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all font-bold"
                    >
                      <X className="w-5 h-5" />
                      Discard Changes
                    </button>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 items-start">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      <strong>Note:</strong> These calculations are estimates based on provided data. Actual tax liability may vary according to government rules and declarations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}