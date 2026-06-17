"use client";
import { useState, useEffect } from "react";

export default function DebugAuth() {
    const [pingResult, setPingResult] = useState(null);
    const [sessionResult, setSessionResult] = useState(null);

    useEffect(() => {
        // Test Ping
        fetch("/api/test_ping")
            .then(async (res) => ({ status: res.status, data: await res.json().catch(e => e.message) }))
            .then(setPingResult)
            .catch(err => setPingResult({ error: err.message }));

        // Test Session
        fetch("/api/v1/session")
            .then(async (res) => ({ status: res.status, data: await res.json().catch(e => "Invalid JSON") }))
            .then(setSessionResult)
            .catch(err => setSessionResult({ error: err.message }));
    }, []);

    return (
        <div className="p-10 space-y-4">
            <h1 className="text-2xl font-bold">Auth Debugger</h1>

            <div className="border p-4 rounded">
                <h2 className="font-bold">/api/test_ping</h2>
                <pre>{JSON.stringify(pingResult, null, 2)}</pre>
            </div>

            <div className="border p-4 rounded">
                <h2 className="font-bold">/api/v1/session</h2>
                <pre>{JSON.stringify(sessionResult, null, 2)}</pre>
            </div>
            <div className="border p-4 rounded">
                <a href="/login" className="text-blue-500 underline">Go to /login</a>
            </div>
        </div>
    );
}
