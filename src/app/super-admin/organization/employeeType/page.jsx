// "use client"

// import { useState, useEffect } from "react";
// import {
//   Plus,
//   Edit2,
//   Trash2,
//   Search,
//   RefreshCw,
//   FilterX,
//   AlertCircle,
//   Users,
//   Tag,
//   Layers,
//   ChevronLeft,
//   ChevronRight,
//   MoreHorizontal,
//   Building,
//   ChevronDown,
//   ChevronUp,
// } from "lucide-react";
// import CreateEmployeeTypeModal from "@/components/modals/CreateEmployeeTypeModal";
// import CreateCategoryModal from "@/components/modals/CreateCategoryModal";
// import CreateSubCategoryModal from "@/components/modals/CreateSubCategoryModal";
// import DocumentAdd from "@/components/modals/DocumentsAdd";

// export default function EmployeeTypesPage() {
//   const [employeeTypes, setEmployeeTypes] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [subCategories, setSubCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedOrganization, setSelectedOrganization] = useState("");
//   const [selectedDepartment, setSelectedDepartment] = useState("");
//   const [organizations, setOrganizations] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState("");
//   const [viewMode, setViewMode] = useState("hierarchy"); // "hierarchy" or "list"

//   // Modal states
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showDocumentsAddModal, setShowDocumentsAddModal] = useState(false);
//   const [showCategoryModal, setShowCategoryModal] = useState(false);
//   const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);

//   // Expanded states for hierarchy view
//   const [expandedTypes, setExpandedTypes] = useState({});
//   const [expandedCategories, setExpandedCategories] = useState({});

//   // Fetch organizations
//   async function fetchOrganizations() {
//     try {
//       const params = new URLSearchParams();
//       params.set("page", "1");
//       params.set("limit", "100");
//       params.set("status", "Active");
//       const res = await fetch(`/api/crm/organizations?${params.toString()}`);
//       const data = await res.json();
//       if (res.ok) {
//         setOrganizations(data.organizations || []);
//       }
//     } catch (err) {
//       console.error("Organizations fetch error:", err);
//     }
//   }

//   // Fetch departments based on selected organization
//   async function fetchDepartments(organizationId) {
//     if (!organizationId) {
//       setDepartments([]);
//       return;
//     }
//     try {
//       const response = await fetch(`/api/crm/departments?organizationId=${organizationId}&limit=100`);
//       const data = await response.json();
//       if (response.ok) {
//         setDepartments(data.data || []);
//       }
//     } catch (err) {
//       console.error("Departments fetch error:", err);
//     }
//   }

//   // Fetch employee types
//   async function fetchEmployeeTypes(organizationId, departmentId) {
//     try {
//       const params = new URLSearchParams();
//       if (organizationId) params.set("organizationId", organizationId);
//       if (departmentId) params.set("departmentId", departmentId);
//       params.set("limit", "1000");

//       const res = await fetch(`/api/crm/employeetype?${params.toString()}`);
//       const data = await res.json();

//       if (res.ok) {
//         setEmployeeTypes(data.data || []);
//       }
//     } catch (err) {
//       console.error("Employee types fetch error:", err);
//     }
//   }

//   // Fetch categories
//   async function fetchCategories(organizationId, departmentId) {
//     try {
//       const params = new URLSearchParams();
//       if (organizationId) params.set("organizationId", organizationId);
//       if (departmentId) params.set("departmentId", departmentId);
//       params.set("limit", "1000");

//       const res = await fetch(`/api/crm/employeecategory?${params.toString()}`);
//       const data = await res.json();

//       if (res.ok) {
//         setCategories(data.data || []);
//       }
//     } catch (err) {
//       console.error("Categories fetch error:", err);
//     }
//   }

//   // Fetch sub-categories
//   async function fetchSubCategories(organizationId, departmentId) {
//     try {
//       const params = new URLSearchParams();
//       if (organizationId) params.set("organizationId", organizationId);
//       if (departmentId) params.set("departmentId", departmentId);
//       params.set("limit", "1000");

//       const res = await fetch(`/api/crm/employeesubcategory?${params.toString()}`);
//       const data = await res.json();

//       if (res.ok) {
//         setSubCategories(data.data || []);
//       }
//     } catch (err) {
//       console.error("Sub-categories fetch error:", err);
//     }
//   }

//   // Fetch all data
//   async function fetchAllData() {
//     try {
//       setLoading(true);
//       setError("");

//       const selectedOrg = organizations.find(org => org.name === selectedOrganization);
//       const orgId = selectedOrg?._id || "";

//       const selectedDept = departments.find(dept => dept.departmentName === selectedDepartment);
//       const deptId = selectedDept?._id || "";

//       await Promise.all([
//         fetchEmployeeTypes(orgId, deptId),
//         fetchCategories(orgId, deptId),
//         fetchSubCategories(orgId, deptId)
//       ]);
//     } catch (err) {
//       setError("Failed to load data");
//       console.error(err);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }

//   // Initial load
//   useEffect(() => {
//     fetchOrganizations();
//   }, []);

//   // Load departments when organization changes
//   useEffect(() => {
//     if (selectedOrganization) {
//       const selectedOrg = organizations.find(org => org.name === selectedOrganization);
//       if (selectedOrg) {
//         fetchDepartments(selectedOrg._id);
//       }
//     } else {
//       setDepartments([]);
//       setSelectedDepartment("");
//     }
//   }, [selectedOrganization, organizations]);

//   // Fetch data when filters change
//   useEffect(() => {
//     if (organizations.length > 0) {
//       fetchAllData();
//     }
//   }, [selectedOrganization, selectedDepartment, organizations]);

//   // Handle modal success
//   const handleModalSuccess = () => {
//     fetchAllData();
//   };

//   // Clear filters
//   const clearFilters = () => {
//     setSearchTerm("");
//     setSelectedOrganization("");
//     setSelectedDepartment("");
//   };

//   // Refresh data
//   const refreshData = () => {
//     setRefreshing(true);
//     fetchAllData();
//   };

//   // Toggle expand/collapse
//   const toggleTypeExpand = (typeId) => {
//     setExpandedTypes(prev => ({
//       ...prev,
//       [typeId]: !prev[typeId]
//     }));
//   };

//   const toggleCategoryExpand = (categoryId) => {
//     setExpandedCategories(prev => ({
//       ...prev,
//       [categoryId]: !prev[categoryId]
//     }));
//   };

//   // Build hierarchy structure
//   const buildHierarchy = () => {
//     const hierarchy = [];

//     // Group by employee type
//     employeeTypes.forEach(type => {
//       const typeCategories = categories.filter(cat => 
//         cat.employeeTypeId?._id === type._id
//       );

//       const categoriesWithSubs = typeCategories.map(category => {
//         const categorySubs = subCategories.filter(sub => 
//           sub.employeeCategoryId._id === category._id
//         );
//         return {
//           ...category,
//           subCategories: categorySubs
//         };
//       });

//       hierarchy.push({
//         ...type,
//         categories: categoriesWithSubs
//       });
//     });

//     return hierarchy;
//   };

//   const hierarchy = buildHierarchy();

//   // Filter hierarchy based on search
//   const filteredHierarchy = hierarchy.filter(type => {
//     if (!searchTerm) return true;

//     const searchLower = searchTerm.toLowerCase();

//     // Search in type name
//     if (type.employeeType.toLowerCase().includes(searchLower)) return true;

//     // Search in categories
//     const hasMatchingCategory = type.categories.some(cat => 
//       cat.employeeCategory.toLowerCase().includes(searchLower)
//     );
//     if (hasMatchingCategory) return true;

//     // Search in sub-categories
//     const hasMatchingSubCategory = type.categories.some(cat =>
//       cat.subCategories.some(sub =>
//         sub.employeeSubCategory.toLowerCase().includes(searchLower)
//       )
//     );

//     return hasMatchingSubCategory;
//   });

//   // Statistics
//   const stats = {
//     totalTypes: employeeTypes.length,
//     totalCategories: categories.length,
//     totalSubCategories: subCategories.length,
//     inHouseTypes: employeeTypes.filter(t => t.employeeType === "In House").length,
//     thirdPartyTypes: employeeTypes.filter(t => t.employeeType === "Third Party").length,
//   };

//   // Loading state
//   if (loading && !refreshing) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
//           <p className="mt-4 text-slate-600">Loading employee hierarchy...</p>
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
//                 <Users className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-900">
//                   Employee Hierarchy
//                 </h1>
//                 <p className="text-slate-600 text-sm mt-0.5">
//                   Manage employee types, categories & sub-categories
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setShowDocumentsAddModal(true)}
//                 className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add Supported Documents
//               </button>
//               <button
//                 onClick={() => setShowCreateModal(true)}
//                 className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add Employee Type
//               </button>
//               <button
//                 onClick={() => setShowCategoryModal(true)}
//                 className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
//               >
//                 <Tag className="w-4 h-4" />
//                 Add Category
//               </button>
//               <button
//                 onClick={() => setShowSubCategoryModal(true)}
//                 className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
//               >
//                 <Layers className="w-4 h-4" />
//                 Add Sub-Category
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-6 py-6">
//         {/* Statistics Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
//           <div className="bg-white rounded-xl border border-slate-200 p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-slate-600">Employee Types</p>
//                 <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTypes}</p>
//               </div>
//               <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
//                 <Users className="w-5 h-5 text-yellow-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl border border-slate-200 p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-slate-600">Categories</p>
//                 <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCategories}</p>
//               </div>
//               <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
//                 <Tag className="w-5 h-5 text-green-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl border border-slate-200 p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-slate-600">Sub-Categories</p>
//                 <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalSubCategories}</p>
//               </div>
//               <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                 <Layers className="w-5 h-5 text-blue-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl border border-slate-200 p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-slate-600">In-House</p>
//                 <p className="text-2xl font-bold text-slate-900 mt-1">{stats.inHouseTypes}</p>
//               </div>
//               <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
//                 <Building className="w-5 h-5 text-green-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl border border-slate-200 p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-slate-600">Third Party</p>
//                 <p className="text-2xl font-bold text-slate-900 mt-1">{stats.thirdPartyTypes}</p>
//               </div>
//               <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                 <Building className="w-5 h-5 text-blue-600" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Filters and Search */}
//         <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
//           <div className="flex flex-col gap-4">
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               {/* Search Input */}
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                 <input
//                   type="text"
//                   placeholder="Search types, categories..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
//                 />
//               </div>

//               {/* Organization Filter */}
//               <div>
//                 <select
//                   value={selectedOrganization}
//                   onChange={(e) => {
//                     setSelectedOrganization(e.target.value);
//                     setSelectedDepartment("");
//                   }}
//                   className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 appearance-none bg-white"
//                 >
//                   <option value="">All Organizations</option>
//                   {organizations.map((org) => (
//                     <option key={org._id} value={org.name}>
//                       {org.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Department Filter */}
//               <div>
//                 <select
//                   value={selectedDepartment}
//                   onChange={(e) => setSelectedDepartment(e.target.value)}
//                   disabled={!selectedOrganization}
//                   className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 appearance-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
//                 >
//                   <option value="">All Departments</option>
//                   {departments.map((dept) => (
//                     <option key={dept._id} value={dept.departmentName}>
//                       {dept.departmentName}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Actions */}
//               <div className="flex items-center gap-2">
//                 {(searchTerm || selectedOrganization || selectedDepartment) && (
//                   <button
//                     onClick={clearFilters}
//                     className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
//                   >
//                     <FilterX className="w-4 h-4" />
//                     Clear
//                   </button>
//                 )}

//                 <button
//                   onClick={refreshData}
//                   disabled={refreshing}
//                   className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
//                 >
//                   <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
//                   Refresh
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
//             <div className="flex items-start space-x-3">
//               <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
//               <div>
//                 <h4 className="text-sm font-semibold text-red-800">Error</h4>
//                 <p className="text-sm text-red-700 mt-1">{error}</p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Hierarchy Display */}
//         {filteredHierarchy.length === 0 ? (
//           <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
//             <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
//             <h3 className="text-lg font-semibold text-slate-900 mb-2">
//               No employee hierarchy found
//             </h3>
//             <p className="text-slate-600 mb-6">
//               {searchTerm || selectedOrganization || selectedDepartment
//                 ? "Try adjusting your search or filters"
//                 : "Get started by creating your first employee type"}
//             </p>
//             <div className="flex gap-3 justify-center">
//               <button
//                 onClick={() => setShowCreateModal(true)}
//                 className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
//               >
//                 <Plus className="w-4 h-4" />
//                 Create Employee Type
//               </button>
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {filteredHierarchy.map((type) => (
//               <div
//                 key={type._id}
//                 className="bg-white rounded-xl border border-slate-200 overflow-hidden"
//               >
//                 {/* Employee Type Header */}
//                 <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-slate-200">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-4">
//                       <button
//                         onClick={() => toggleTypeExpand(type._id)}
//                         className="p-2 hover:bg-white/50 rounded-lg transition-colors"
//                       >
//                         {expandedTypes[type._id] ? (
//                           <ChevronUp className="w-5 h-5 text-slate-600" />
//                         ) : (
//                           <ChevronDown className="w-5 h-5 text-slate-600" />
//                         )}
//                       </button>

//                       <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
//                           <Users className="w-5 h-5 text-white" />
//                         </div>
//                         <div>
//                           <h3 className="font-semibold text-slate-900 text-lg">
//                             {type.employeeType}
//                           </h3>
//                           <div className="flex items-center gap-3 mt-1">
//                             <span className="text-sm text-slate-600">
//                               {type.organizationId?.name || "N/A"}
//                             </span>
//                             <span className="text-slate-300">•</span>
//                             <span className="text-sm text-slate-600">
//                               {type.departmentId?.departmentName || "N/A"}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-3">
//                       <span className="text-sm font-medium text-slate-600">
//                         {type.categories.length} {type.categories.length === 1 ? 'category' : 'categories'}
//                       </span>
//                       <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
//                         <Edit2 className="w-4 h-4 text-slate-600" />
//                       </button>
//                       <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
//                         <Trash2 className="w-4 h-4 text-red-600" />
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Categories */}
//                 {expandedTypes[type._id] && type.categories.length > 0 && (
//                   <div className="p-4">
//                     <div className="space-y-3">
//                       {type.categories.map((category) => (
//                         <div
//                           key={category._id}
//                           className="border border-slate-200 rounded-lg overflow-hidden"
//                         >
//                           {/* Category Header */}
//                           <div className="p-3 bg-green-50 border-b border-slate-200">
//                             <div className="flex items-center justify-between">
//                               <div className="flex items-center gap-3">
//                                 <button
//                                   onClick={() => toggleCategoryExpand(category._id)}
//                                   className="p-1 hover:bg-white/50 rounded transition-colors"
//                                 >
//                                   {expandedCategories[category._id] ? (
//                                     <ChevronUp className="w-4 h-4 text-slate-600" />
//                                   ) : (
//                                     <ChevronDown className="w-4 h-4 text-slate-600" />
//                                   )}
//                                 </button>

//                                 <div className="flex items-center gap-2">
//                                   <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
//                                     <Tag className="w-4 h-4 text-white" />
//                                   </div>
//                                   <div>
//                                     <h4 className="font-semibold text-slate-900">
//                                       {category.employeeCategory}
//                                     </h4>
//                                   </div>
//                                 </div>
//                               </div>

//                               <div className="flex items-center gap-2">
//                                 <span className="text-sm text-slate-600">
//                                   {category.subCategories.length} sub-{category.subCategories.length === 1 ? 'category' : 'categories'}
//                                 </span>
//                                 <button className="p-1.5 hover:bg-white rounded transition-colors">
//                                   <Edit2 className="w-3.5 h-3.5 text-slate-600" />
//                                 </button>
//                                 <button className="p-1.5 hover:bg-red-50 rounded transition-colors">
//                                   <Trash2 className="w-3.5 h-3.5 text-red-600" />
//                                 </button>
//                               </div>
//                             </div>
//                           </div>

//                           {/* Sub-Categories */}
//                           {expandedCategories[category._id] && category.subCategories.length > 0 && (
//                             <div className="p-3 bg-white">
//                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
//                                 {category.subCategories.map((sub) => (
//                                   <div
//                                     key={sub._id}
//                                     className="flex items-center justify-between p-2 bg-slate-50 border border-blue-200 rounded-lg"
//                                   >
//                                     <div className="flex items-center gap-2">
//                                       <div className="w-6 h-6 bg-slate-500 rounded flex items-center justify-center">
//                                         <Layers className="w-3 h-3 text-white" />
//                                       </div>
//                                       <span className="text-sm font-medium text-slate-900">
//                                         {sub.employeeSubCategory}
//                                       </span>
//                                     </div>
//                                     <div className="flex items-center gap-1">
//                                       <button className="p-1 hover:bg-white rounded transition-colors">
//                                         <Edit2 className="w-3 h-3 text-slate-600" />
//                                       </button>
//                                       <button className="p-1 hover:bg-red-50 rounded transition-colors">
//                                         <Trash2 className="w-3 h-3 text-red-600" />
//                                       </button>
//                                     </div>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Modals */}
//       <DocumentAdd
//         isOpen={showDocumentsAddModal}
//         onClose={() => setShowDocumentsAddModal(false)}
//         onSuccess={handleModalSuccess}
//       />
//       <CreateEmployeeTypeModal
//         isOpen={showCreateModal}
//         onClose={() => setShowCreateModal(false)}
//         onSuccess={handleModalSuccess}
//         organizations={organizations}
//       />

//       <CreateCategoryModal
//         isOpen={showCategoryModal}
//         onClose={() => setShowCategoryModal(false)}
//         onSuccess={handleModalSuccess}
//         organizations={organizations}
//       />

//       <CreateSubCategoryModal
//         isOpen={showSubCategoryModal}
//         onClose={() => setShowSubCategoryModal(false)}
//         onSuccess={handleModalSuccess}
//         organizations={organizations}
//       />

//       <EditCategoryModal
//         isOpen={showEditCategoryModal}
//         onClose={() => {
//           setShowEditCategoryModal(false);
//           setSelectedCategory(null);
//         }}
//         onSuccess={handleModalSuccess}
//         organizations={organizations}
//         category={selectedCategory}
//       />
//     </div>
//   );
// }

"use client"

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  FilterX,
  AlertCircle,
  Users,
  Tag,
  Layers,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Building,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CreateEmployeeTypeModal from "@/components/modals/CreateEmployeeTypeModal";
import CreateCategoryModal from "@/components/modals/CreateCategoryModal";
import CreateSubCategoryModal from "@/components/modals/CreateSubCategoryModal";
import EditCategoryModal from "@/components/modals/EditCategoryModal";
import EditEmployeeTypeModal from "@/components/modals/EditEmployeeTypeModal"; // New import
import DocumentAdd from "@/components/modals/DocumentsAdd";

export default function EmployeeTypesPage() {
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("hierarchy");
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDocumentsAddModal, setShowDocumentsAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showEditTypeModal, setShowEditTypeModal] = useState(false); // New state for type edit
  const [selectedType, setSelectedType] = useState(null); // New state for type edit
  // Expanded states for hierarchy view
  const [expandedTypes, setExpandedTypes] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  // Fetch organizations
  async function fetchOrganizations() {
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "100");
      params.set("status", "Active");
      const res = await fetch(`/api/v1/super-admin/organizations?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error("Organizations fetch error:", err);
    }
  }

  // Fetch departments based on selected organization
  async function fetchDepartments(organizationId) {
    if (!organizationId) {
      setDepartments([]);
      return;
    }
    try {
      const response = await fetch(`/api/v1/admin/crm/departments?organizationId=${organizationId}&limit=100`);
      const data = await response.json();
      if (response.ok) {
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error("Departments fetch error:", err);
    }
  }

  // Fetch employee types
  async function fetchEmployeeTypes(organizationId, departmentId) {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.set("organizationId", organizationId);
      if (departmentId) params.set("departmentId", departmentId);
      params.set("limit", "1000");
      const res = await fetch(`/api/v1/admin/crm/employeetype?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEmployeeTypes(data.data || []);
      }
    } catch (err) {
      console.error("Employee types fetch error:", err);
    }
  }

  // Fetch categories
  async function fetchCategories(organizationId, departmentId) {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.set("organizationId", organizationId);
      if (departmentId) params.set("departmentId", departmentId);
      params.set("limit", "1000");
      const res = await fetch(`/api/v1/admin/crm/employeecategory?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error("Categories fetch error:", err);
    }
  }

  // Fetch sub-categories
  async function fetchSubCategories(organizationId, departmentId) {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.set("organizationId", organizationId);
      if (departmentId) params.set("departmentId", departmentId);
      params.set("limit", "1000");
      const res = await fetch(`/api/v1/admin/crm/employeesubcategory?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setSubCategories(data.data || []);
      }
    } catch (err) {
      console.error("Sub-categories fetch error:", err);
    }
  }

  // Fetch all data
  async function fetchAllData() {
    try {
      setLoading(true);
      setError("");
      const selectedOrg = organizations.find(org => org.name === selectedOrganization);
      const orgId = selectedOrg?._id || "";
      const selectedDept = departments.find(dept => dept.departmentName === selectedDepartment);
      const deptId = selectedDept?._id || "";
      await Promise.all([
        fetchEmployeeTypes(orgId, deptId),
        fetchCategories(orgId, deptId),
        fetchSubCategories(orgId, deptId)
      ]);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Initial load
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Load departments when organization changes
  useEffect(() => {
    if (organizations.length === 1 && !selectedOrganization) {
      setSelectedOrganization(organizations[0].name);
    }
    
    if (selectedOrganization) {
      const selectedOrg = organizations.find(org => org.name === selectedOrganization);
      if (selectedOrg) {
        fetchDepartments(selectedOrg._id);
      }
    } else {
      setDepartments([]);
      setSelectedDepartment("");
    }
  }, [selectedOrganization, organizations]);

  // Fetch data when filters change
  useEffect(() => {
    if (organizations.length > 0) {
      fetchAllData();
    }
  }, [selectedOrganization, selectedDepartment, organizations]);

  // Handle modal success
  const handleModalSuccess = () => {
    fetchAllData();
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedOrganization("");
    setSelectedDepartment("");
  };

  // Refresh data
  const refreshData = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Toggle expand/collapse
  const toggleTypeExpand = (typeId) => {
    setExpandedTypes(prev => ({
      ...prev,
      [typeId]: !prev[typeId]
    }));
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowEditCategoryModal(true);
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/crm/employeecategory/${categoryId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete category");
      }
      fetchAllData(); // Refresh data after deletion
    } catch (err) {
      setError(err.message || "Failed to delete category");
    }
  };

  // Handle delete employee type
  const handleDeleteType = async (typeId) => {
    if (!confirm("Are you sure you want to delete this employee type? This will also delete all associated categories and sub-categories.")) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/crm/employeetype/${typeId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete employee type");
      }
      fetchAllData();
    } catch (err) {
      setError(err.message || "Failed to delete employee type");
    }
  };

  // Build hierarchy structure
  const buildHierarchy = () => {
    const hierarchy = [];
    employeeTypes.forEach(type => {
      const typeCategories = categories.filter(cat =>
        cat.employeeTypeId?._id === type._id
      );
      const categoriesWithSubs = typeCategories.map(category => {
        const categorySubs = subCategories.filter(sub =>
          sub.employeeCategoryId._id === category._id
        );
        return {
          ...category,
          subCategories: categorySubs
        };
      });
      hierarchy.push({
        ...type,
        categories: categoriesWithSubs
      });
    });
    return hierarchy;
  };

  const hierarchy = buildHierarchy();

  // Filter hierarchy based on search
  const filteredHierarchy = hierarchy.filter(type => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    if (type.employeeType.toLowerCase().includes(searchLower)) return true;
    const hasMatchingCategory = type.categories.some(cat =>
      cat.employeeCategory.toLowerCase().includes(searchLower)
    );
    if (hasMatchingCategory) return true;
    const hasMatchingSubCategory = type.categories.some(cat =>
      cat.subCategories.some(sub =>
        sub.employeeSubCategory.toLowerCase().includes(searchLower)
      )
    );
    return hasMatchingSubCategory;
  });

  // Statistics
  const stats = {
    totalTypes: employeeTypes.length,
    totalCategories: categories.length,
    totalSubCategories: subCategories.length,
    inHouseTypes: employeeTypes.filter(t => t.employeeType === "In House").length,
    thirdPartyTypes: employeeTypes.filter(t => t.employeeType === "Third Party").length,
  };

  // Loading state
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
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between">
                  <div>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="w-10 h-10 rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Filters Skeleton */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Hierarchy Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between">
                  <div className="flex gap-4 items-center">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="flex gap-3 items-center">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div>
                        <Skeleton className="h-6 w-32 mb-1" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
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
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Employee Hierarchy
                </h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  Manage employee types, categories & sub-categories
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDocumentsAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Supported Documents
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Employee Type
              </button>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                <Tag className="w-4 h-4" />
                Add Category
              </button>
              <button
                onClick={() => setShowSubCategoryModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Layers className="w-4 h-4" />
                Add Sub-Category
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Employee Types</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTypes}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Categories</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCategories}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Sub-Categories</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalSubCategories}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">In-House</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.inHouseTypes}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Third Party</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.thirdPartyTypes}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search types, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {organizations.length > 1 && (
                <div>
                  <select
                    value={selectedOrganization}
                    onChange={(e) => {
                      setSelectedOrganization(e.target.value);
                      setSelectedDepartment("");
                    }}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                  >
                    <option value="">All Organizations</option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org.name}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  disabled={!selectedOrganization}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.departmentName}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                {(searchTerm || selectedOrganization || selectedDepartment) && (
                  <button
                    onClick={clearFilters}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <FilterX className="w-4 h-4" />
                    Clear
                  </button>
                )}
                <button
                  onClick={refreshData}
                  disabled={refreshing}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Error Message */}
        {error && (
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
        {/* Hierarchy Display */}
        {filteredHierarchy.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No employee hierarchy found
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || selectedOrganization || selectedDepartment
                ? "Try adjusting your search or filters"
                : "Get started by creating your first employee type"}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Employee Type
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHierarchy.map((type) => (
              <div
                key={type._id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Employee Type Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleTypeExpand(type._id)}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        {expandedTypes[type._id] ? (
                          <ChevronUp className="w-5 h-5 text-slate-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-600" />
                        )}
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">
                            {type.employeeType}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-slate-600">
                              {type.organizationId?.name || "N/A"}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-sm text-slate-600">
                              {type.departmentId?.departmentName || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-600">
                        {type.categories.length} {type.categories.length === 1 ? 'category' : 'categories'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedType(type);
                          setShowEditTypeModal(true);
                        }}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteType(type._id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Categories */}
                {expandedTypes[type._id] && type.categories.length > 0 && (
                  <div className="p-4">
                    <div className="space-y-3">
                      {type.categories.map((category) => (
                        <div
                          key={category._id}
                          className="border border-slate-200 rounded-lg overflow-hidden"
                        >
                          {/* Category Header */}
                          <div className="p-3 bg-green-50 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleCategoryExpand(category._id)}
                                  className="p-1 hover:bg-white/50 rounded transition-colors"
                                >
                                  {expandedCategories[category._id] ? (
                                    <ChevronUp className="w-4 h-4 text-slate-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-600" />
                                  )}
                                </button>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                    <Tag className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900">
                                      {category.employeeCategory}
                                    </h4>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                  {category.subCategories.length} sub-{category.subCategories.length === 1 ? 'category' : 'categories'}
                                </span>
                                <button
                                  onClick={() => handleEditCategory(category)}
                                  className="p-1.5 hover:bg-white rounded transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category._id)}
                                  className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Sub-Categories */}
                          {expandedCategories[category._id] && category.subCategories.length > 0 && (
                            <div className="p-3 bg-white">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {category.subCategories.map((sub) => (
                                  <div
                                    key={sub._id}
                                    className="flex items-center justify-between p-2 bg-slate-50 border border-blue-200 rounded-lg"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-slate-500 rounded flex items-center justify-center">
                                        <Layers className="w-3 h-3 text-white" />
                                      </div>
                                      <span className="text-sm font-medium text-slate-900">
                                        {sub.employeeSubCategory}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button className="p-1 hover:bg-white rounded transition-colors">
                                        <Edit2 className="w-3 h-3 text-slate-600" />
                                      </button>
                                      <button className="p-1 hover:bg-red-50 rounded transition-colors">
                                        <Trash2 className="w-3 h-3 text-red-600" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modals */}
      <DocumentAdd
        isOpen={showDocumentsAddModal}
        onClose={() => setShowDocumentsAddModal(false)}
        onSuccess={handleModalSuccess}
      />
      <CreateEmployeeTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
        organizations={organizations}
      />
      <CreateCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={handleModalSuccess}
        organizations={organizations}
      />
      <CreateSubCategoryModal
        isOpen={showSubCategoryModal}
        onClose={() => setShowSubCategoryModal(false)}
        onSuccess={handleModalSuccess}
        organizations={organizations}
      />
      <EditCategoryModal
        isOpen={showEditCategoryModal}
        onClose={() => {
          setShowEditCategoryModal(false);
          setSelectedCategory(null);
        }}
        onSuccess={handleModalSuccess}
        organizations={organizations}
        category={selectedCategory}
      />

      <EditEmployeeTypeModal
        isOpen={showEditTypeModal}
        onClose={() => {
          setShowEditTypeModal(false);
          setSelectedType(null);
        }}
        onSuccess={handleModalSuccess}
        organizations={organizations}
        employeeTypeData={selectedType}
      />
    </div>
  );
}