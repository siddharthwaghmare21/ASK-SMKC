"use client";

import { useState, useEffect } from 'react';
import { Settings, Shield, Loader2, Save, Activity, RefreshCw } from 'lucide-react';
import api from '../../../utils/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // A temporary state to handle form edits before saving
  const [editSettings, setEditSettings] = useState({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
      const initialEdits = {};
      res.data.forEach((s) => {
        initialEdits[s.setting_key] = s.setting_value;
      });
      setEditSettings(initialEdits);
    } catch (e) {
      console.error("Failed to fetch settings", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit?limit=50');
      setAuditLogs(res.data);
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const handleSaveSetting = async (key) => {
    setSaving(true);
    try {
      await api.post('/settings', {
        setting_key: key,
        setting_value: editSettings[key]
      });
      fetchSettings(); // Refresh to ensure synced state
    } catch (e) {
      alert("Failed to save setting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 p-6 md:p-8 transition-colors">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          System Administration
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage core application settings and view security audit logs.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-4 text-sm font-medium transition-all relative ${
            activeTab === 'settings' 
              ? 'text-blue-600 dark:text-blue-500' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General Settings
          </div>
          {activeTab === 'settings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full" />
          )}
        </button>
        
        <button 
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 text-sm font-medium transition-all relative ${
            activeTab === 'audit' 
              ? 'text-blue-600 dark:text-blue-500' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Audit Logs
          </div>
          {activeTab === 'audit' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {loading && settings.length === 0 && auditLogs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : activeTab === 'settings' ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 overflow-y-auto transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Configuration Keys</h2>
              <button onClick={fetchSettings} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-6 max-w-2xl">
              {settings.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">No settings configured yet.</p>
              ) : (
                settings.map((setting) => (
                  <div key={setting.setting_key} className="flex gap-4 items-end bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 font-mono text-xs">
                        {setting.setting_key}
                      </label>
                      <input 
                        type="text" 
                        value={editSettings[setting.setting_key] || ''}
                        onChange={(e) => setEditSettings({...editSettings, [setting.setting_key]: e.target.value})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-700 dark:text-slate-200"
                      />
                    </div>
                    <button 
                      onClick={() => handleSaveSetting(setting.setting_key)}
                      disabled={saving || editSettings[setting.setting_key] === setting.setting_value}
                      className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2 h-[38px]"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                Recent System Activity
              </h2>
              <button onClick={fetchAuditLogs} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-medium sticky top-0 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 whitespace-nowrap">Timestamp</th>
                    <th className="px-6 py-3 whitespace-nowrap">User ID</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3 w-1/2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">#{log.user_id}</td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-700 dark:text-slate-300 truncate max-w-md">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
