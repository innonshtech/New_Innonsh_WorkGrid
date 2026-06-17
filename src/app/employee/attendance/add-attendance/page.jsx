// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Calendar, User, Clock, ArrowLeft } from "lucide-react";
// import { useSession } from "@/context/SessionContext";

// export default function AddAttendance() {
//   const router = useRouter();
//   const { user } = useSession();
//   const [employees, setEmployees] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(
//     new Date().toISOString().split("T")[0]
//   );
//   const [attendanceData, setAttendanceData] = useState({});
//   const [savedCheckIns, setSavedCheckIns] = useState({}); // Track saved check-ins

//   // Fetch employees
//   const fetchEmployees = async () => {
//     try {
//       const res = await fetch("/api/payroll/employees");
//       const data = await res.json();
//       let filteredEmployees = data.employees || [];

//       console.log("User role:", user?.role);
//       console.log("User department:", user?.department);
//       console.log("All employees:", filteredEmployees);

//       if (user?.role === "Supervisor" && user?.department) {
//         filteredEmployees = filteredEmployees.filter(
//           (emp) => emp.jobDetails.department === user.department
//         );
//         console.log("Filtered employees for supervisor:", filteredEmployees);
//       }

//       setEmployees(filteredEmployees);
//     } catch (err) {
//       console.error("Error fetching employees:", err);
//       setEmployees([]);
//     }
//   };

//   // Fetch attendance records for the selected date
//   const fetchAttendance = async () => {
//     try {
//       const res = await fetch(`/api/payroll/attendance?date=${selectedDate}`);
//       const data = await res.json();
//       const attendanceRecords = data.attendance || [];
//       console.log("Attendacne Record = ", selectedDate);
//       const updatedAttendanceData = employees.reduce((acc, emp) => {
//         console.log(emp);
//         const record = attendanceRecords.find(
//           (att) =>
//             att.employee._id === emp._id &&
//             new Date(att.date).toDateString() ===
//               new Date(selectedDate).toDateString()
//         );
//         console.log("Record = ", record);
//         return {
//           ...acc,
//           [emp.employeeId]: {
//             status: record ? record.status : "Present",
//             checkIn: record?.checkIn
//               ? new Date(record.checkIn).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', //                   hour: "2-digit",
//                   minute: "2-digit",
//                   hour12: false,
//                 })
//               : "",
//             checkOut: record?.checkOut
//               ? new Date(record.checkOut).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', //                   hour: "2-digit",
//                   minute: "2-digit",
//                   hour12: false,
//                 })
//               : "",
//           },
//         };
//       }, {});
//       console.log(attendanceRecords)
//       const updatedSavedCheckIns = attendanceRecords.reduce((acc, record) => {
//         const emp = employees.find((e) => e._id === record.employee._id);
//         if (emp && record.checkIn) {
//           return { ...acc, [emp.employeeId]: true };
//         }
//         return acc;
//       }, {});

//       setAttendanceData(updatedAttendanceData);
//       setSavedCheckIns(updatedSavedCheckIns);
//        console.log(savedCheckIns);
//     } catch (err) {
//       console.error("Error fetching attendance:", err);
//     }
//   };

//   useEffect(() => {
//     if (user) {
//       fetchEmployees();
//     }
//   }, [user]);

//   // Initialize attendanceData and fetch attendance when employees or date change
//   useEffect(() => {
//     if (employees.length > 0) {
//       fetchAttendance();
//     }
//   }, [employees, selectedDate]);

//   // Group employees by department
//   const groupedEmployees = employees.reduce((acc, emp) => {
//     if (!acc[emp.jobDetails.department]) acc[emp.jobDetails.department] = [];
//     acc[emp.jobDetails.department].push(emp);
//     return acc;
//   }, {});

//   const handleAddAttendance = async (employeeId, e) => {
//     e.preventDefault();
//     try {
//       const { status, checkIn } = attendanceData[employeeId];
//       const id = employees.find((emp) => emp.employeeId === employeeId)?._id;
//       const date = new Date(selectedDate).toISOString().split("T")[0];
//       const checkInTime =
//         status === "Present" && checkIn
//           ? new Date(`${date}T${checkIn}:00+05:30`).toISOString()
//           : null;

//       // Prevent saving if check-in already exists
//       if (savedCheckIns[employeeId]) {
//         alert("Check-in already saved for this employee on this date.");
//         return;
//       }

//       const response = await fetch("/api/payroll/attendance", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           employee: id,
//           date: selectedDate,
//           status,
//           checkIn: checkInTime,
//           checkOut: null,
//         }),
//       });

//       if (response.ok) {
//         setAttendanceData((prev) => ({
//           ...prev,
//           [employeeId]: { ...prev[employeeId], checkIn: "" },
//         }));
//         console.log(
//           "Attendance Data From Handel Attendance :- ",
//           attendanceData
//         );

//         setSavedCheckIns((prev) => ({ ...prev, [employeeId]: true }));
//         alert("Check-in saved successfully");
//         fetchAttendance(); // Refresh attendance data
//       } else {
//         const errorData = await response.json();
//         alert(errorData.error || "Failed to add attendance");
//       }
//     } catch (error) {
//       console.error("Error adding attendance:", error);
//       alert("Error adding attendance");
//     }
//   };

//   const handleCheckOut = async (employeeId) => {
//     try {
//       const { checkOut } = attendanceData[employeeId];
//       if (!checkOut) {
//         alert("Please enter a check-out time");
//         return;
//       }

//       const id = employees.find((emp) => emp.employeeId === employeeId)?._id;
//       const date = new Date(selectedDate).toISOString().split("T")[0];
//       const checkOutTime = new Date(
//         `${date}T${checkOut}:00+05:30`
//       ).toISOString();

//       const response = await fetch("/api/payroll/attendance", {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           employee: id,
//           date: selectedDate,
//           checkOut: checkOutTime,
//         }),
//       });

//       if (response.ok) {
//         setAttendanceData((prev) => ({
//           ...prev,
//           [employeeId]: { ...prev[employeeId], checkOut: "" },
//         }));
//         alert("Check-out updated successfully");
//         fetchAttendance(); // Refresh attendance data
//       } else {
//         const errorData = await response.json();
//         alert(errorData.error || "Failed to update check-out time");
//       }
//     } catch (error) {
//       console.error("Error updating check-out time:", error);
//       alert("Error updating check-out time");
//     }
//   };

//   console.log(savedCheckIns);

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         {/* Header */}
//         <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//             <div className="flex items-center gap-4">
//               <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-amber-500 rounded-2xl flex items-center justify-center">
//                 <Calendar className="w-8 h-8 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-900 mb-1">
//                   Add Attendance
//                 </h1>
//                 <p className="text-slate-600">
//                   {user?.role === "Supervisor"
//                     ? `Mark attendance for employees in your department`
//                     : "Mark attendance for employees by department"}
//                 </p>
//               </div>
//             </div>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => router.push("/payroll/attendance")}
//                 className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
//               >
//                 <ArrowLeft className="w-4 h-4" />
//                 Back to Dashboard
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Date Picker */}
//         <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
//           <label className="block text-sm font-medium text-slate-600 mb-2">
//             Select Date
//           </label>
//           <input
//             type="date"
//             value={selectedDate}
//             onChange={(e) => setSelectedDate(e.target.value)}
//             className="w-full max-w-xs px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           />
//         </div>

//         {/* Employee List by Department */}
//         {employees.length === 0 ? (
//           <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
//             <h3 className="text-lg font-semibold text-slate-900 mb-2">
//               No Employees Available
//             </h3>
//             <p className="text-slate-600">
//               {user?.role === "Supervisor"
//                 ? "No employees found in your assigned department."
//                 : "No employees found."}
//             </p>
//           </div>
//         ) : (
//           Object.keys(groupedEmployees).map((department) => (
//             <div
//               key={department}
//               className="bg-white rounded-xl border border-slate-200 mb-8"
//             >
//               <div className="p-6 border-b border-slate-200">
//                 <h2 className="text-xl font-semibold text-slate-900">
//                   {department}
//                 </h2>
//                 <p className="text-slate-600 text-sm mt-1">
//                   Manage attendance for {department}
//                 </p>
//               </div>
//               <div className="p-6">
//                 <div className="space-y-4">
//                   {groupedEmployees[department].map((emp) => (
//                     <form
//                       key={emp.employeeId}
//                       onSubmit={(e) => handleAddAttendance(emp.employeeId, e)}
//                       className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
//                     >
//                       <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
//                         <User className="w-6 h-6 text-white" />
//                       </div>
//                       <div className="flex-1">
//                         <h4 className="font-semibold text-slate-900">
//                           {emp.personalDetails.firstName}{" "}
//                           {emp.personalDetails.lastName} (ID: {emp.employeeId})
//                         </h4>
//                         <div className="flex items-center gap-4 mt-2">
//                           <div>
//                             <label className="block text-sm font-medium text-slate-600 mb-1">
//                               Status
//                             </label>
//                             <select
//                               value={
//                                 attendanceData[emp.employeeId]?.status ||
//                                 "Present"
//                               }
//                               onChange={(e) =>
//                                 setAttendanceData((prev) => ({
//                                   ...prev,
//                                   [emp.employeeId]: {
//                                     ...prev[emp.employeeId],
//                                     status: e.target.value,
//                                   },
//                                 }))
//                               }
//                               className="w-32 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                             >
//                               <option value="Present">Present</option>
//                               <option value="Absent">Absent</option>
//                               <option value="Leave">Leave</option>
//                               <option value="Weekend">Weekend</option>
//                             </select>
//                           </div>
//                           <div>
//                             <label className="block text-sm font-medium text-slate-600 mb-1">
//                               Check-In
//                             </label>
//                             {savedCheckIns[emp.employeeId] ? (
//                               <p className="text-sm text-slate-600">
//                                 {attendanceData[emp.employeeId]?.checkIn ||
//                                   "Saved"}
//                               </p>
//                             ) : (
//                               <input
//                                 type="time"
//                                 value={
//                                   attendanceData[emp.employeeId]?.checkIn || ""
//                                 }
//                                 onChange={(e) =>
//                                   setAttendanceData((prev) => ({
//                                     ...prev,
//                                     [emp.employeeId]: {
//                                       ...prev[emp.employeeId],
//                                       checkIn: e.target.value,
//                                     },
//                                   }))
//                                 }
//                                 className="w-32 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                                 disabled={
//                                   attendanceData[emp.employeeId]?.status !==
//                                   "Present"
//                                 }
//                               />
//                             )}
//                           </div>
//                           <div>
//                             <label className="block text-sm font-medium text-slate-600 mb-1">
//                               Check-Out
//                             </label>
//                             <input
//                               type="time"
//                               value={
//                                 attendanceData[emp.employeeId]?.checkOut || ""
//                               }
//                               onChange={(e) =>
//                                 setAttendanceData((prev) => ({
//                                   ...prev,
//                                   [emp.employeeId]: {
//                                     ...prev[emp.employeeId],
//                                     checkOut: e.target.value,
//                                   },
//                                 }))
//                               }
//                               className="w-32 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                               disabled={
//                                 attendanceData[emp.employeeId]?.status !==
//                                 "Present"
//                               }
//                             />
//                           </div>
//                         </div>
//                       </div>
//                       <div className="flex gap-2">
//                         {!savedCheckIns[emp.employeeId] && (
//                           <button
//                             type="submit"
//                             className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
//                             disabled={
//                               attendanceData[emp.employeeId]?.status !==
//                               "Present"
//                             }
//                           >
//                             Save Check-In
//                           </button>
//                         )}
//                         {savedCheckIns[emp.employeeId] && (
//                           <button
//                             type="button"
//                             onClick={() => handleCheckOut(emp.employeeId)}
//                             className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
//                             disabled={
//                               attendanceData[emp.employeeId]?.status !==
//                               "Present"
//                             }
//                           >
//                             Save Check-Out
//                           </button>
//                         )}
//                       </div>
//                     </form>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }


// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Calendar, User, ArrowLeft } from "lucide-react";
// import { useSession } from "@/context/SessionContext";

// export default function AddAttendance() {
//   const router = useRouter();
//   const { user } = useSession();
//   const [employees, setEmployees] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(
//     new Date().toISOString().split("T")[0]
//   );
//   const [attendanceData, setAttendanceData] = useState({});
//   const [savedCheckIns, setSavedCheckIns] = useState({}); // { employeeId: true }

//   // Fetch employees
//   const fetchEmployees = async () => {
//     try {
//       const res = await fetch("/api/payroll/employees");
//       const data = await res.json();
//       let filteredEmployees = data.employees || [];

//       if (user?.role === "Supervisor" && user?.department) {
//         filteredEmployees = filteredEmployees.filter(
//           (emp) => emp.jobDetails.department === user.department
//         );
//       }

//       setEmployees(filteredEmployees);
//     } catch (err) {
//       console.error("Error fetching employees:", err);
//       setEmployees([]);
//     }
//   };

//   // Fetch attendance for selected date
//   const fetchAttendance = async () => {
//     if (employees.length === 0) return;

//     try {
//       const res = await fetch(`/api/payroll/attendance?date=${selectedDate}`);
//       const data = await res.json();
//       const attendanceRecords = data.attendance || [];

//       const updatedAttendanceData = {};
//       const updatedSavedCheckIns = {};

//       employees.forEach((emp) => {
//         const record = attendanceRecords.find(
//           (att) =>
//             att.employee._id === emp._id &&
//             new Date(att.date).toDateString() === new Date(selectedDate).toDateString()
//         );

//         const checkIn = record?.checkIn
//           ? new Date(record.checkIn).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', //               hour: "2-digit",
//               minute: "2-digit",
//               hour12: false,
//             })
//           : "";

//         const checkOut = record?.checkOut
//           ? new Date(record.checkOut).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', //               hour: "2-digit",
//               minute: "2-digit",
//               hour12: false,
//             })
//           : "";

//         updatedAttendanceData[emp.employeeId] = {
//           status: record ? record.status : "Present",
//           checkIn,
//           checkOut,
//         };

//         if (record?.checkIn) {
//           updatedSavedCheckIns[emp.employeeId] = true;
//         }
//       });

//       setAttendanceData(updatedAttendanceData);
//       setSavedCheckIns(updatedSavedCheckIns);
//     } catch (err) {
//       console.error("Error fetching attendance:", err);
//     }
//   };

//   useEffect(() => {
//     if (user) fetchEmployees();
//   }, [user]);

//   useEffect(() => {
//     if (employees.length > 0) fetchAttendance();
//   }, [employees, selectedDate]);

//   // Group employees by department
//   const groupedEmployees = employees.reduce((acc, emp) => {
//     const dept = emp.jobDetails.department;
//     if (!acc[dept]) acc[dept] = [];
//     acc[dept].push(emp);
//     return acc;
//   }, {});

//   // Save Check-In
//   const handleAddAttendance = async (employeeId, e) => {
//     e.preventDefault();

//     if (savedCheckIns[employeeId]) {
//       alert("Check-in already saved for this employee.");
//       return;
//     }

//     const { status, checkIn } = attendanceData[employeeId] || {};
//     if (status !== "Present" || !checkIn) {
//       alert("Please select 'Present' and enter a check-in time.");
//       return;
//     }

//     const emp = employees.find((e) => e.employeeId === employeeId);
//     const checkInTime = new Date(`${selectedDate}T${checkIn}:00+05:30`).toISOString();

//     try {
//       const response = await fetch("/api/payroll/attendance", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           employee: emp._id,
//           date: selectedDate,
//           status,
//           checkIn: checkInTime,
//           checkOut: null,
//         }),
//       });

//       if (response.ok) {
//         setSavedCheckIns((prev) => ({ ...prev, [employeeId]: true }));
//         alert("Check-in saved successfully");
//         fetchAttendance();
//       } else {
//         const error = await response.json();
//         alert(error.error || "Failed to save check-in");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       alert("Error saving check-in");
//     }
//   };

//   // Save Check-Out
//   const handleCheckOut = async (employeeId) => {
//     const { checkOut } = attendanceData[employeeId] || {};
//     if (!checkOut) {
//       alert("Please enter a check-out time");
//       return;
//     }

//     const emp = employees.find((e) => e.employeeId === employeeId);
//     const checkOutTime = new Date(`${selectedDate}T${checkOut}:00+05:30`).toISOString();

//     try {
//       const response = await fetch("/api/payroll/attendance", {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           employee: emp._id,
//           date: selectedDate,
//           checkOut: checkOutTime,
//         }),
//       });

//       if (response.ok) {
//         alert("Check-out saved successfully");
//         fetchAttendance();
//       } else {
//         const error = await response.json();
//         alert(error.error || "Failed to save check-out");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       alert("Error saving check-out");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         {/* Header */}
//         <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//             <div className="flex items-center gap-4">
//               <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-amber-500 rounded-2xl flex items-center justify-center">
//                 <Calendar className="w-8 h-8 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-900 mb-1">
//                   Add Attendance
//                 </h1>
//                 <p className="text-slate-600">
//                   {user?.role === "Supervisor"
//                     ? "Mark attendance for your department"
//                     : "Mark attendance by department"}
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => router.push("/payroll/attendance")}
//               className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
//             >
//               <ArrowLeft className="w-4 h-4" />
//               Back to Dashboard
//             </button>
//           </div>
//         </div>

//         {/* Date Picker */}
//         <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
//           <label className="block text-sm font-medium text-slate-600 mb-2">
//             Select Date
//           </label>
//           <input
//             type="date"
//             value={selectedDate}
//             onChange={(e) => setSelectedDate(e.target.value)}
//             className="w-full max-w-xs px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           />
//         </div>

//         {/* Employee List */}
//         {employees.length === 0 ? (
//           <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
//             <h3 className="text-lg font-semibold text-slate-900 mb-2">
//               No Employees Found
//             </h3>
//             <p className="text-slate-600">
//               {user?.role === "Supervisor"
//                 ? "No employees in your department."
//                 : "No employees available."}
//             </p>
//           </div>
//         ) : (
//           Object.keys(groupedEmployees).map((department) => (
//             <div
//               key={department}
//               className="bg-white rounded-xl border border-slate-200 mb-8"
//             >
//               <div className="p-6 border-b border-slate-200">
//                 <h2 className="text-xl font-semibold text-slate-900">
//                   {department.toUpperCase()} Departments
//                 </h2>
//               </div>

//               <div className="p-6 space-y-4">
//                 {groupedEmployees[department].map((emp) => {
//                   const empId = emp.employeeId;
//                   const att = attendanceData[empId] || {
//                     status: "Present",
//                     checkIn: "",
//                     checkOut: "",
//                   };
//                   const isSaved = !!savedCheckIns[empId];
//                   const isPresent = att.status === "Present";

//                   return (
//                     <div
//                       key={empId}
//                       className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
//                     >
//                       {/* Avatar */}
//                       <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
//                         <User className="w-6 h-6 text-white" />
//                       </div>

//                       {/* Info */}
//                       <div className="flex-1">
//                         <h4 className="font-semibold text-slate-900">
//                           {emp.personalDetails.firstName}{" "}
//                           {emp.personalDetails.lastName} (ID: {empId})
//                         </h4>

//                         <div className="flex items-center gap-6 mt-3">
//                           {/* Status */}
//                           <div>
//                             <label className="text-xs font-medium text-slate-600">
//                               Status
//                             </label>
//                             <select
//                               value={att.status}
//                               onChange={(e) =>
//                                 setAttendanceData((prev) => ({
//                                   ...prev,
//                                   [empId]: { ...prev[empId], status: e.target.value },
//                                 }))
//                               }
//                               className="mt-1 block w-32 px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                             >
//                               <option value="Present">Present</option>
//                               <option value="Absent">Absent</option>
//                               <option value="Leave">Leave</option>
//                               <option value="Weekend">Weekend</option>
//                             </select>
//                           </div>

//                           {/* Check-In */}
//                           <div>
//                             <label className="text-xs font-medium text-slate-600">
//                               Check-In
//                             </label>
//                             {isSaved ? (
//                               <p className="mt-1 text-sm font-medium text-green-700">
//                                 {att.checkIn}
//                               </p>
//                             ) : (
//                               <input
//                                 type="time"
//                                 value={att.checkIn}
//                                 onChange={(e) =>
//                                   setAttendanceData((prev) => ({
//                                     ...prev,
//                                     [empId]: { ...prev[empId], checkIn: e.target.value },
//                                   }))
//                                 }
//                                 className="mt-1 block w-32 px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                                 disabled={!isPresent}
//                               />
//                             )}
//                           </div>

//                           {/* Check-Out */}
//                           <div>
//                             <label className="text-xs font-medium text-slate-600">
//                               Check-Out
//                             </label>
//                             {isSaved ? (
//                               <input
//                                 type="time"
//                                 value={att.checkOut}
//                                 onChange={(e) =>
//                                   setAttendanceData((prev) => ({
//                                     ...prev,
//                                     [empId]: { ...prev[empId], checkOut: e.target.value },
//                                   }))
//                                 }
//                                 className="mt-1 block w-32 px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                                 disabled={!isPresent}
//                               />
//                             ) : (
//                               <p className="mt-1 text-sm text-slate-400">—</p>
//                             )}
//                           </div>
//                         </div>
//                       </div>

//                       {/* Action Buttons */}
//                       <div className="flex gap-2">
//                         {!isSaved && (
//                           <form
//                             onSubmit={(e) => handleAddAttendance(empId, e)}
//                             className="inline"
//                           >
//                             <button
//                               type="submit"
//                               disabled={!isPresent || !att.checkIn}
//                               className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                             >
//                               Save Check-In
//                             </button>
//                           </form>
//                         )}

//                         {isSaved && (
//                           <button
//                             onClick={() => handleCheckOut(empId)}
//                             disabled={!isPresent || !att.checkOut}
//                             className="px-4 py-2 bg-slate-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                           >
//                             Save Check-Out
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, User, ArrowLeft, CheckCircle } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import toast, { Toaster } from "react-hot-toast";

const formatTime12h = (time24) => {
  if (!time24) return "—";
  const [hourStr, minuteStr] = time24.split(":");
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12.toString().padStart(2, "0")}:${minuteStr} ${ampm}`;
};

const parse24To12hParts = (time24) => {
  if (!time24) return { hour12: "09", minute: "00", ampm: "AM" };
  const [hourStr, minuteStr] = time24.split(":");
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return {
    hour12: h12.toString().padStart(2, "0"),
    minute: (minuteStr || "00").padStart(2, "0"),
    ampm
  };
};

const convert12hPartsTo24 = (hour12, minute, ampm) => {
  let hour = parseInt(hour12, 10);
  if (ampm === "PM" && hour < 12) {
    hour += 12;
  } else if (ampm === "AM" && hour === 12) {
    hour = 0;
  }
  const hourStr = hour.toString().padStart(2, "0");
  const minuteStr = (minute || "00").padStart(2, "0");
  return `${hourStr}:${minuteStr}`;
};

const TimePicker12h = ({ value, onChange }) => {
  const { hour12, minute, ampm } = parse24To12hParts(value);

  const handlePartChange = (part, partValue) => {
    let newHour = hour12;
    let newMinute = minute;
    let newAmpm = ampm;

    if (part === "hour") newHour = partValue;
    else if (part === "minute") newMinute = partValue;
    else if (part === "ampm") newAmpm = partValue;

    const newValue = convert12hPartsTo24(newHour, newMinute, newAmpm);
    onChange(newValue);
  };

  const hourOptions = Array.from({ length: 12 }, (_, i) => 
    (i + 1).toString().padStart(2, "0")
  );

  const minuteOptions = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, "0")
  );

  return (
    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-md px-2 py-1 font-semibold text-slate-800 transition-colors w-fit mt-1">
      <select
        value={hour12}
        onChange={(e) => handlePartChange("hour", e.target.value)}
        className="bg-transparent outline-none cursor-pointer text-sm w-7 py-0.5 text-center font-bold appearance-none"
      >
        {hourOptions.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-slate-400 font-bold leading-none">:</span>
      <select
        value={minute}
        onChange={(e) => handlePartChange("minute", e.target.value)}
        className="bg-transparent outline-none cursor-pointer text-sm w-7 py-0.5 text-center font-bold appearance-none"
      >
        {minuteOptions.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={ampm}
        onChange={(e) => handlePartChange("ampm", e.target.value)}
        className="bg-indigo-50 text-indigo-700 font-bold outline-none cursor-pointer text-xs px-1.5 py-0.5 rounded border border-indigo-100 uppercase hover:bg-indigo-100 transition-colors"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

export default function AddAttendance() {
  const router = useRouter();
  const { user } = useSession();
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceData, setAttendanceData] = useState({});
  const [savedCheckIns, setSavedCheckIns] = useState({});   // { empId: true }
  const [savedCheckOuts, setSavedCheckOuts] = useState({}); // { empId: true }

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const baseUrl = user?.role === 'employee' ? '/api/v1/employee' : '/api/v1/admin';
      const res = await fetch(`${baseUrl}/payroll/employees`);
      const data = await res.json();

      if (user.role === "admin") {
        setEmployees(data.employees || []);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    }
  };

  // Fetch attendance for selected date
  const fetchAttendance = async () => {
    if (employees.length === 0) return;

    try {
      const baseUrl = user?.role === 'employee' ? '/api/v1/employee' : '/api/v1/admin';
      const res = await fetch(`${baseUrl}/payroll/attendance?date=${selectedDate}`);
      const data = await res.json();
      const attendanceRecords = data.attendance || [];

      const updatedAttendanceData = {};
      const updatedSavedCheckIns = {};
      const updatedSavedCheckOuts = {};

      employees.forEach((emp) => {
        const record = attendanceRecords.find(
          (att) =>
            att.employee._id === emp._id &&
            new Date(att.date).toDateString() === new Date(selectedDate).toDateString()
        );

        const checkIn = record?.checkIn
          ? new Date(record.checkIn).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          : "";

        const checkOut = record?.checkOut
          ? new Date(record.checkOut).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          : "";

        updatedAttendanceData[emp.employeeId] = {
          status: record ? record.status : "Present",
          checkIn,
          checkOut,
        };

        if (record?.checkIn) updatedSavedCheckIns[emp.employeeId] = true;
        if (record?.checkOut) updatedSavedCheckOuts[emp.employeeId] = true;
      });

      setAttendanceData(updatedAttendanceData);
      setSavedCheckIns(updatedSavedCheckIns);
      setSavedCheckOuts(updatedSavedCheckOuts);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  useEffect(() => {
    if (user) fetchEmployees();
  }, [user]);

  useEffect(() => {
    if (employees.length > 0) fetchAttendance();
  }, [employees, selectedDate]);

  // Group employees by department
  const groupedEmployees = employees.reduce((acc, emp) => {
    const dept = emp.jobDetails.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  // Save Check-In
  const handleAddAttendance = async (employeeId, e) => {
    e.preventDefault();

    if (savedCheckIns[employeeId]) {
      toast.success("Check-in already saved.");
      return;
    }

    const { status, checkIn } = attendanceData[employeeId] || {};
    if (!checkIn) {
      toast.error("Please enter check-in time.");
      return;
    }

    const emp = employees.find((e) => e.employeeId === employeeId);
    const checkInTime = new Date(`${selectedDate}T${checkIn}:00+05:30`).toISOString();

    try {
      const baseUrl = user?.role === 'employee' ? '/api/v1/employee' : '/api/v1/admin';
      const response = await fetch(`${baseUrl}/payroll/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee: emp._id,
          date: selectedDate,
          status,
          checkIn: checkInTime,
          checkOut: null,
        }),
      });

      if (response.ok) {
        setSavedCheckIns((prev) => ({ ...prev, [employeeId]: true }));
        toast.success("Check-in saved successfully");
        fetchAttendance();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save check-in");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error saving check-in");
    }
  };

  // Save Check-Out
  const handleCheckOut = async (employeeId) => {
    const { checkOut } = attendanceData[employeeId] || {};
    if (!checkOut) {
      toast.error("Please enter a check-out time");
      return;
    }

    const emp = employees.find((e) => e.employeeId === employeeId);
    const checkOutTime = new Date(`${selectedDate}T${checkOut}:00+05:30`).toISOString();

    try {
      const baseUrl = user?.role === 'employee' ? '/api/v1/employee' : '/api/v1/admin';
      const response = await fetch(`${baseUrl}/payroll/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee: emp._id,
          date: selectedDate,
          checkOut: checkOutTime,
        }),
      });

      if (response.ok) {
        setSavedCheckOuts((prev) => ({ ...prev, [employeeId]: true }));
        toast.success("Check-out saved successfully");
        fetchAttendance();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save check-out");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error saving check-out");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-amber-500 rounded-2xl flex items-center justify-center">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Add Attendance
                </h1>
                <p className="text-slate-600">
                  Mark attendance by department
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(user?.role === 'employee' ? "/employee/attendance" : "/admin/attendance")}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Date Picker */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full max-w-xs px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Employee List */}
        {employees.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Employees Found
            </h3>
            <p className="text-slate-600">
              No employees available.
            </p>
          </div>
        ) : (
          Object.keys(groupedEmployees).map((department) => (
            <div
              key={department}
              className="bg-white rounded-xl border border-slate-200 mb-8"
            >
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">
                  {department.toUpperCase()} Department
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {groupedEmployees[department].map((emp) => {
                  const empId = emp.employeeId;
                  const att = attendanceData[empId] || {
                    status: "Present",
                    checkIn: "",
                    checkOut: "",
                  };
                  const isCheckInSaved = !!savedCheckIns[empId];
                  const isCheckOutSaved = !!savedCheckOuts[empId];
                  const isPresent = att.status === "Present";

                  return (
                    <div
                      key={empId}
                      className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">
                          {emp.personalDetails.firstName}{" "}
                          {emp.personalDetails.lastName} (ID: {empId})
                        </h4>

                        <div className="flex items-center gap-6 mt-3">
                          {/* Status */}
                          <div>
                            <label className="text-xs font-medium text-slate-600">
                              Status
                            </label>
                            <select
                              value={att.status}
                              onChange={(e) =>
                                setAttendanceData((prev) => ({
                                  ...prev,
                                  [empId]: { ...prev[empId], status: e.target.value },
                                }))
                              }
                              className="mt-1 block w-32 px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              disabled={isCheckOutSaved}
                            >
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Leave">Leave</option>
                              <option value="Half-day">Half-day</option>
                              <option value="Weekend">Weekend</option>
                            </select>
                          </div>

                          {/* Check-In */}
                          <div>
                            <label className="text-xs font-medium text-slate-600">
                              Check-In
                            </label>
                            {isCheckInSaved ? (
                              <p className="mt-1 text-sm font-medium text-green-700">
                                {formatTime12h(att.checkIn)}
                              </p>
                            ) : (
                              <TimePicker12h
                                value={att.checkIn}
                                onChange={(val) =>
                                  setAttendanceData((prev) => ({
                                    ...prev,
                                    [empId]: { ...prev[empId], checkIn: val },
                                  }))
                                }
                              />
                            )}
                          </div>

                          {/* Check-Out */}
                          <div>
                            <label className="text-xs font-medium text-slate-600">
                              Check-Out
                            </label>
                            {isCheckOutSaved ? (
                              <p className="mt-1 text-sm font-medium text-green-700">
                                {formatTime12h(att.checkOut)}
                              </p>
                            ) : isCheckInSaved ? (
                              <TimePicker12h
                                value={att.checkOut}
                                onChange={(val) =>
                                  setAttendanceData((prev) => ({
                                    ...prev,
                                    [empId]: { ...prev[empId], checkOut: val },
                                  }))
                                }
                              />
                            ) : (
                              <p className="mt-1 text-sm text-slate-400">—</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action / Status */}
                      <div className="flex items-center">
                        {/* Save Check-In */}
                        {!isCheckInSaved && (
                          <form onSubmit={(e) => handleAddAttendance(empId, e)} className="inline">
                            <button
                              type="submit"
                              disabled={!isPresent || !att.checkIn}
                              className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Save Check-In
                            </button>
                          </form>
                        )}

                        {/* Save Check-Out */}
                        {isCheckInSaved && !isCheckOutSaved && (
                          <button
                            onClick={() => handleCheckOut(empId)}
                            disabled={!isPresent || !att.checkOut}
                            className="px-4 py-2 bg-slate-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save Check-Out
                          </button>
                        )}

                        {/* Completed Badge */}
                        {isCheckOutSaved && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}