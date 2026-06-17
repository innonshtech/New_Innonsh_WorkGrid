'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data) => setSpec(data))
      .catch((err) => console.error('Error fetching swagger spec:', err));
  }, []);

  if (!spec) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117] text-gray-300">
        Loading API Documentation...
      </div>
    );
  }

  return (
    <div className="min-h-screen swagger-fix">
      <SwaggerUI spec={spec} />

      <style jsx global>{`
  /* ===== BASE ===== */
  .swagger-ui {
    background: #f8fafc;
    font-family: Inter, sans-serif;
    color: #0f172a;
  }

  /* ===== TOP BAR ===== */
  .swagger-ui .topbar {
    background: #1e293b;
  }

  .swagger-ui .topbar-wrapper span {
    color: #ffffff !important;
    font-weight: 600;
  }

  /* ===== HEADER ===== */
  .swagger-ui .info {
    margin: 20px 0;
  }

  .swagger-ui .info h1 {
    color: #0f172a;
  }

  .swagger-ui .info p {
    color: #475569;
  }

  /* ===== SERVER DROPDOWN ===== */
  .swagger-ui .scheme-container {
    background: #e2e8f0;
    border-radius: 8px;
    padding: 10px;
  }

  /* ===== API BLOCK ===== */
  .swagger-ui .opblock {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 16px;
    box-: 0 2px 6px rgba(0,0,0,0.05);
  }

  /* ===== METHOD COLORS ===== */
  .swagger-ui .opblock.opblock-post {
    border-left: 5px solid #22c55e;
  }

  .swagger-ui .opblock.opblock-get {
    border-left: 5px solid #3b82f6;
  }

  .swagger-ui .opblock.opblock-delete {
    border-left: 5px solid #ef4444;
  }

  .swagger-ui .opblock.opblock-patch {
    border-left: 5px solid #f59e0b;
  }

  /* ===== TEXT ===== */
  .swagger-ui .opblock-summary-path {
    color: #0f172a !important;
    font-weight: 600;
  }

  .swagger-ui .opblock-summary-description {
    color: #475569 !important;
  }

  /* ===== INNER SECTIONS ===== */
  .swagger-ui .opblock-body,
  .swagger-ui .parameters-container,
  .swagger-ui .responses-inner,
  .swagger-ui .request-body {
    background: #f8fafc !important;
  }

  /* ===== CODE BLOCK ===== */
  .swagger-ui .microlight {
    background: #0f172a !important;
    color: #e2e8f0 !important;
    border-radius: 8px;
    padding: 12px;
  }

  /* ===== INPUTS ===== */
  .swagger-ui input,
  .swagger-ui textarea,
  .swagger-ui select {
    border: 1px solid #cbd5f5;
    border-radius: 6px;
  }

  /* ===== BUTTONS ===== */
  .swagger-ui .btn {
    background: #e2e8f0;
    border: none;
    color: #0f172a;
  }

  /* TRY IT OUT */
  .swagger-ui .btn.try-out__btn {
    border: 1px solid #3b82f6;
    color: #3b82f6;
    background: white;
  }

  /* EXECUTE */
  .swagger-ui .btn.execute {
    background: #3b82f6;
    color: white;
  }

  /* ===== TABLE ===== */
  .swagger-ui table thead tr th {
    color: #64748b;
  }

  /* ===== MODEL ===== */
  .swagger-ui section.models {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }

  .swagger-ui .model-container {
    background: #f8fafc;
  }
`}</style>
    </div>
  );
}