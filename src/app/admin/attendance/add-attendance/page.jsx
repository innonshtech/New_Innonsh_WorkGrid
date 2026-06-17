"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar, User, Clock, ArrowLeft, Save, Loader2, CheckCircle, Edit2 } from "lucide-react";
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
    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-800 transition-colors w-fit">
      <select
        value={hour12}
        onChange={(e) => handlePartChange("hour", e.target.value)}
        className="bg-transparent outline-none cursor-pointer text-sm w-7 py-0.5 text-center font-black appearance-none focus:text-indigo-650"
      >
        {hourOptions.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-slate-400 font-black leading-none">:</span>
      <select
        value={minute}
        onChange={(e) => handlePartChange("minute", e.target.value)}
        className="bg-transparent outline-none cursor-pointer text-sm w-7 py-0.5 text-center font-black appearance-none focus:text-indigo-650"
      >
        {minuteOptions.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={ampm}
        onChange={(e) => handlePartChange("ampm", e.target.value)}
        className="bg-indigo-50 text-indigo-700 font-extrabold outline-none cursor-pointer text-[10px] px-2 py-0.5 rounded-lg border border-indigo-150 uppercase hover:bg-indigo-100 transition-colors"
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceData, setAttendanceData] = useState({});
  const [markedEmployees, setMarkedEmployees] = useState({});
  const [editingEmployees, setEditingEmployees] = useState({});


  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/employees");
      const data = await res.json();
      if (data.success) {
        const empList = data.data || data.employees || [];
        setEmployees(empList);
        // Initialize attendance data for all employees
        const initialData = {};
        empList.forEach(emp => {
          initialData[emp._id] = {
            status: "Present",
            checkIn: "09:00",
            checkOut: "18:00"
          };
        });
        setAttendanceData(initialData);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExistingAttendance = useCallback(async (date) => {
    try {
      const res = await fetch(`/api/v1/admin/attendance?date=${date}`);
      const data = await res.json();
      
      const marked = {};
      if (data.attendance && data.attendance.length > 0) {
        data.attendance.forEach(record => {
          const empId = record.employee?._id || record.employee;
          if (empId) {
            marked[empId] = {
              _id: record._id,
              status: record.status === "Half Day" ? "Half-day" : record.status,
              checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }) : null,
              checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }) : null,
            };
          }
        });
      }
      setMarkedEmployees(marked);
      setEditingEmployees({});
    } catch (err) {
      console.error("Error fetching existing attendance:", err);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (selectedDate) {
      fetchExistingAttendance(selectedDate);
    }
  }, [selectedDate, fetchExistingAttendance]);

  const handleStatusChange = (empId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [empId]: { ...prev[empId], status }
    }));
  };

  const handleTimeChange = (empId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: value }
    }));
  };

  const handleEdit = (empId) => {
    const existing = markedEmployees[empId];
    let existingStatus = existing.status || "Present";
    if (existingStatus === "Half Day") {
      existingStatus = "Half-day";
    }
    setAttendanceData(prev => ({
      ...prev,
      [empId]: {
        status: existingStatus,
        checkIn: existing.checkIn || "09:00",
        checkOut: existing.checkOut || "18:00"
      }
    }));
    setEditingEmployees(prev => ({ ...prev, [empId]: true }));
  };

  const handleCancelEdit = (empId) => {
    setEditingEmployees(prev => {
      const newState = { ...prev };
      delete newState[empId];
      return newState;
    });
  };

  const handleSave = async (empId) => {
    try {
      setSaving(prev => ({ ...prev, [empId]: true }));
      const data = attendanceData[empId];
      const isEditing = editingEmployees[empId] && markedEmployees[empId];
      
      let statusToSave = data.status;
      if (statusToSave === "Half Day") {
        statusToSave = "Half-day";
      }
      
      const res = await fetch("/api/v1/admin/attendance", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { _id: markedEmployees[empId]._id } : {}),
          employee: empId,
          date: selectedDate,
          status: statusToSave,
          checkIn: data.checkIn ? `${selectedDate}T${data.checkIn}:00` : null,
          checkOut: data.checkOut ? `${selectedDate}T${data.checkOut}:00` : null,
        })
      });

      const result = await res.json();
      if (result.success || res.ok) {
        toast.success(isEditing ? "Attendance updated" : "Attendance saved");
        // Refresh to reflect the saved state
        await fetchExistingAttendance(selectedDate);
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch (err) {
        toast.error("Error saving attendance");
    } finally {
      setSaving(prev => ({ ...prev, [empId]: false }));
    }
  };

  const isEmployeeMarked = (empId) => {
    return !!markedEmployees[empId] && !editingEmployees[empId];
  };

  const isEmployeeEditing = (empId) => {
    return !!editingEmployees[empId];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const markedCount = Object.keys(markedEmployees).length;
  const unmarkedCount = employees.length - markedCount;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Toaster />
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200">
           <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Add Attendance</h1>
                <p className="text-slate-500 text-sm">Mark daily attendance for employees</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              {markedCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {markedCount} marked
                  </span>
                  {unmarkedCount > 0 && (
                    <span className="text-sm text-slate-500">
                      · {unmarkedCount} pending
                    </span>
                  )}
                </div>
              )}
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
           </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Employee</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Check In</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Check Out</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => {
                const marked = isEmployeeMarked(emp._id);
                const editing = isEmployeeEditing(emp._id);
                const existingRecord = markedEmployees[emp._id];

                return (
                  <tr key={emp._id} className={`transition-colors ${marked ? 'bg-green-50/40' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${marked ? 'bg-green-100' : 'bg-indigo-100'}`}>
                          {marked ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <User className="w-5 h-5 text-indigo-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {emp.personalDetails?.firstName} {emp.personalDetails?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{emp.employeeId}</p>
                        </div>
                      </div>
                    </td>

                    {marked ? (
                      <>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            existingRecord.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' :
                            existingRecord.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' :
                            existingRecord.status === 'Leave' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            existingRecord.status === 'Half-day' || existingRecord.status === 'Half Day' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {existingRecord.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatTime12h(existingRecord.checkIn)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatTime12h(existingRecord.checkOut)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleEdit(emp._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <select 
                            value={attendanceData[emp._id]?.status}
                            onChange={(e) => handleStatusChange(emp._id, e.target.value)}
                            className="px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Leave">Leave</option>
                            <option value="Half-day">Half-day</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <TimePicker12h 
                            value={attendanceData[emp._id]?.checkIn}
                            onChange={(val) => handleTimeChange(emp._id, "checkIn", val)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <TimePicker12h 
                            value={attendanceData[emp._id]?.checkOut}
                            onChange={(val) => handleTimeChange(emp._id, "checkOut", val)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleSave(emp._id)}
                              disabled={saving[emp._id]}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
                            >
                              {saving[emp._id] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              {editing ? 'Update' : 'Save'}
                            </button>
                            {editing && (
                              <button
                                onClick={() => handleCancelEdit(emp._id)}
                                className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {employees.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-500">No employees found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
