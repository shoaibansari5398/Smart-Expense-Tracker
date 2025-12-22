import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExpenseSummary, Expense } from '../types';
import ExpenseList from './ExpenseList';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { SummaryCards } from './dashboard/SummaryCards';
import { SpendingChart } from './dashboard/SpendingChart';
import { AIChat } from './dashboard/AIChat';
import { exportExpensesToCSV } from '../lib/export';

interface DashboardProps {
  summary: ExpenseSummary;
  insights: string;
  loadingInsights: boolean;
  refreshInsights: () => void;
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  loading?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ summary, insights, loadingInsights, refreshInsights, expenses, onDeleteExpense, loading }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<'Daily' | 'Weekly' | 'Monthly' | 'All-Time'>('Monthly');

    const [showAmounts, setShowAmounts] = useState<boolean>(true);

    const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Filter expenses for "Selected Category Transactions" at the bottom
  const filteredExpenses = useMemo(() => {
    // 1. Filter by Timeframe (Duplicate logic from Chart - ideally shared state or filtered upstream, but acceptable here for display)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const timeFrameFiltered = expenses.filter(e => {
      const eDate = new Date(e.date);
      switch (timeFrame) {
        case 'Daily': return e.date === todayStr;
        case 'Weekly': return eDate >= sevenDaysAgo;
        case 'Monthly': return eDate >= thirtyDaysAgo;
        case 'All-Time': default: return true;
      }
    });

    // 2. Filter by Category
    const baseList = selectedCategory ? timeFrameFiltered.filter(e => e.category === selectedCategory) : [];
    return baseList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCategory, timeFrame, expenses]);


  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Financial Overview</h1>
          <p className="text-slate-400 mt-1">Track your spending patterns and manage your budget.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAmounts(!showAmounts)}
                className="rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                aria-label={showAmounts ? "Hide amounts" : "Show amounts"}
            >
                {showAmounts ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                )}
            </Button>
            <Button
            variant="outline"
            onClick={() => exportExpensesToCSV(expenses)}
            className="gap-2 border-slate-700 hover:bg-slate-800"
            disabled={expenses.length === 0}
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
            </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <SummaryCards summary={summary} loading={loading} showAmounts={showAmounts} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Chart */}
        <motion.div variants={item} className="lg:col-span-1 flex flex-col">
          <SpendingChart
             expenses={expenses}
             onCategorySelect={setSelectedCategory}
             selectedCategory={selectedCategory}
             timeFrame={timeFrame}
             setTimeFrame={setTimeFrame}
             showAmounts={showAmounts}
          />
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={item} className="lg:col-span-2 flex flex-col">
        {/* AI Chat Assistant */}
        <motion.div variants={item} className="lg:col-span-2 flex flex-col">
          <AIChat
             expenses={expenses}
             summary={summary}
             initialInsight={insights}
             onRefreshInsight={refreshInsights}
          />
        </motion.div>
        </motion.div>
      </div>

      {/* Selected Category Transactions */}
      {selectedCategory && (
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="mt-8"
        >
          <div className="flex justify-between items-center mb-4 px-1">
             <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
              {timeFrame} Transactions: <span className="text-emerald-400">{selectedCategory}</span>
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCategory(null)}
              className="rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              aria-label="Clear filter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          <ExpenseList expenses={filteredExpenses} onDelete={onDeleteExpense} showAmounts={showAmounts} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;
