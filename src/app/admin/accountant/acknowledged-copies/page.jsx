'use client';

import { useState, Suspense } from 'react';
import {
  FileText, CheckCircle2, Clock, Download, Search, Calendar, Users, Eye, XCircle,
  RefreshCw, Settings, Zap, ArrowUp, ArrowDown, TrendingUp
} from 'lucide-react';

export default function AcknowledgedCopies() {
  return (
    <Suspense fallback={<div>Loading copies...</div>}>
      <AcknowledgedCopiesContent />
    </Suspense>
  );
}

function AcknowledgedCopiesContent() {
  const [documents, setDocuments] = useState([
    {
      id: 1,
      type: 'Delivery Copy',
      fileName: 'delivery_receipt_001.pdf',
      status: 'pending',
      signed: false,
      date: '2025-11-15',
      customer: 'ABC Corporation'
    },
    {
      id: 2,
      type: 'Invoice Copy',
      fileName: 'invoice_2025_001.pdf',
      status: 'acknowledged',
      signed: true,
      date: '2025-11-14',
      customer: 'XYZ Ltd'
    },
    {
      id: 3,
      type: 'Delivery Copy',
      fileName: 'delivery_receipt_002.pdf',
      status: 'pending',
      signed: false,
      date: '2025-11-16',
      customer: 'Global Traders'
    }
  ]);

  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const toggleDocumentSelection = (id) => {
    setSelectedDocuments(prev =>
      prev.includes(id)
        ? prev.filter(docId => docId !== id)
        : [...prev, id]
    );
  };

  const handleSignDocuments = () => {
    setDocuments(prev =>
      prev.map(doc =>
        selectedDocuments.includes(doc.id)
          ? { ...doc, signed: true, status: 'acknowledged' }
          : doc
      )
    );
    setSelectedDocuments([]);
  };

  const generateReport = () => {
    let filteredDocs = documents;

    // Filter by report type
    if (reportType === 'signed') {
      filteredDocs = filteredDocs.filter(doc => doc.signed);
    } else if (reportType === 'pending') {
      filteredDocs = filteredDocs.filter(doc => !doc.signed);
    }

    // Filter by date range
    if (dateRange.start && dateRange.end) {
      filteredDocs = filteredDocs.filter(doc =>
        doc.date >= dateRange.start && doc.date <= dateRange.end
      );
    }

    // In a real application, this would generate and download a PDF/Excel report
    console.log('Generated Report:', filteredDocs);
    alert(`Report generated for ${filteredDocs.length} documents! Check console for details.`);

    // Here you would typically:
    // 1. Make an API call to generate the report
    // 2. Download the generated file
    // 3. Or open the report in a new window
  };

  const attachSignedCopies = (id) => {
    // Simulate file upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.jpg,.png';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === id
              ? {
                ...doc,
                signed: true,
                status: 'completed',
                attachedFile: file.name
              }
              : doc
          )
        );
        alert(`File "${file.name}" attached successfully!`);
      }
    };
    fileInput.click();
  };

  const totalDocuments = documents.length;
  const signedDocuments = documents.filter(doc => doc.signed).length;
  const pendingDocuments = documents.filter(doc => !doc.signed).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-[#FB9D00] rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Acknowledged Copies Dashboard</h1>
                <p className="text-slate-600 text-sm mt-0.5">Manage delivery and invoice acknowledgments</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="p-2.5 text-slate-600 hover:text-[#FB9D00] hover:bg-[#FB9D00]/10 rounded-lg transition-colors">
                <RefreshCw className="h-5 w-5" />
              </button>
              {/* <button className="p-2.5 text-slate-600 hover:text-[#FB9D00] hover:bg-[#FB9D00]/10 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button> */}

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Action Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={handleSignDocuments}
                disabled={selectedDocuments.length === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedDocuments.length === 0
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
              >
                <CheckCircle2 className="h-4 w-4 inline mr-2" />
                Mark as Signed ({selectedDocuments.length})
              </button>
            </div>

            <div className="flex gap-4 items-center flex-wrap">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
              >
                <option value="all">All Documents</option>
                <option value="signed">Signed Only</option>
                <option value="pending">Pending Only</option>
              </select>

              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
              />

              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
              />

              <button
                onClick={generateReport}
                className="flex items-center gap-2 px-4 py-2 bg-[#FB9D00] text-white rounded-lg hover:bg-[#E68A00] font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocuments(documents.map(doc => doc.id));
                      } else {
                        setSelectedDocuments([]);
                      }
                    }}
                    checked={selectedDocuments.length === documents.length && documents.length > 0}
                    className="rounded border-slate-200 text-[#FB9D00] focus:ring-[#FB9D00]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {documents.map((document) => (
                <tr key={document.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(document.id)}
                      onChange={() => toggleDocumentSelection(document.id)}
                      className="rounded border-slate-200 text-[#FB9D00] focus:ring-[#FB9D00]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${document.type === 'Delivery Copy'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                      }`}>
                      {document.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {document.fileName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {document.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {document.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${document.signed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {document.signed ? 'Signed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!document.signed ? (
                      <button
                        onClick={() => attachSignedCopies(document.id)}
                        className="text-[#FB9D00] hover:text-[#E68A00] mr-4 text-sm font-medium"
                      >
                        Attach Signed Copy
                      </button>
                    ) : (
                      <span className="text-green-600 text-sm font-medium">Completed</span>
                    )}
                    <button className="text-slate-600 hover:text-slate-900 text-sm font-medium">
                      <Download className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {documents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No documents found</p>
              <p className="text-slate-400 mt-2">Upload your first document to get started</p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FB9D00]/10 rounded-lg flex items-center justify-center border border-[#FB9D00]/20">
                <Zap className="w-4 h-4 text-[#FB9D00]" />
              </div>
              Document Statistics
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group bg-white rounded-xl border border-blue-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-blue-200">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="font-medium text-green-600">+2</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Documents</p>
                  <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                    {totalDocuments}
                  </p>
                </div>
              </div>

              <div className="group bg-white rounded-xl border border-green-200 p-6 hover: transition-all duration-200 bg-green-50 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="font-medium text-green-600">+1</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Signed Copies</p>
                  <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                    {signedDocuments}
                  </p>
                </div>
              </div>

              <div className="group bg-white rounded-xl border border-yellow-200 p-6 hover: transition-all duration-200 bg-yellow-50 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-3 w-3 text-red-600" />
                    <span className="font-medium text-red-600">-1</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                    {pendingDocuments}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}