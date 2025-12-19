import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { ExpenseSummary, Expense } from '../types';
import ExpenseList from './ExpenseList';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';

interface DashboardProps {
  summary: ExpenseSummary;
  insights: string;
  loadingInsights: boolean;
  refreshInsights: () => void;
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1', '#ef4444', '#14b8a6'];

const Dashboard: React.FC<DashboardProps> = ({ summary, insights, loadingInsights, refreshInsights, expenses, onDeleteExpense }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [timeFrame, setTimeFrame] = React.useState<'Daily' | 'Weekly' | 'Monthly' | 'All-Time'>('Monthly');

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

  const handlePieClick = (data: any) => {
    if (data && data.name && data.name !== 'No Data') {
      setSelectedCategory(prev => prev === data.name ? null : data.name);
    }
  };

  const timeFrameExpenses = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return expenses.filter(e => {
      const eDate = new Date(e.date);
      switch (timeFrame) {
        case 'Daily': return e.date === todayStr;
        case 'Weekly': return eDate >= sevenDaysAgo;
        case 'Monthly': return eDate >= thirtyDaysAgo;
        case 'All-Time': default: return true;
      }
    });
  }, [expenses, timeFrame]);

  const currentCategoryBreakdown = React.useMemo(() => {
    const categoryMap: Record<string, number> = {};
    let total = 0;
    timeFrameExpenses.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
      total += e.amount;
    });
    const breakdown = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value, percentage: total > 0 ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
    return breakdown.length > 0 ? breakdown : [{ name: 'No Data', value: 1, percentage: 100 }];
  }, [timeFrameExpenses]);

  const filteredExpenses = React.useMemo(() => {
    const baseList = selectedCategory ? timeFrameExpenses.filter(e => e.category === selectedCategory) : [];
    return baseList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCategory, timeFrameExpenses]);

  const isNoData = currentCategoryBreakdown.length === 1 && currentCategoryBreakdown[0].name === 'No Data';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Financial Overview</h1>
        <p className="text-slate-400 mt-1">Track your spending patterns and manage your budget.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-slate-400">Daily Total</p>
            </CardHeader>
            <CardContent>
              <h2 className="text-3xl font-bold text-slate-100">₹{summary.dailyTotal.toFixed(2)}</h2>
              <p className="text-xs text-slate-500 mt-1">Expenses for today</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-slate-400">Weekly Total</p>
            </CardHeader>
            <CardContent>
              <h2 className="text-3xl font-bold text-slate-100">₹{summary.weeklyTotal.toFixed(2)}</h2>
              <p className="text-xs text-slate-500 mt-1">Expenses last 7 days</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-slate-400">Monthly Total</p>
            </CardHeader>
            <CardContent>
              <h2 className="text-3xl font-bold text-slate-100">₹{summary.monthlyTotal.toFixed(2)}</h2>
              <p className="text-xs text-slate-500 mt-1">Expenses last 30 days</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Chart */}
        <motion.div variants={item} className="lg:col-span-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
               <div className="flex flex-col gap-4">
                 <CardTitle>Spending by Category</CardTitle>
                 <div className="bg-slate-900/50 p-1 rounded-lg flex text-xs font-medium text-slate-400 border border-slate-800">
                  {(['Daily', 'Weekly', 'Monthly', 'All-Time'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => { setTimeFrame(tf); setSelectedCategory(null); }}
                      className={`flex-1 py-1.5 rounded-md transition-all duration-200 ${
                        timeFrame === tf ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
               </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[450px] flex flex-col">
              <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentCategoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="85%"
                      paddingAngle={5}
                      dataKey="value"
                      onClick={handlePieClick}
                      className="cursor-pointer focus:outline-none"
                      animationDuration={800}
                    >
                      {currentCategoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={isNoData ? '#334155' : COLORS[index % COLORS.length]}
                          stroke="rgba(15, 23, 42, 0.5)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    {!isNoData && <Tooltip
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Amount']}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid #334155', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />}
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {!isNoData ? currentCategoryBreakdown.map((item, index) => (
                  <div
                    key={item.name}
                    className={`flex justify-between items-center text-sm p-2 rounded-lg transition-colors cursor-pointer border border-transparent ${
                      selectedCategory === item.name ? 'bg-emerald-500/10 border-emerald-500/20' : 'hover:bg-slate-800/50'
                    }`}
                    onClick={() => setSelectedCategory(prev => prev === item.name ? null : item.name)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: COLORS[index % COLORS.length], backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-slate-300 truncate max-w-[120px]" title={item.name}>{item.name}</span>
                    </div>
                    <div className="text-slate-100 font-medium font-mono">
                      ₹{item.value.toFixed(2)} <span className="text-slate-500 text-xs ml-1">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                )) : <div className="text-center text-slate-500 text-sm py-4">No data for this time period</div>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={item} className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col h-full bg-gradient-to-br from-indigo-900/20 via-slate-900/40 to-slate-900/40 border-indigo-500/20">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <CardTitle className="text-indigo-100">AI Insights & Analysis</CardTitle>
                </div>
                <Button
                   variant="ghost"
                   size="sm"
                   onClick={refreshInsights}
                   disabled={loadingInsights}
                   className="text-indigo-300 hover:text-indigo-100 hover:bg-indigo-500/20"
                >
                  {loadingInsights ? 'Analyzing...' : insights ? 'Refresh' : 'Generate'}
                </Button>
             </CardHeader>
             <CardContent className="flex-1 pt-4">
                <div className="bg-slate-950/50 rounded-xl p-6 h-full min-h-[450px] border border-indigo-500/10 shadow-inner">
                  {loadingInsights ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                      <p className="animate-pulse">Crunching numbers...</p>
                    </div>
                  ) : insights ? (
                    <div className="prose prose-invert prose-indigo prose-sm max-w-none text-slate-300">
                      <div dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-200">$1</strong>') }} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                      <div className="p-4 bg-slate-900 rounded-full ring-1 ring-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <p>Click 'Generate' to analyze your spending habits...</p>
                    </div>
                  )}
                </div>
             </CardContent>
          </Card>
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
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          <ExpenseList expenses={filteredExpenses} onDelete={onDeleteExpense} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;
