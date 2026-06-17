"use client";

import { useState, useEffect } from "react";
import { MapPin, Clock, Fingerprint, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSession } from "@/context/SessionContext";

export default function MarkAttendance({ onAttendanceMarked }) {
    const { user } = useSession();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("loading"); // loading, checked-in, checked-out, none
    const [todayRecord, setTodayRecord] = useState(null);
    const [locationError, setLocationError] = useState(null);

    useEffect(() => {
        if (user) {
            checkTodayAttendance();
        }
    }, [user]);

    const checkTodayAttendance = async () => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const baseUrl = user.role === 'employee' ? '/api/v1/employee' : '/api/v1/admin';
            const res = await fetch(`${baseUrl}/payroll/attendance?employeeId=${user.id}&date=${today}`);
            if (!res.ok) return;
            const data = await res.json();

            const record = data.attendance?.[0];
            if (record) {
                setTodayRecord(record);
                if (record.checkIn && !record.checkOut) {
                    setStatus("checked-in");
                } else if (record.checkIn && record.checkOut) {
                    setStatus("checked-out");
                } else {
                    setStatus("none");
                }
            } else {
                setStatus("none");
            }
        } catch (error) {
            console.error("Error checking attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            coordinates: [position.coords.longitude, position.coords.latitude],
                            accuracy: position.coords.accuracy,
                        });
                    },
                    (error) => {
                        reject(error);
                    }
                );
            }
        });
    };

    const handleClockIn = async () => {
        setLoading(true);
        setLocationError(null);
        let location = null;

        try {
            // Attempt to get location but don't throw if it fails
            location = await getLocation();
        } catch (error) {
            console.error("Location Error during Clock In:", error);
            let warningMsg = "Aapka location sahi nahi mil raha hai.";
            
            if (error.code === 1) {
                warningMsg = "Location permission blocked! Aapka location sahi nahi mil raha hai.";
            } else if (error.code === 2) {
                warningMsg = "Location unavailable (Insecure context or GPS off)! Aapka location sahi nahi mil raha hai.";
            } else if (error.code === 3) {
                warningMsg = "Location request timed out! Aapka location sahi nahi mil raha hai.";
            }
            
            toast.error(warningMsg, { duration: 5000 });
            setLocationError(warningMsg);
            // We continue with location as null
        }

        try {
            const baseUrl = user.role === 'employee' ? '/api/v1/employee' : '/api/v1/admin';

            const res = await fetch(`${baseUrl}/payroll/attendance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employee: user.id,
                    date: new Date().toISOString(),
                    status: "Present",
                    checkIn: new Date().toISOString(),
                    location: location,
                    attendanceMethod: "Web",
                    deviceId: navigator.userAgent
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to clock in");
            }

            // Check for geofencing warning if location was actually found
            if (location && data.attendance?.isGeofenceVerified === false) {
                toast.error("Clocked in, but you are outside the designated office area!", { duration: 5000 });
            } else {
                toast.success("Clocked in successfully!");
            }

            setTodayRecord(data.attendance);
            setStatus("checked-in");
            if (onAttendanceMarked) onAttendanceMarked();

        } catch (error) {
            console.error(error);
            toast.error(error.message || "An error occurred during clock in.");
        } finally {
            setLoading(false);
        }
    };

    const handleClockOut = async () => {
        setLoading(true);
        setLocationError(null);
        let location = null;

        try {
            location = await getLocation();
        } catch (error) {
            console.error("Location Error during Clock Out:", error);
            let warningMsg = "Aapka location sahi nahi mil raha hai.";
            if (error.code === 1) warningMsg = "Location permission blocked! Aapka location sahi nahi mil raha hai.";
            toast.error(warningMsg);
            // Continue with location as null
        }

        try {
            const baseUrl = user.role === 'employee' ? '/api/v1/employee' : '/api/v1/admin';

            const res = await fetch(`${baseUrl}/payroll/attendance`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employee: user.id,
                    date: new Date().toISOString(),
                    checkOut: new Date().toISOString(),
                    status: "Present",
                    location: location
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to clock out");

            toast.success("Clocked out successfully!");
            setTodayRecord(data.attendance);
            setStatus("checked-out");
            if (onAttendanceMarked) onAttendanceMarked();

        } catch (error) {
            console.error(error);
            toast.error(error.message || "An error occurred during clock out.");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") return <div className="animate-pulse h-12 w-32 bg-slate-200 rounded-lg"></div>;

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Fingerprint className="text-indigo-600" /> Mark Attendance
                    </h3>
                    <p className="text-sm text-slate-500">
                        {status === "checked-in"
                            ? `Clocked in at ${new Date(todayRecord?.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : status === "checked-out"
                                ? "Attendance marked for today."
                                : "Please clock in to mark your attendance."}
                    </p>
                    {locationError && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} /> {locationError}
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    {status === "none" && (
                        <button
                            onClick={handleClockIn}
                            disabled={loading}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Locating..." : (
                                <>
                                    <MapPin size={18} /> Clock In
                                </>
                            )}
                        </button>
                    )}

                    {status === "checked-in" && (
                        <button
                            onClick={handleClockOut}
                            disabled={loading}
                            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Processing..." : (
                                <>
                                    <Clock size={18} /> Clock Out
                                </>
                            )}
                        </button>
                    )}

                    {status === "checked-out" && (
                        <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-medium border border-slate-200 cursor-default">
                            Shift Completed
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
