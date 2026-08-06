"use client";

import { useAuth } from '../../context/AuthContext';
import { Users, FileText, Search, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_users: 0,
    total_documents: 0,
    total_departments: 0,
    total_queries: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/analytics/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats.total_users, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { title: 'Documents Indexed', value: stats.total_documents, icon: FileText, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { title: 'Departments', value: stats.total_departments, icon: Activity, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { title: 'AI Queries Handled', value: stats.total_queries, icon: Search, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  ];

  return (
    <div className="p-8 overflow-y-auto w-full h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Welcome back, {user?.full_name}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Here's an overview of the ASK SMKC system today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">System Status</h2>
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 w-max px-4 py-2 rounded-full text-sm font-medium border border-emerald-100 dark:border-emerald-900/50">
          <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          All AI Systems Operational
        </div>
      </div>
    </div>
  );
}
