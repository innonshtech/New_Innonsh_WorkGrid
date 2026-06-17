
// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import {
//   Plus, Search, Eye, Calculator, FileText, CheckCircle,
//   Clock, AlertCircle, User, RefreshCw, DollarSign,
//   Download, Settings, Archive, Calendar, BarChart3, Bell, FilterX
// } from 'lucide-react';

// export default function TaxCalculations() {
//   const [taxCalculations, setTaxCalculations] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [yearFilter, setYearFilter] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchTaxCalculations();
//   }, [searchTerm, yearFilter, statusFilter]);

//   const fetchTaxCalculations = async () => {
//     try {
//       setLoading(!taxCalculations.length);
//       setRefreshing(taxCalculations.length > 0);
//       setError(null);

//       const params = new URLSearchParams();
//       if (searchTerm) params.append('search', searchTerm);
//       if (yearFilter) params.append('financialYear', yearFilter);
//       if (statusFilter) params.append('status', statusFilter);

//       const response = await fetch(`/api/v1/admin/payroll/taxes?${params}`);
//       const data = await response.json();

//       if (response.ok) {
//         setTaxCalculations(data.taxCalculations || []);
//       } else {
//         setError(data.error || 'Failed to fetch tax calculations');
//       }
//     } catch (error) {
//       setError('Network error occurred while fetching data');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const getStatusConfig = (status) => {
//     const configs = {
//       Calculated: { 
//         color: 'text-blue-700', 
//         bg: 'bg-slate-50', 
//         border: 'border-blue-200',
//         icon: Calculator
//       },
//       Reviewed: { 
//         color: 'text-amber-700', 
//         bg: 'bg-amber-50', 
//         border: 'border-amber-200',
//         icon: FileText
//       },
//       Approved: { 
//         color: 'text-green-700', 
//         bg: 'bg-green-50', 
//         border: 'border-green-200',
//         icon: CheckCircle
//       },
//       Filed: { 
//         color: 'text-purple-700', 
//         bg: 'bg-purple-50', 
//         border: 'border-purple-200',
//         icon: Archive
//       },
//     };
//     return configs[status] || configs.Calculated;
//   };

//   const StatusBadge = ({ status }) => {
//     const config = getStatusConfig(status);
//     const Icon = config.icon;

//     return (
//       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${config.bg} ${config.color} ${config.border} border`}>
//         <Icon className="w-3 h-3" />
//         {status}
//       </span>
//     );
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   const currentYear = new Date().getFullYear();
//   const financialYears = Array.from({ length: 5 }, (_, i) => {
//     const year = currentYear - i;
//     return `${year}-${String(year + 1).slice(-2)}`;
//   });

//   const hasActiveFilters = searchTerm || yearFilter || statusFilter;
//   const totalCalculations = taxCalculations.length;

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-50">
//         <div className="flex items-center justify-center h-screen">
//           <div className="text-center space-y-4">
//             <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
//             <div>
//               <h3 className="text-lg font-semibold text-slate-900">Loading Tax Calculations</h3>
//               <p className="text-sm text-slate-600 mt-1">Please wait while we fetch your data...</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50">
//       {/* Header */}
//       <div className="bg-white border-b border-slate-200">
//         <div className="max-w-7xl mx-auto px-6 py-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center">
//                 <Calculator className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-900">Tax Calculations</h1>
//                 <p className="text-slate-600 text-sm mt-0.5">HR & Payroll Financial Management System</p>
//               </div>
//             </div>

//             <div className="flex items-center space-x-2">
//               <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
//                 <Bell className="w-5 h-5" />
//               </button>
//               <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
//                 <Settings className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
//         {/* Analytics Overview */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div className="bg-white p-6 rounded-xl border border-slate-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-slate-600">Total Records</p>
//                 <p className="text-2xl font-bold text-slate-900 mt-2">{totalCalculations}</p>
//                 <p className="text-xs text-slate-500 mt-1">Active calculations</p>
//               </div>
//               <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
//                 <BarChart3 className="w-6 h-6 text-yellow-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white p-6 rounded-xl border border-slate-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-slate-600">Total Tax Amount</p>
//                 <p className="text-xl font-bold text-slate-900 mt-2">
//                   {formatCurrency(taxCalculations.reduce((sum, calc) => sum + (calc.totalTax || 0), 0))}
//                 </p>
//                 <p className="text-xs text-slate-500 mt-1">Calculated liability</p>
//               </div>
//               <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-blue-100">
//                 <DollarSign className="w-6 h-6 text-blue-600" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Main Data Panel */}
//         <div className="bg-white rounded-xl border border-slate-200">
//           {/* Panel Header */}
//           <div className="p-6 border-b border-slate-200">
//             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
//               <div className="flex items-center space-x-3">
//                 <h2 className="text-xl font-semibold text-slate-900">Financial Records Management</h2>
//                 {hasActiveFilters && (
//                   <span className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
//                     Filtered Results
//                   </span>
//                 )}
//               </div>

//               <div className="flex items-center space-x-3">
//                 <button
//                   onClick={fetchTaxCalculations}
//                   disabled={refreshing}
//                   className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 disabled:opacity-50 transition-colors font-medium"
//                 >
//                   <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
//                   Refresh Data
//                 </button>

//                 <button className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium">
//                   <Download className="w-4 h-4" />
//                   Export
//                 </button>

//                 <Link
//                   href="/payroll/tax-calculations/tax-calculator"
//                   className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
//                 >
//                   <Plus className="w-4 h-4" />
//                   New Calculation
//                 </Link>
//               </div>
//             </div>

//             {/* Search and Filter Controls */}
//             <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
//               <div className="lg:col-span-6">
//                 <label className="block text-sm font-medium text-slate-700 mb-2">Search Records</label>
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                   <input
//                     type="text"
//                     placeholder="Search by employee name, ID, or amount..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                   />
//                 </div>
//               </div>

//               <div className="lg:col-span-2">
//                 <label className="block text-sm font-medium text-slate-700 mb-2">Financial Year</label>
//                 <select
//                   value={yearFilter}
//                   onChange={(e) => setYearFilter(e.target.value)}
//                   className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
//                 >
//                   <option value="">All Years</option>
//                   {financialYears.map(year => (
//                     <option key={year} value={year}>FY {year}</option>
//                   ))}
//                 </select>
//               </div>

//               <div className="lg:col-span-2">
//                 <label className="block text-sm font-medium text-slate-700 mb-2">Status Filter</label>
//                 <select
//                   value={statusFilter}
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                   className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
//                 >
//                   <option value="">All Status</option>
//                   <option value="Calculated">Calculated</option>
//                   <option value="Reviewed">Reviewed</option>
//                   <option value="Approved">Approved</option>
//                   <option value="Filed">Filed</option>
//                 </select>
//               </div>

//               <div className="lg:col-span-2 flex items-end">
//                 {hasActiveFilters && (
//                   <button
//                     onClick={() => {
//                       setSearchTerm('');
//                       setYearFilter('');
//                       setStatusFilter('');
//                     }}
//                     className="w-full px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-medium"
//                     title="Clear all filters"
//                   >
//                     <FilterX className="w-4 h-4 mr-2" />
//                     Clear Filters
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Error Display */}
//           {error && (
//             <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
//               <div className="flex items-start space-x-3">
//                 <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
//                 <div>
//                   <h4 className="text-sm font-semibold text-red-800">Data Loading Error</h4>
//                   <p className="text-sm text-red-700 mt-1">{error}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Data Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-slate-50 border-b border-slate-200">
//                 <tr>
//                   <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                     Employee Information
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                     Financial Period
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                     Taxable Income
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                     Tax Liability
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                     Processing Status
//                   </th>
//                   <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-slate-200">
//                 {taxCalculations.length === 0 ? (
//                   <tr>
//                     <td colSpan={6} className="px-6 py-16 text-center">
//                       <div className="flex flex-col items-center space-y-4">
//                         <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
//                           <Calculator className="w-8 h-8 text-slate-400" />
//                         </div>
//                         <div>
//                           <h3 className="text-lg font-semibold text-slate-900">
//                             {hasActiveFilters ? 'No Records Match Your Criteria' : 'No Tax Calculations Found'}
//                           </h3>
//                           <p className="text-slate-500 text-sm mt-1 max-w-md">
//                             {hasActiveFilters 
//                               ? 'Try adjusting your search terms or filters to find the records you\'re looking for.'
//                               : 'Get started by creating your first tax calculation for supply chain financial management.'
//                             }
//                           </p>
//                         </div>
//                         {hasActiveFilters && (
//                           <button
//                             onClick={() => {
//                               setSearchTerm('');
//                               setYearFilter('');
//                               setStatusFilter('');
//                             }}
//                             className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors"
//                           >
//                             <FilterX className="w-4 h-4" />
//                             Reset All Filters
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   taxCalculations.map((calc) => (
//                     <tr key={calc._id} className="hover:bg-slate-50 transition-colors">
//                       <td className="px-6 py-4">
//                         <div className="flex items-center space-x-3">
//                           <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
//                             <User className="w-5 h-5 text-yellow-600" />
//                           </div>
//                           <div>
//                             <div className="text-sm font-semibold text-slate-900">
//                               {calc.employee?.personalDetails?.firstName} {calc.employee?.personalDetails?.lastName}
//                             </div>
//                             <div className="text-xs text-slate-500 mt-0.5">
//                               ID: {calc.employee?.employeeId}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="flex items-center space-x-2">
//                           <Calendar className="w-4 h-4 text-slate-400" />
//                           <span className="text-sm font-medium text-slate-900">
//                             FY {calc.financialYear}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm font-semibold text-slate-900">
//                           {formatCurrency(calc.taxableIncome)}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm font-bold text-slate-900">
//                           {formatCurrency(calc.totalTax)}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <StatusBadge status={calc.status} />
//                       </td>
//                       <td className="px-6 py-4 text-right">
//                         <div className="flex items-center justify-end">
//                           <Link
//                             href={`/payroll/tax-calculations/${calc._id}`}
//                             className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
//                             title="View detailed information"
//                           >
//                             <Eye className="w-4 h-4" />
//                           </Link>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Eye, Calculator, FileText, CheckCircle,
  Clock, AlertCircle, User, RefreshCw, DollarSign,
  Download, Settings, Archive, Calendar, BarChart3, FilterX,
  ChevronLeft, ChevronRight, MoreHorizontal
} from 'lucide-react';

export default function TaxCalculations() {
  const [taxCalculations, setTaxCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchTaxCalculations();
  }, [searchTerm, yearFilter, statusFilter]);

  const fetchTaxCalculations = async () => {
    try {
      setLoading(!taxCalculations.length);
      setRefreshing(taxCalculations.length > 0);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (yearFilter) params.append('financialYear', yearFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/v1/admin/payroll/taxes?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTaxCalculations(data.taxCalculations || []);
      } else {
        setError(data.error || 'Failed to fetch tax calculations');
      }
    } catch (error) {
      setError('Network error occurred while fetching data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pagination calculations
  const paginationData = (() => {
    const totalItems = taxCalculations.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Calculate current page items
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = taxCalculations.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems),
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  })();

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, yearFilter, statusFilter, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const { totalPages } = paginationData;
    const current = currentPage;
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    let prev = 0;
    for (const i of range) {
      if (i - prev > 1) {
        rangeWithDots.push("...");
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  // Pagination Component
  const Pagination = () => {
    const { totalPages, startIndex, endIndex, totalItems, hasPrevious, hasNext } = paginationData;

    // Show pagination if there are any items, even just one page
    if (totalItems === 0) return null;

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border border-slate-200">
        {/* Page info */}
        <div className="text-sm text-slate-600">
          Showing <span className="font-semibold">{startIndex}-{endIndex}</span> of <span className="font-semibold">{totalItems}</span> records
          {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
        </div>

        {/* Only show pagination controls if there are multiple pages */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {/* Items per page selector */}
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-slate-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
              </select>
            </div>

            {/* Previous button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevious}
              className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {pageNumbers.map((page, index) => (
                <div key={index}>
                  {page === "..." ? (
                    <span className="flex items-center justify-center h-9 w-9 text-sm text-slate-500">
                      <MoreHorizontal className="h-4 w-4" />
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`h-9 w-9 flex items-center justify-center text-sm font-medium border transition-colors rounded-md ${currentPage === page
                        ? "bg-yellow-500 border-yellow-500 text-white hover:bg-yellow-600"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      {page}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNext}
              className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const getStatusConfig = (status) => {
    const configs = {
      Calculated: {
        color: 'text-blue-700',
        bg: 'bg-slate-50',
        border: 'border-blue-200',
        icon: Calculator
      },
      Reviewed: {
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: FileText
      },
      Approved: {
        color: 'text-green-700',
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: CheckCircle
      },
      Filed: {
        color: 'text-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: Archive
      },
    };
    return configs[status] || configs.Calculated;
  };

  const StatusBadge = ({ status }) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${config.bg} ${config.color} ${config.border} border`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const currentYear = new Date().getFullYear();
  const financialYears = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return `${year}-${String(year + 1).slice(-2)}`;
  });

  const hasActiveFilters = searchTerm || yearFilter || statusFilter;
  const totalCalculations = taxCalculations.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Loading Tax Calculations</h3>
              <p className="text-sm text-slate-600 mt-1">Please wait while we fetch your data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Tax Calculations</h1>
                <p className="text-slate-600 text-sm mt-0.5">HR & Payroll Financial Management System</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">

              <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Records</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{totalCalculations}</p>
                <p className="text-xs text-slate-500 mt-1">Active calculations</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Tax Amount</p>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {formatCurrency(taxCalculations.reduce((sum, calc) => sum + (calc.totalTax || 0), 0))}
                </p>
                <p className="text-xs text-slate-500 mt-1">Calculated liability</p>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-blue-100">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Data Panel */}
        <div className="bg-white rounded-xl border border-slate-200">
          {/* Panel Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-slate-900">
                  Financial Records Management ({paginationData.totalItems})
                  {paginationData.totalPages > 1 && ` • Page ${currentPage} of ${paginationData.totalPages}`}
                </h2>
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                    Filtered Results
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchTaxCalculations}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 disabled:opacity-50 transition-colors font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Data
                </button>

                <button className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium">
                  <Download className="w-4 h-4" />
                  Export
                </button>

                <Link
                  href="/admin/payroll/tax-calculations/tax-calculator"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Calculation
                </Link>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Search Records</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by employee name, ID, or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Financial Year</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                >
                  <option value="">All Years</option>
                  {financialYears.map(year => (
                    <option key={year} value={year}>FY {year}</option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                >
                  <option value="">All Status</option>
                  <option value="Calculated">Calculated</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Approved">Approved</option>
                  <option value="Filed">Filed</option>
                </select>
              </div>

              <div className="lg:col-span-2 flex items-end">
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setYearFilter('');
                      setStatusFilter('');
                    }}
                    className="w-full px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-medium"
                    title="Clear all filters"
                  >
                    <FilterX className="w-4 h-4 mr-2" />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800">Data Loading Error</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Employee Information
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Financial Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Taxable Income
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Tax Liability
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Processing Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {paginationData.currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Calculator className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {hasActiveFilters ? 'No Records Match Your Criteria' : 'No Tax Calculations Found'}
                          </h3>
                          <p className="text-slate-500 text-sm mt-1 max-w-md">
                            {hasActiveFilters
                              ? 'Try adjusting your search terms or filters to find the records you\'re looking for.'
                              : 'Get started by creating your first tax calculation for supply chain financial management.'
                            }
                          </p>
                        </div>
                        {hasActiveFilters && (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setYearFilter('');
                              setStatusFilter('');
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors"
                          >
                            <FilterX className="w-4 h-4" />
                            Reset All Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginationData.currentItems.map((calc) => (
                    <tr key={calc._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                            <User className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {calc.employee?.personalDetails?.firstName} {calc.employee?.personalDetails?.lastName}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              ID: {calc.employee?.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">
                            FY {calc.financialYear}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {formatCurrency(calc.taxableIncome)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">
                          {formatCurrency(calc.totalTax)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={calc.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end">
                          <Link
                            href={`/payroll/tax-calculations/${calc._id}`}
                            className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="View detailed information"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination />
        </div>
      </div>
    </div>
  );
}