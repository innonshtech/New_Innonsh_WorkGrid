// 'use client';

// import { useState, useEffect } from 'react';
// import {
//   Plus, Edit2, Trash2, Eye, Search, Filter,
//   Building2, Users, MapPin, Phone, Mail, Calendar,
//   X, Save, ArrowLeft, ExternalLink, ChevronDown, Check,
//   RefreshCw, FilterX, AlertCircle, CheckCircle, TrendingUp,
//   ChevronLeft, ChevronRight, MoreHorizontal, FolderOpen, Layers
// } from 'lucide-react';

// const API_URL = '/api/crm/departments';
// const ORGANIZATIONS_API = '/api/crm/organizations';

// const initialFormData = {
//   organizationName: '',
//   departmentName: '',
//   status: 'Active',
// };

// export default function DepartmentsPage() {
//   const [departments, setDepartments] = useState([]);
//   const [organizations, setOrganizations] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [view, setView] = useState('list');
//   const [selectedDepartment, setSelectedDepartment] = useState(null);
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [formData, setFormData] = useState(initialFormData);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [pagination, setPagination] = useState({
//     page: 1,
//     pages: 1,
//     total: 0,
//     limit: 9,
//   });

//   // Fetch organizations and employee types for dropdowns
//   useEffect(() => {
//     const fetchDropdownData = async () => {
//       try {
//         console.log('Fetching dropdown data...');

//         // Fetch organizations
//         const orgsRes = await fetch(`${ORGANIZATIONS_API}?page=1&limit=100`);
//         if (orgsRes.ok) {
//           const orgsData = await orgsRes.json();
//           const orgsList = orgsData.organizations || orgsData.data || [];
//           setOrganizations(orgsList);
//           console.log('Organizations loaded:', orgsList.length);
//         } else {
//           console.error('Failed to fetch organizations:', orgsRes.status);
//           setError('Failed to load organizations');
//         }

//       } catch (err) {
//         console.error('Error fetching dropdown data:', err);
//         setError('Failed to load some dropdown data. Using available options.');
//       }
//     };

//     fetchDropdownData();
//   }, []);

//   async function fetchDepartments(options = {}) {
//     const {
//       page = pagination.page || 1,
//       limit = pagination.limit || 9,
//       search = searchTerm,
//       status = statusFilter,
//     } = options;

//     try {
//       setLoading(!departments.length);
//       setRefreshing(departments.length > 0);
//       setError('');

//       const params = new URLSearchParams();
//       params.set('page', page.toString());
//       params.set('limit', limit.toString());
//       if (search) params.set('search', search);
//       if (status !== 'all') params.set('status', status);

//       const res = await fetch(`${API_URL}?${params.toString()}`);
//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || `Failed to fetch departments: ${res.status}`);
//       }

//       const data = await res.json();

//       // Handle different response structures
//       const departmentsList = data.data || data.departments || [];

//       setDepartments(departmentsList);

//       setPagination(data.pagination || {
//         page,
//         total: data.total || departmentsList.length,
//         pages: Math.ceil((data.total || departmentsList.length) / limit),
//         limit
//       });

//     } catch (err) {
//       console.error('Fetch departments error:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }

//   useEffect(() => {
//     fetchDepartments({ page: 1 });
//   }, []);

//   useEffect(() => {
//     setPagination(prev => ({ ...prev, page: 1 }));
//   }, [searchTerm, statusFilter]);

//   useEffect(() => {
//     fetchDepartments({ page: pagination.page });
//   }, [pagination.page, pagination.limit, searchTerm, statusFilter]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const resetForm = () => {
//     setFormData(initialFormData);
//     setSelectedDepartment(null);
//     setError('');
//     setSuccess('');
//   };

//   const handleCreate = async () => {
//     try {
//       setIsSubmitting(true);
//       setError('');
//       setSuccess('');

//       if (!formData.organizationName || !formData.departmentName.trim()) {
//         setError('Organization, and Department Name are required');
//         return;
//       }

//       const res = await fetch(API_URL, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || 'Failed to create department');

//       setSuccess('Department created successfully');
//       await fetchDepartments({ page: 1 });
//       resetForm();
//       setView('list');

//     } catch (err) {
//       console.error('Create department error:', err);
//       setError(err.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleUpdate = async () => {
//     if (!selectedDepartment?._id) return;

//     try {
//       setIsSubmitting(true);
//       setError('');
//       setSuccess('');

//       const res = await fetch(`${API_URL}/${selectedDepartment._id}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || 'Failed to update department');

//       setSuccess('Department updated successfully');
//       await fetchDepartments({ page: pagination.page });
//       resetForm();
//       setView('list');

//     } catch (err) {
//       console.error('Update department error:', err);
//       setError(err.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm('Are you sure you want to delete this department?')) return;

//     try {
//       const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || 'Failed to delete department');

//       const nextPage = departments.length === 1 && pagination.page > 1
//         ? pagination.page - 1
//         : pagination.page;

//       await fetchDepartments({ page: nextPage });

//     } catch (err) {
//       console.error('Delete department error:', err);
//       setError(err.message);
//     }
//   };

//   const handleView = async (dept) => {
//     try {
//       const res = await fetch(`${API_URL}/${dept._id}`);
//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Failed to fetch department details');
//       }

//       const fullDept = await res.json();
//       setSelectedDepartment(fullDept);
//       setView('view');
//     } catch (err) {
//       console.error('View department error:', err);
//       setError(err.message);
//     }
//   };

//   const handleEdit = async (dept) => {
//     try {
//       const res = await fetch(`${API_URL}/${dept._id}`);
//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Failed to fetch department details');
//       }

//       const fullDept = await res.json();

//       setSelectedDepartment(fullDept);
//       setFormData({
//         organizationName: fullDept.organizationName || '',
//         departmentName: fullDept.departmentName || '',
//         status: fullDept.status || 'Active',
//       });

//       setView('edit');
//     } catch (err) {
//       console.error('Edit department error:', err);
//       setError(err.message);
//     }
//   };

//   // Helper function to get organization name
//   const getOrganizationName = (dept) => {
//     return dept?.organizationName || 'Unknown Organization';
//   };

//   const handleSearchChange = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const handleStatusFilterChange = (e) => {
//     setStatusFilter(e.target.value);
//   };

//   const handlePageChange = async (newPage) => {
//     if (newPage < 1 || newPage > pagination.pages) return;
//     await fetchDepartments({ page: newPage });
//   };

//   const handleLimitChange = (value) => {
//     setPagination(prev => ({ ...prev, limit: Number(value), page: 1 }));
//   };

//   const hasActiveFilters = searchTerm || statusFilter !== 'all';

//   const StatusPill = ({ status }) => (
//     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${status === 'Active'
//         ? 'bg-green-50 text-green-700 border-green-200'
//         : 'bg-red-50 text-red-700 border-red-200'
//       }`}>
//       <div className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
//       {status}
//     </span>
//   );

//   const Pagination = () => {
//     const { pages, page, total, limit } = pagination;
//     const startIndex = (page - 1) * limit + 1;
//     const endIndex = Math.min(page * limit, total);
//     if (pages <= 1) return null;
//     const getPageNumbers = () => {
//       const delta = 2;
//       const range = [];
//       const rangeWithDots = [];
//       for (let i = 1; i <= pages; i++) {
//         if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
//           range.push(i);
//         }
//       }
//       let prev = 0;
//       for (const i of range) {
//         if (i - prev > 1) {
//           rangeWithDots.push("...");
//         }
//         rangeWithDots.push(i);
//         prev = i;
//       }
//       return rangeWithDots;
//     };
//     const pageNumbers = getPageNumbers();
//     return (
//       <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border border-slate-200">
//         <div className="text-sm text-slate-600">
//           Showing <span className="font-semibold">{startIndex}-{endIndex}</span> of{' '}
//           <span className="font-semibold">{total}</span> departments
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="flex items-center gap-2 mr-4">
//             <span className="text-sm text-slate-600">Show:</span>
//             <select
//               value={limit}
//               onChange={(e) => handleLimitChange(e.target.value)}
//               className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
//             >
//               <option value={6}>6</option>
//               <option value={9}>9</option>
//               <option value={12}>12</option>
//               <option value={18}>18</option>
//               <option value={24}>24</option>
//             </select>
//           </div>
//           <button
//             onClick={() => handlePageChange(page - 1)}
//             disabled={page <= 1}
//             className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             <ChevronLeft className="h-4 w-4" />
//           </button>
//           <div className="flex items-center gap-1">
//             {pageNumbers.map((pageNum, index) => (
//               <div key={index}>
//                 {pageNum === "..." ? (
//                   <span className="flex items-center justify-center h-9 w-9 text-sm text-slate-500">
//                     <MoreHorizontal className="h-4 w-4" />
//                   </span>
//                 ) : (
//                   <button
//                     onClick={() => handlePageChange(pageNum)}
//                     className={`h-9 w-9 flex items-center justify-center text-sm font-medium border transition-colors rounded-md ${page === pageNum
//                         ? "bg-yellow-500 border-yellow-500 text-white hover:bg-yellow-600"
//                         : "border-slate-300 text-slate-600 hover:bg-slate-50"
//                       }`}
//                   >
//                     {pageNum}
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>
//           <button
//             onClick={() => handlePageChange(page + 1)}
//             disabled={page >= pages}
//             className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             <ChevronRight className="h-4 w-4" />
//           </button>
//         </div>
//       </div>
//     );
//   };

//   if (loading && !refreshing) {
//     return (
//       <div className="min-h-screen bg-slate-50">
//         <div className="flex items-center justify-center h-screen">
//           <div className="text-center space-y-4">
//             <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
//             <div>
//               <h3 className="text-lg font-semibold text-slate-900">Loading Departments</h3>
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
//                 <Layers className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
//                 <p className="text-slate-600 text-sm mt-0.5">Manage departments, teams, and access</p>
//               </div>
//             </div>

//             {view === 'list' && (
//               <button
//                 onClick={() => {
//                   resetForm();
//                   setView('create');
//                 }}
//                 className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add Department
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
//         {/* Analytics Overview */}
//         {view === 'list' && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="bg-white p-6 rounded-xl border border-slate-200">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-slate-600">Total Departments</p>
//                   <p className="text-2xl font-bold text-slate-900 mt-2">{pagination.total}</p>
//                   <p className="text-xs text-slate-500 mt-1">All departments</p>
//                 </div>
//                 <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
//                   <Layers className="w-6 h-6 text-yellow-600" />
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white p-6 rounded-xl border border-slate-200">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-slate-600">Active</p>
//                   <p className="text-2xl font-bold text-slate-900 mt-2">
//                     {departments.filter(dept => dept.status === 'Active').length}
//                   </p>
//                   <p className="text-xs text-slate-500 mt-1">Operational departments</p>
//                 </div>
//                 <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
//                   <CheckCircle className="w-6 h-6 text-green-600" />
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white p-6 rounded-xl border border-slate-200">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-slate-600">Organizations</p>
//                   <p className="text-2xl font-bold text-slate-900 mt-2">
//                     {new Set(departments.map(dept => dept.organizationName)).size}
//                   </p>
//                   <p className="text-xs text-slate-500 mt-1">Active organizations</p>
//                 </div>
//                 <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-blue-100">
//                   <Building2 className="w-6 h-6 text-blue-600" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Controls Panel */}
//         <div className="bg-white rounded-xl border border-slate-200">
//           {view === 'list' && (
//             <div className="p-6 border-b border-slate-200">
//               <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
//                 <div className="flex items-center space-x-3">
//                   <h2 className="text-xl font-semibold text-slate-900">
//                     Departments ({pagination.total})
//                   </h2>
//                   {hasActiveFilters && (
//                     <span className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
//                       Filtered Results
//                     </span>
//                   )}
//                 </div>

//                 <div className="flex items-center space-x-3">
//                   <button
//                     onClick={() => fetchDepartments({ page: pagination.page })}
//                     disabled={refreshing}
//                     className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 disabled:opacity-50 transition-colors font-medium"
//                   >
//                     <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
//                     Refresh
//                   </button>
//                 </div>
//               </div>

//               {/* Search and Filters */}
//               <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
//                 <div className="lg:col-span-6">
//                   <label className="block text-sm font-medium text-slate-700 mb-2">Search Departments</label>
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                     <input
//                       type="text"
//                       placeholder="Search by department name "
//                       value={searchTerm}
//                       onChange={handleSearchChange}
//                       className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                     />
//                   </div>
//                 </div>

//                 <div className="lg:col-span-4">
//                   <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
//                   <select
//                     value={statusFilter}
//                     onChange={handleStatusFilterChange}
//                     className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
//                   >
//                     <option value="all">All Status</option>
//                     <option value="Active">Active</option>
//                     <option value="Inactive">Inactive</option>
//                   </select>
//                 </div>

//                 <div className="lg:col-span-2 flex items-end">
//                   {hasActiveFilters && (
//                     <button
//                       onClick={async () => {
//                         setSearchTerm('');
//                         setStatusFilter('all');
//                         await fetchDepartments({ page: 1 });
//                       }}
//                       className="w-full px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-medium"
//                       title="Clear all filters"
//                     >
//                       <FilterX className="w-4 h-4 mr-2" />
//                       Clear
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Content */}
//           <div className="p-6">
//             {view === 'list' ? (
//               <>
//                 {error && (
//                   <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
//                     <div className="flex items-start space-x-3">
//                       <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
//                       <div>
//                         <h4 className="text-sm font-semibold text-red-800">Error</h4>
//                         <p className="text-sm text-red-700 mt-1">{error}</p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {success && (
//                   <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
//                     <div className="flex items-start space-x-3">
//                       <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
//                       <div>
//                         <h4 className="text-sm font-semibold text-green-800">Success</h4>
//                         <p className="text-sm text-green-700 mt-1">{success}</p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {departments.length === 0 ? (
//                   <div className="text-center py-16">
//                     <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
//                       <Layers className="w-8 h-8 text-slate-400" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-slate-900 mb-2">
//                       {hasActiveFilters ? 'No departments match your criteria' : 'No departments found'}
//                     </h3>
//                     <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
//                       {hasActiveFilters
//                         ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
//                         : 'Get started by adding your first department to manage your teams.'
//                       }
//                     </p>
//                     {hasActiveFilters ? (
//                       <button
//                         onClick={async () => {
//                           setSearchTerm('');
//                           setStatusFilter('all');
//                           await fetchDepartments({ page: 1 });
//                         }}
//                         className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors"
//                       >
//                         <FilterX className="w-4 h-4" />
//                         Clear All Filters
//                       </button>
//                     ) : (
//                       <button
//                         onClick={() => {
//                           resetForm();
//                           setView('create');
//                         }}
//                         className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
//                       >
//                         <Plus className="w-4 h-4" />
//                         Add First Department
//                       </button>
//                     )}
//                   </div>
//                 ) : (
//                   <>
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                       {departments.map((dept) => (
//                         <div key={dept._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover: transition-">
//                           <div className="p-6">
//                             <div className="flex items-start justify-between mb-4">
//                               <div className="flex items-center gap-3">
//                                 <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
//                                   <Layers className="w-6 h-6 text-white" />
//                                 </div>
//                                 <div className="flex-1">
//                                   <h3 className="font-semibold text-slate-900 text-sm">
//                                     {dept.departmentName}
//                                   </h3>
//                                   <p className="text-xs text-slate-500 mt-0.5">
//                                     {getOrganizationName(dept)}
//                                   </p>
//                                 </div>
//                               </div>
//                               <StatusPill status={dept.status} />
//                             </div>



//                             <div className="flex items-center justify-between pt-4 border-t border-slate-200">
//                               <div className="flex items-center gap-1">
//                                 <button
//                                   onClick={() => handleView(dept)}
//                                   className="p-2 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
//                                   title="View"
//                                 >
//                                   <Eye className="w-4 h-4" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleEdit(dept)}
//                                   className="p-2 hover:bg-slate-100 text-slate-400 hover:text-yellow-600 rounded-lg transition-colors"
//                                   title="Edit"
//                                 >
//                                   <Edit2 className="w-4 h-4" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleDelete(dept._id)}
//                                   className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
//                                   title="Delete"
//                                 >
//                                   <Trash2 className="w-4 h-4" />
//                                 </button>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                     <Pagination />
//                   </>
//                 )}
//               </>
//             ) : (
//               /* CREATE / EDIT / VIEW */
//               <>
//                 {(error) && (
//                   <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
//                     <div className="flex items-start space-x-3">
//                       <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
//                       <div>
//                         <h4 className="text-sm font-semibold text-red-800">Error</h4>
//                         <p className="text-sm text-red-700 mt-1">{error}</p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {success && (
//                   <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
//                     <div className="flex items-start space-x-3">
//                       <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
//                       <div>
//                         <h4 className="text-sm font-semibold text-green-800">Success</h4>
//                         <p className="text-sm text-green-700 mt-1">{success}</p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <div className="max-w-4xl mx-auto">
//                   {/* Back Button */}
//                   <button
//                     onClick={() => {
//                       resetForm();
//                       setView('list');
//                     }}
//                     className="flex items-center gap-2 text-slate-600 hover:text-yellow-600 transition-colors mb-6 group"
//                   >
//                     <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
//                     <span className="font-medium">Back to List</span>
//                   </button>

//                   {view === 'view' ? (
//                     /* VIEW DETAILS - Simplified */
//                     <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
//                       {/* Header Section */}
//                       <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-8 py-6">
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center gap-5">
//                             <div className="w-16 h-16 bg-yellow-500 rounded-xl flex items-center justify-center">
//                               <Layers className="w-7 h-7 text-white" />
//                             </div>
//                           </div>

//                           <div className="flex items-center gap-3">
//                             <StatusPill status={selectedDepartment?.status} />
//                             <button
//                               onClick={() => handleEdit(selectedDepartment)}
//                               className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-medium transition-all hover:"
//                             >
//                               <Edit2 className="w-4 h-4" />
//                               Edit
//                             </button>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Content */}
//                       <div className="p-8">
//                         <div className="grid lg:grid-cols-2 gap-8">
//                           {/* LEFT COLUMN – Basic Info */}
//                           <div className="space-y-4">
//                             <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
//                               <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
//                               Basic Information
//                             </h3>

//                             {/* Organization */}
//                             <div className="flex items-center gap-4 p-4 bg-slate-50 border rounded-xl">
//                               <Building2 className="w-4 h-4 text-yellow-600" />
//                               <div>
//                                 <p className="text-xs text-slate-500 uppercase">Organization</p>
//                                 <p className="font-medium">{getOrganizationName(selectedDepartment)}</p>
//                               </div>
//                             </div>

//                             {/* Status */}
//                             <div className="flex items-center gap-4 p-4 bg-slate-50 border rounded-xl">
//                               <CheckCircle className="w-4 h-4 text-yellow-600" />
//                               <div>
//                                 <p className="text-xs text-slate-500 uppercase">Status</p>
//                                 <p className="font-medium">{selectedDepartment?.status}</p>
//                               </div>
//                             </div>
//                           </div>

//                           {/* RIGHT COLUMN – Additional Details */}
//                           <div className="space-y-4">
//                             <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
//                               <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
//                               Additional Details
//                             </h3>



//                             {/* Created At */}
//                             <div className="flex items-center gap-4 p-4 bg-slate-50 border rounded-xl">
//                               <Calendar className="w-4 h-4 text-yellow-600" />
//                               <div>
//                                 <p className="text-xs text-slate-500 uppercase">Created At</p>
//                                 <p className="font-medium">
//                                   {new Date(selectedDepartment?.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
//                                 </p>
//                               </div>
//                             </div>

//                             {/* Updated At */}
//                             <div className="flex items-center gap-4 p-4 bg-slate-50 border rounded-xl">
//                               <Calendar className="w-4 h-4 text-yellow-600" />
//                               <div>
//                                 <p className="text-xs text-slate-500 uppercase">Updated At</p>
//                                 <p className="font-medium">
//                                   {new Date(selectedDepartment?.updatedAt).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
//                                 </p>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     /* CREATE / EDIT FORM - Simplified */
//                     <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
//                       {/* Header */}
//                       <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-8 py-6">
//                         <div className="flex items-center gap-4">
//                           <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
//                             <Layers className="w-6 h-6 text-white" />
//                           </div>
//                           <div>
//                             <h2 className="text-2xl font-bold text-slate-900">
//                               {view === 'create' ? "Create New Department" : "Edit Department"}
//                             </h2>
//                             <p className="text-slate-600 mt-1">
//                               {view === "create"
//                                 ? "Add a new department under an organization"
//                                 : "Update department details"}
//                             </p>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="p-8 space-y-8">
//                         {/* Basic Information */}
//                         <div className="space-y-6">
//                           <h3 className="text-lg font-semibold flex items-center gap-2">
//                             <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
//                             Basic Information
//                           </h3>

//                           {/* Organization Dropdown */}
//                           <div className="space-y-2">
//                             <label className="text-sm font-semibold">Organization *</label>
//                             <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-xl px-4 py-3.5">
//                               <Building2 className="w-5 h-5 text-slate-500" />
//                               <select
//                                 name="organizationName"
//                                 value={formData.organizationName}
//                                 onChange={handleInputChange}
//                                 className="w-full bg-transparent outline-none"
//                               >
//                                 <option value="">-- Select Organization --</option>
//                                 {organizations.map((org) => (
//                                   <option key={org._id} value={org.name}>
//                                     {org.name}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                             {organizations.length === 0 && (
//                               <p className="text-xs text-red-500">No organizations available. Please create an organization first.</p>
//                             )}
//                           </div>


//                           <div className="grid md:grid-cols-2 gap-6">
//                             <div className="space-y-2">
//                               <label className="text-sm font-semibold">Department Name *</label>
//                               <input
//                                 name="departmentName"
//                                 value={formData.departmentName}
//                                 onChange={handleInputChange}
//                                 className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-colors"
//                                 placeholder="Enter department name"
//                               />
//                             </div>

//                             <div className="space-y-2">
//                               <label className="text-sm font-semibold">Status</label>
//                               <select
//                                 name="status"
//                                 value={formData.status}
//                                 onChange={handleInputChange}
//                                 className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-colors"
//                               >
//                                 <option value="Active">Active</option>
//                                 <option value="Inactive">Inactive</option>
//                               </select>
//                             </div>
//                           </div>

//                         </div>

//                         {/* Actions */}
//                         <div className="flex justify-end gap-4 pt-8 border-t border-slate-200">
//                           <button
//                             onClick={() => {
//                               resetForm();
//                               setView('list');
//                             }}
//                             className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors font-medium"
//                           >
//                             Cancel
//                           </button>

//                           <button
//                             onClick={view === "create" ? handleCreate : handleUpdate}
//                             disabled={isSubmitting || !formData.organizationName || !formData.departmentName.trim()}
//                             className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 font-medium"
//                           >
//                             <Save className="w-4 h-4" />
//                             {isSubmitting ? 'Saving...' : view === "create" ? "Create Department" : "Save Changes"}
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Eye, Search, Filter,
  Building2, Users, MapPin, Phone, Mail, Calendar,
  X, Save, ArrowLeft, ExternalLink, ChevronDown, Check,
  RefreshCw, FilterX, AlertCircle, CheckCircle, TrendingUp,
  ChevronLeft, ChevronRight, MoreHorizontal, FolderOpen, Layers
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = '/api/v1/admin/crm/departments';
const ORGANIZATIONS_API = '/api/v1/super-admin/organizations';

const initialFormData = {
  organizationId: '',
  departmentName: '',
  status: 'Active',
  permissions: [],
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]); // Dynamic permissions
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('list');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 9,
  });

  // Fetch organizations for dropdown
  const fetchOrganizations = async () => {
    try {
      const orgsRes = await fetch(`${ORGANIZATIONS_API}?page=1&limit=100`);
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        const orgsList = orgsData.organizations || orgsData.data || [];
        setOrganizations(orgsList);
      } else {
        console.error('Failed to fetch organizations:', orgsRes.status);
        setError('Failed to load organizations');
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations');
    }
  };

  async function fetchDepartments(options = {}) {
    const {
      page = pagination.page || 1,
      limit = pagination.limit || 9,
      search = searchTerm,
      status = statusFilter,
    } = options;

    try {
      setLoading(!departments.length);
      setRefreshing(departments.length > 0);
      setError('');

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (search) params.set('search', search);
      if (status !== 'all') params.set('status', status);

      const res = await fetch(`${API_URL}?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to fetch departments: ${res.status}`);
      }

      const data = await res.json();

      const departmentsList = data.data || data.departments || [];
      setDepartments(departmentsList);

      setPagination(data.pagination || {
        page,
        total: data.total || departmentsList.length,
        pages: Math.ceil((data.total || departmentsList.length) / limit),
        limit
      });

    } catch (err) {
      console.error('Fetch departments error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/v1/admin/crm/permissions?limit=-1');
      if (res.ok) {
        const data = await res.json();
        setAvailablePermissions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  useEffect(() => {
    fetchDepartments({ page: 1 });
    fetchOrganizations();
    fetchPermissions();
  }, []);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchDepartments({ page: pagination.page });
  }, [pagination.page, pagination.limit, searchTerm, statusFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => {
      const currentPermissions = prev.permissions || [];
      if (currentPermissions.includes(permission)) {
        return {
          ...prev,
          permissions: currentPermissions.filter(p => p !== permission)
        };
      } else {
        return {
          ...prev,
          permissions: [...currentPermissions, permission]
        };
      }
    });
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedDepartment(null);
    setError('');
    setSuccess('');
  };

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      if (!formData.organizationId || !formData.departmentName.trim()) {
        setError('Organization and Department Name are required');
        return;
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create department');

      setSuccess('Department created successfully');
      await fetchDepartments({ page: 1 });
      resetForm();
      setView('list');

    } catch (err) {
      console.error('Create department error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDepartment?._id) return;

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      const res = await fetch(`${API_URL}/${selectedDepartment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update department');

      setSuccess('Department updated successfully');
      await fetchDepartments({ page: pagination.page });
      resetForm();
      setView('list');

    } catch (err) {
      console.error('Update department error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete department');

      const nextPage = departments.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;

      await fetchDepartments({ page: nextPage });

    } catch (err) {
      console.error('Delete department error:', err);
      setError(err.message);
    }
  };

  const handleView = async (dept) => {
    try {
      const res = await fetch(`${API_URL}/${dept._id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch department details');
      }

      const fullDept = await res.json();
      setSelectedDepartment(fullDept);
      setView('view');
    } catch (err) {
      console.error('View department error:', err);
      setError(err.message);
    }
  };

  const handleEdit = async (dept) => {
    try {
      const res = await fetch(`${API_URL}/${dept._id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch department details');
      }

      const fullDept = await res.json();

      setSelectedDepartment(fullDept);
      setFormData({
        organizationId: fullDept.organizationId || '',
        departmentName: fullDept.departmentName || '',
        status: fullDept.status || 'Active',
        permissions: fullDept.permissions || [],
      });

      setView('edit');
    } catch (err) {
      console.error('Edit department error:', err);
      setError(err.message);
    }
  };

  // Helper function to get organization name
  const getOrganizationName = (dept) => {
    return dept?.organizationName || 'Unknown Organization';
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    await fetchDepartments({ page: newPage });
  };

  const handleLimitChange = (value) => {
    setPagination(prev => ({ ...prev, limit: Number(value), page: 1 }));
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all';

  const StatusPill = ({ status }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${status === 'Active'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-red-50 text-red-700 border-red-200'
      }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
      {status}
    </span>
  );

  const Pagination = () => {
    const { pages, page, total, limit } = pagination;
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);
    if (pages <= 1) return null;
    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];
      for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
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
    const pageNumbers = getPageNumbers();
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border border-slate-200">
        <div className="text-sm text-slate-600">
          Showing <span className="font-semibold">{startIndex}-{endIndex}</span> of{' '}
          <span className="font-semibold">{total}</span> departments
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-slate-600">Show:</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={18}>18</option>
              <option value={24}>24</option>
            </select>
          </div>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum, index) => (
              <div key={index}>
                {pageNum === "..." ? (
                  <span className="flex items-center justify-center h-9 w-9 text-sm text-slate-500">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                ) : (
                  <button
                    onClick={() => handlePageChange(pageNum)}
                    className={`h-9 w-9 flex items-center justify-center text-sm font-medium border transition-colors rounded-md ${page === pageNum
                      ? "bg-yellow-500 border-yellow-500 text-white hover:bg-yellow-600"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {pageNum}
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pages}
            className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="w-11 h-11 rounded-xl" />
                <div>
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Analytics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-xl" />
                </div>
              </div>
            ))}
          </div>

          {/* Controls Skeleton */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex justify-between mb-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6"><Skeleton className="h-10 w-full" /></div>
              <div className="col-span-4"><Skeleton className="h-10 w-full" /></div>
              <div className="col-span-2"><Skeleton className="h-10 w-full" /></div>
            </div>
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
              </div>
            ))}
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
              <div className="w-11 h-11 bg-indigo-500 rounded-xl flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
                <p className="text-slate-600 text-sm mt-0.5">Manage departments, teams, and access</p>
              </div>
            </div>

            {view === 'list' && (
              <button
                onClick={() => {
                  resetForm();
                  setView('create');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Department
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Analytics Overview */}
        {view === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Departments</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{pagination.total}</p>
                  <p className="text-xs text-slate-500 mt-1">All departments</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                  <Layers className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {departments.filter(dept => dept.status === 'Active').length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Operational departments</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Organizations</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {new Set(departments.map(dept => dept.organizationId)).size}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Active organizations</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-blue-100">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls Panel */}
        <div className="bg-white rounded-xl border border-slate-200">
          {view === 'list' && (
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Departments ({pagination.total})
                  </h2>
                  {hasActiveFilters && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full border border-indigo-200">
                      Filtered Results
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => fetchDepartments({ page: pagination.page })}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 disabled:opacity-50 transition-colors font-medium"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Search Departments</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by department name"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="lg:col-span-2 flex items-end">
                  {hasActiveFilters && (
                    <button
                      onClick={async () => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        await fetchDepartments({ page: 1 });
                      }}
                      className="w-full px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-medium"
                      title="Clear all filters"
                    >
                      <FilterX className="w-4 h-4 mr-2" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {view === 'list' ? (
              <>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-800">Error</h4>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-green-800">Success</h4>
                        <p className="text-sm text-green-700 mt-1">{success}</p>
                      </div>
                    </div>
                  </div>
                )}

                {departments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Layers className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {hasActiveFilters ? 'No departments match your criteria' : 'No departments found'}
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                      {hasActiveFilters
                        ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                        : 'Get started by adding your first department to manage your teams.'
                      }
                    </p>
                    {hasActiveFilters ? (
                      <button
                        onClick={async () => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          await fetchDepartments({ page: 1 });
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-200 text-sm font-medium transition-colors"
                      >
                        <FilterX className="w-4 h-4" />
                        Clear All Filters
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          resetForm();
                          setView('create');
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Department
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {departments.map((dept) => (
                        <div key={dept._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover: transition-">
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                                  <Layers className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-slate-900 text-sm">
                                    {dept.departmentName}
                                  </h3>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {getOrganizationName(dept)}
                                  </p>
                                </div>
                              </div>
                              <StatusPill status={dept.status} />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleView(dept)}
                                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(dept)}
                                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(dept._id)}
                                  className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Pagination />
                  </>
                )}
              </>
            ) : (
              /* CREATE / EDIT / VIEW */
              <>
                {(error) && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-800">Error</h4>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-green-800">Success</h4>
                        <p className="text-sm text-green-700 mt-1">{success}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-w-4xl mx-auto">
                  {/* Back Button */}
                  <button
                    onClick={() => {
                      resetForm();
                      setView('list');
                    }}
                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors mb-6 group"
                  >
                    <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                    <span className="font-medium">Back to List</span>
                  </button>

                  {view === 'view' ? (
                    /* VIEW DETAILS */
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      {/* Header Section */}
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-8 py-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-indigo-500 rounded-xl flex items-center justify-center">
                              <Layers className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-slate-900">{selectedDepartment?.departmentName}</h2>
                              <p className="text-slate-600 mt-1">{getOrganizationName(selectedDepartment)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <StatusPill status={selectedDepartment?.status} />
                            <button
                              onClick={() => handleEdit(selectedDepartment)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-medium transition-all hover:"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-8">
                        <div className="grid lg:grid-cols-2 gap-8">
                          {/* LEFT COLUMN – Basic Info */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                              Basic Information
                            </h3>

                            {/* Organization */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 border rounded-xl">
                              <Building2 className="w-4 h-4 text-indigo-600" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase">Organization</p>
                                <p className="font-medium">{getOrganizationName(selectedDepartment)}</p>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 border rounded-xl">
                              <CheckCircle className="w-4 h-4 text-indigo-600" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase">Status</p>
                                <p className="font-medium">{selectedDepartment?.status}</p>
                              </div>
                            </div>
                          </div>

                          {/* RIGHT COLUMN – Additional Details */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                              Additional Details
                            </h3>

                            {/* Created At */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 border rounded-xl">
                              <Calendar className="w-4 h-4 text-indigo-600" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase">Created At</p>
                                <p className="font-medium">
                                  {new Date(selectedDepartment?.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                </p>
                              </div>
                            </div>

                            {/* Updated At */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 border rounded-xl">
                              <Calendar className="w-4 h-4 text-indigo-600" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase">Updated At</p>
                                <p className="font-medium">
                                  {new Date(selectedDepartment?.updatedAt).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                </p>
                              </div>
                            </div>


                          </div>
                        </div>

                        {/* Permissions */}
                        <div className="mt-8 pt-8 border-t border-slate-200">
                          <div className="col-span-full">
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                              Permissions
                            </h3>
                            <div className="bg-slate-50 border rounded-xl p-6">
                              {selectedDepartment?.permissions?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {selectedDepartment.permissions.map((permSlug, index) => {
                                    // Find permission name from available permissions
                                    const permObj = availablePermissions.find(p => p.slug === permSlug);
                                    const permLabel = permObj ? permObj.name : permSlug.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                                    return (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700"
                                      >
                                        {permLabel}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-slate-500 text-sm italic">No permissions assigned</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* CREATE / EDIT FORM */
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                            <Layers className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                              {view === 'create' ? "Create New Department" : "Edit Department"}
                            </h2>
                            <p className="text-slate-600 mt-1">
                              {view === "create"
                                ? "Add a new department under an organization"
                                : "Update department details"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 space-y-8">
                        {/* Basic Information */}
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            Basic Information
                          </h3>

                          {/* Organization Dropdown */}
                          <div className="space-y-2">
                            <label className="text-sm font-semibold">Organization *</label>
                            <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-xl px-4 py-3.5">
                              <Building2 className="w-5 h-5 text-slate-500" />
                              <select
                                name="organizationId"
                                value={formData.organizationId}
                                onChange={handleInputChange}
                                className="w-full bg-transparent outline-none"
                              >
                                <option value="">-- Select Organization --</option>
                                {organizations.map((org) => (
                                  <option key={org._id} value={org._id}>
                                    {org.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {organizations.length === 0 && (
                              <p className="text-xs text-red-500">No organizations available. Please create an organization first.</p>
                            )}
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-sm font-semibold">Department Name *</label>
                              <input
                                name="departmentName"
                                value={formData.departmentName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                                placeholder="Enter department name"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold">Status</label>
                              <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Permissions Selection */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            Permissions
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {availablePermissions.map((permission) => (
                              <label
                                key={permission.slug}
                                className={`
                                  relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all
                                  ${formData.permissions?.includes(permission.slug)
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                  }
                                `}
                              >
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mr-3"
                                  checked={formData.permissions?.includes(permission.slug) || false}
                                  onChange={() => handlePermissionChange(permission.slug)}
                                />
                                <div className="flex flex-col">
                                  <span className={`text-sm font-medium ${formData.permissions?.includes(permission.slug) ? 'text-slate-900' : 'text-slate-600'
                                    }`}>
                                    {permission.name}
                                  </span>
                                  {permission.description && (
                                    <span className="text-xs text-slate-400">{permission.description}</span>
                                  )}
                                </div>
                              </label>
                            ))}
                            {availablePermissions.length === 0 && (
                              <div className="col-span-full py-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                                <p className="text-slate-500">No permissions found.</p>
                                <a href="/crm/permissions" className="text-indigo-600 font-medium hover:underline mt-1 inline-block">Manage Permissions</a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-8 border-t border-slate-200">
                          <button
                            onClick={() => {
                              resetForm();
                              setView('list');
                            }}
                            className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors font-medium"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={view === "create" ? handleCreate : handleUpdate}
                            disabled={isSubmitting || !formData.organizationId || !formData.departmentName.trim()}
                            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 font-medium"
                          >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Saving...' : view === "create" ? "Create Department" : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}