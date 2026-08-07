"use client";

import { useState, useEffect } from 'react';
import { Shield, Clock, User, Activity, Download, ChevronDown } from 'lucide-react';
import api from '../../../utils/api';
import * as XLSX from 'xlsx';
import { Document as DocxDocument, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit/');
        setLogs(res.data);
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "User", "Action", "Details"];
    const csvRows = [headers.join(",")];
    for (const log of logs) {
      const row = [
        `"${new Date(log.created_at).toISOString()}"`,
        `"${log.user_name || ''}"`,
        `"${log.action || ''}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.setAttribute("href", url);
    a.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const handleExportJSON = () => {
    if (logs.length === 0) return;
    const jsonData = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.setAttribute("href", url);
    a.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    if (logs.length === 0) return;
    const data = logs.map(log => ({
      Timestamp: new Date(log.created_at).toLocaleString(),
      User: log.user_name || 'System',
      Action: log.action,
      Details: log.details || '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
    XLSX.writeFile(workbook, `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    if (logs.length === 0) return;
    const doc = new jsPDF();
    doc.text("System Audit Logs", 14, 15);
    
    const tableData = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.user_name || 'System',
      log.action,
      log.details || '-'
    ]);

    autoTable(doc, {
      head: [['Timestamp', 'User', 'Action', 'Details']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    doc.save(`audit_logs_${new Date().toISOString().split('T')[0]}.pdf`);
    setExportMenuOpen(false);
  };

  const handleExportWord = async () => {
    if (logs.length === 0) return;

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Timestamp", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "User", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Action", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Details", bold: true })] })] }),
          ],
        }),
        ...logs.map(log => 
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(new Date(log.created_at).toLocaleString())] }),
              new TableCell({ children: [new Paragraph(log.user_name || 'System')] }),
              new TableCell({ children: [new Paragraph(log.action)] }),
              new TableCell({ children: [new Paragraph(log.details || '-')] }),
            ],
          })
        )
      ],
    });

    const doc = new DocxDocument({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "System Audit Logs", bold: true, size: 32 })],
          }),
          new Paragraph({ text: "" }),
          table,
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `audit_logs_${new Date().toISOString().split('T')[0]}.docx`);
    setExportMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            System Audit Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Review security events, logins, and system changes.
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-10">
              <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Export as CSV</button>
              <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Export as Excel (.xlsx)</button>
              <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Export as PDF</button>
              <button onClick={handleExportWord} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Export as Word (.docx)</button>
              <button onClick={handleExportJSON} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-t border-slate-100 dark:border-slate-700">Export as JSON</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors text-sm">
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 flex items-center gap-2 whitespace-nowrap">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <User className="w-3 h-3 text-slate-500" />
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{log.user_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                      <Activity className="w-3 h-3" />
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {log.details || "-"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No audit logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
