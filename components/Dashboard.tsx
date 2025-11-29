import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ExpenseSummary } from '../types';

interface DashboardProps {
  summary: ExpenseSummary;
  insights: string;
  loadingInsights: boolean;
  refreshInsights: () => void;
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

const Dashboard: React.FC<DashboardProps> = ({ summary, insights, loadingInsights, refreshInsights }) => {
  
  // Format data for category chart to avoid 0 values or empty charts issues
  const categoryData = summary.categoryBreakdown.length > 0 
    ? summary.categoryBreakdown 
    : [{ name: 'No Data', value: 1, percentage: 100 }];

  const isNoData = summary.categoryBreakdown.length === 0;

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Financial Overview</h1>
        <p className="text-slate-500 mt-1">Track your spending patterns and manage your budget.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Daily Total</p>
          <h2 className="text-3xl font-bold text-indigo-600 mt-2">₹{summary.dailyTotal.toFixed(2)}</h2>
          <p className="text-xs text-slate-400 mt-1">Expenses for today</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Weekly Total</p>
          <h2 className="text-3xl font-bold text-emerald-600 mt-2">₹{summary.weeklyTotal.toFixed(2)}</h2>
          <p className="text-xs text-slate-400 mt-1">Expenses last 7 days</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Monthly Total</p>
          <h2 className="text-3xl font-bold text-blue-600 mt-2">₹{summary.monthlyTotal.toFixed(2)}</h2>
          <p className="text-xs text-slate-400 mt-1">Expenses last 30 days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Spending by Category</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={isNoData ? '#e2e8f0' : COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                {!isNoData && <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {!isNoData ? summary.categoryBreakdown.map((item, index) => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-slate-600 truncate max-w-[120px]" title={item.name}>{item.name}</span>
                </div>
                <div className="text-slate-900 font-medium">
                  ₹{item.value.toFixed(2)} <span className="text-slate-400 text-xs">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            )) : <div className="text-center text-slate-400 text-sm py-4">No data to display</div>}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-800">AI Insights & Analysis</h3>
            </div>
            <button 
              onClick={refreshInsights}
              disabled={loadingInsights}
              className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              {loadingInsights ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>
          
          <div className="bg-indigo-50/50 rounded-xl p-6 flex-1 border border-indigo-100/50">
            {loadingInsights ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p>Crunching the numbers...</p>
              </div>
            ) : (
              <div className="prose prose-indigo prose-sm max-w-none text-slate-700">
                <div dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;