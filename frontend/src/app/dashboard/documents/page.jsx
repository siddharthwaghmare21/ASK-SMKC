"use client";

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, File, Trash2, ShieldCheck, Loader2, CheckCircle2, AlertCircle, X, Edit2, Eye } from 'lucide-react';
import api from '../../../utils/api';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const departmentId = searchParams.get('department');
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [metadata, setMetadata] = useState({
    document_name: '',
    document_type: 'Act',
    language: 'English',
    department_id: departmentId ? parseInt(departmentId) : 1
  });
  const [editingDoc, setEditingDoc] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDocs = async () => {
    try {
      const endpoint = departmentId ? `/documents?department_id=${departmentId}` : '/documents';
      const res = await api.get(endpoint);
      setDocuments(res.data);
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [departmentId]);

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const res = await api.get('/departments/');
        setDepartmentsList(res.data);
      } catch (e) {
        console.error("Failed to fetch departments list", e);
      }
    };
    fetchDeps();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_name', metadata.document_name);
    formData.append('document_type', metadata.document_type);
    formData.append('language', metadata.language);
    formData.append('department_id', metadata.department_id);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      setMetadata({ ...metadata, document_name: '' });
      showToast("Document uploaded and processed successfully!", "success");
      fetchDocs();
    } catch (error) {
      showToast("Upload failed. Make sure the file is a valid PDF.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.delete(`/documents/${id}`);
      showToast("Document deleted successfully", "success");
      fetchDocs();
    } catch (error) {
      showToast("Failed to delete document", "error");
    }
  };

  const handleShow = async (id) => {
    try {
      const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      showToast("Failed to open document", "error");
    }
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/documents/${editingDoc.id}`, {
        document_name: editingDoc.document_name,
        document_type: editingDoc.document_type,
        language: editingDoc.language
      });
      showToast("Document updated successfully", "success");
      setEditingDoc(null);
      fetchDocs();
    } catch (error) {
      showToast("Failed to update document", "error");
    }
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-6 right-8 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border z-50 animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'success' ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />}
          <span className="font-medium text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Edit Modal */}
      {editingDoc && (
        <div className="absolute inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Update Document</h3>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Document Name</label>
                <input 
                  type="text" 
                  required
                  value={editingDoc.document_name}
                  onChange={e => setEditingDoc({...editingDoc, document_name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select 
                    value={editingDoc.document_type}
                    onChange={e => setEditingDoc({...editingDoc, document_type: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>Act</option>
                    <option>GR</option>
                    <option>Circular</option>
                    <option>Rule</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Language</label>
                  <select 
                    value={editingDoc.language}
                    onChange={e => setEditingDoc({...editingDoc, language: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>English</option>
                    <option>Marathi</option>
                    <option>Hindi</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingDoc(null)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Knowledge Base</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Upload and manage official municipal documents for the AI to learn from.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        {/* Upload Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 flex flex-col h-max">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-500" /> Upload New Document
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Document Name</label>
              <input 
                type="text" 
                required
                value={metadata.document_name}
                onChange={e => setMetadata({...metadata, document_name: e.target.value})}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="e.g. Maharashtra Municipal Act 1949"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <select 
                  value={metadata.document_type}
                  onChange={e => setMetadata({...metadata, document_type: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option>Act</option>
                  <option>GR</option>
                  <option>Circular</option>
                  <option>Rule</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Language</label>
                <select 
                  value={metadata.language}
                  onChange={e => setMetadata({...metadata, language: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option>English</option>
                  <option>Marathi</option>
                  <option>Hindi</option>
                </select>
              </div>
            </div>

            <div 
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                file 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".pdf" 
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="text-blue-700 dark:text-blue-400">
                  <File className="w-8 h-8 mx-auto mb-2 opacity-75" />
                  <p className="text-sm font-medium truncate px-4">{file.name}</p>
                  <p className="text-xs text-blue-500 dark:text-blue-500/80 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="text-slate-500 dark:text-slate-400">
                  <UploadCloud className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Click or drag PDF to upload</p>
                  <p className="text-xs mt-1">Max size 50MB</p>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {uploading ? 'Processing AI Vectors...' : 'Upload & Process'}
            </button>
          </form>
        </div>

        {/* Document List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-4">
              Indexed Documents
              <select 
                className="ml-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 font-normal"
                value={departmentId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    router.push(`/dashboard/documents?department=${val}`);
                  } else {
                    router.push('/dashboard/documents');
                  }
                }}
              >
                <option value="">All Departments</option>
                {departmentsList.map(dep => (
                  <option key={dep.id} value={dep.id}>{dep.name}</option>
                ))}
              </select>
            </h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{documents.length} Total</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {documents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                {departmentId ? "No documents added in this specific department yet." : "No documents uploaded yet."}
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <File className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-slate-800 dark:text-slate-200">{doc.document_name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wider font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                          {doc.document_type}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                          {doc.language}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ${
                          doc.processing_status === 'completed' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : doc.processing_status === 'failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {doc.processing_status || 'pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleShow(doc.id)} 
                      title="Show Document"
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEditingDoc(doc)} 
                      title="Update Document"
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      title="Delete Document"
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
