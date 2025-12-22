import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Expense } from '../../types';

interface SpendingChartProps {
  expenses: Expense[];
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
  timeFrame: 'Daily' | 'Weekly' | 'Monthly' | 'All-Time';
  setTimeFrame: (tf: 'Daily' | 'Weekly' | 'Monthly' | 'All-Time') => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1', '#ef4444', '#14b8a6'];

export const SpendingChart: React.FC<SpendingChartProps> = ({
  expenses,
  onCategorySelect,
  selectedCategory,
  timeFrame,
  setTimeFrame
}) => {
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

  const isNoData = currentCategoryBreakdown.length === 1 && currentCategoryBreakdown[0].name === 'No Data';

  const handlePieClick = (data: { name: string; value: number; percentage: number }) => {
    if (data && data.name && data.name !== 'No Data') {
      onCategorySelect(data.name === selectedCategory ? null : data.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, categoryName: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCategorySelect(categoryName === selectedCategory ? null : categoryName);
    }
  };

  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader>
         <div className="flex flex-col gap-4">
           <CardTitle>Spending by Category</CardTitle>
           <div className="bg-slate-900/50 p-1 rounded-lg flex text-xs font-medium text-slate-400 border border-slate-800">
            {(['Daily', 'Weekly', 'Monthly', 'All-Time'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => { setTimeFrame(tf); onCategorySelect(null); }}
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

        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2" role="list">
          {!isNoData ? currentCategoryBreakdown.map((item, index) => (
            <div
              key={item.name}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, item.name)}
              className={`flex justify-between items-center text-sm p-2 rounded-lg transition-colors cursor-pointer border border-transparent ${
                selectedCategory === item.name ? 'bg-emerald-500/10 border-emerald-500/20' : 'hover:bg-slate-800/50'
              }`}
              onClick={() => onCategorySelect(item.name === selectedCategory ? null : item.name)}
              aria-label={`Select category ${item.name} with amount ₹${item.value.toFixed(2)}`}
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
  );
};
