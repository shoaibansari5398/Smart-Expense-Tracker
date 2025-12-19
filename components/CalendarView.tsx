import React, { useState, useMemo, useEffect } from 'react';
import { Expense } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';

interface CalendarViewProps {
  expenses: Expense[];
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

const CalendarView: React.FC<CalendarViewProps> = ({ expenses }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Selection States
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  // Reset selections when changing year/month navigation or view mode
  useEffect(() => {
    setSelectedWeek(null);
    setSelectedMonthIndex(null);
  }, [viewMode, currentDate.getFullYear()]);

  // Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Navigation handlers
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'daily') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'daily') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  // --- Data Aggregation ---

  // Daily View Data
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      map[e.date] = (map[e.date] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  // Weekly View Data (Summary List)
  const weeklyData = useMemo(() => {
    const year = currentDate.getFullYear();
    const weeks: { weekNum: number; start: Date; end: Date; total: number; count: number }[] = [];

    const weekMap: Record<number, number> = {};
    const weekCountMap: Record<number, number> = {};

    expenses.forEach(e => {
      const eDate = new Date(e.date);
      if (eDate.getFullYear() === year) {
        const w = getWeekNumber(eDate);
        weekMap[w] = (weekMap[w] || 0) + e.amount;
        weekCountMap[w] = (weekCountMap[w] || 0) + 1;
      }
    });

    for (let i = 1; i <= 53; i++) {
       if (weekMap[i] > 0) {
         const simpleDate = new Date(year, 0, 1 + (i - 1) * 7);
         const start = simpleDate;
         const end = new Date(year, 0, 1 + (i - 1) * 7 + 6);

         weeks.push({
           weekNum: i,
           start,
           end,
           total: weekMap[i],
           count: weekCountMap[i]
         });
       }
    }
    return weeks.sort((a, b) => b.weekNum - a.weekNum);
  }, [expenses, currentDate]);

  // Monthly View Data (Summary Grid)
  const monthlyData = useMemo(() => {
    const year = currentDate.getFullYear();
    const months = Array(12).fill(0).map((_, i) => ({
      index: i,
      name: new Date(year, i, 1).toLocaleString('default', { month: 'long' }),
      total: 0,
      count: 0
    }));

    expenses.forEach(e => {
      const eDate = new Date(e.date);
      if (eDate.getFullYear() === year) {
        months[eDate.getMonth()].total += e.amount;
        months[eDate.getMonth()].count += 1;
      }
    });
    return months;
  }, [expenses, currentDate]);

  // --- Details Data Filtering ---

  const selectedDateExpenses = useMemo(() => {
    if (!selectedDate) return [];
    return expenses.filter(e => e.date === selectedDate);
  }, [expenses, selectedDate]);

  const selectedWeekExpensesGroupedByDay = useMemo(() => {
    if (!selectedWeek) return null;
    const year = currentDate.getFullYear();

    const weekExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && getWeekNumber(d) === selectedWeek;
    });

    const grouped: Record<string, Expense[]> = {};
    weekExpenses.forEach(e => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });

    return Object.entries(grouped).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  }, [expenses, selectedWeek, currentDate]);

  const selectedMonthExpensesGroupedByWeek = useMemo(() => {
    if (selectedMonthIndex === null) return null;
    const year = currentDate.getFullYear();

    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === selectedMonthIndex;
    });

    const grouped: Record<number, Expense[]> = {};
    monthExpenses.forEach(e => {
      const w = getWeekNumber(new Date(e.date));
      if (!grouped[w]) grouped[w] = [];
      grouped[w].push(e);
    });

    return Object.entries(grouped).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [expenses, selectedMonthIndex, currentDate]);


  // --- Render Functions ---

  const renderDailyView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex justify-between items-center px-4 md:px-0">
          <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-full hover:bg-slate-800 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Button>
          <h2 className="text-xl font-bold text-slate-100">{monthName}</h2>
          <Button variant="ghost" size="icon" onClick={handleNext} className="rounded-full hover:bg-slate-800 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="grid grid-cols-7 gap-px bg-slate-800 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="bg-slate-950/80 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {d}
              </div>
            ))}

            {blanks.map((_, i) => (
              <div key={`blank-${i}`} className="bg-slate-900/40 h-24 sm:h-32"></div>
            ))}

            {days.map(day => {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const total = dailyData[dateStr] || 0;
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`bg-slate-900/40 h-24 sm:h-32 p-2 relative cursor-pointer hover:bg-slate-800/60 transition-colors flex flex-col justify-between group
                    ${isSelected ? 'bg-slate-800/80 ring-2 ring-inset ring-emerald-500 z-10' : ''}
                  `}
                >
                  <div className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all
                    ${isToday
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/20'
                      : 'text-slate-200 group-hover:bg-slate-800'}
                  `}>
                    {day}
                  </div>

                  {total > 0 && (
                    <div className="mt-1">
                      <div className="text-sm font-bold text-slate-100 truncate font-mono tracking-tight">
                        ₹{total.toLocaleString()}
                      </div>
                      <div className="hidden sm:block text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="mt-6 bg-slate-900/40 rounded-2xl shadow-xl border border-slate-800 p-6 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-100">
              Expenses for <span className="text-emerald-400">{selectedDate ? formatDate(selectedDate) : 'Select a date'}</span>
            </h3>
            {selectedDate && dailyData[selectedDate] && (
               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/20 shadow-sm">
                 Total: ₹{dailyData[selectedDate]?.toLocaleString()}
               </span>
            )}
          </div>

          {selectedDateExpenses.length > 0 ? (
            <div className="space-y-3">
              {selectedDateExpenses.map(expense => (
                <div key={expense.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-200">{expense.item}</p>
                    <p className="text-xs text-slate-500">{expense.category}</p>
                  </div>
                  <p className="font-bold text-slate-100 font-mono">₹{expense.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-slate-500 text-sm italic text-center py-4">
               {selectedDate ? "No expenses recorded for this day." : "Click on a day in the calendar to view details."}
             </p>
          )}
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex justify-between items-center px-4 md:px-0">
          <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-full hover:bg-slate-800 text-slate-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Button>
          <h2 className="text-xl font-bold text-slate-100">Weekly Breakdown {currentDate.getFullYear()}</h2>
          <Button variant="ghost" size="icon" onClick={handleNext} className="rounded-full hover:bg-slate-800 text-slate-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>

        {weeklyData.length > 0 ? (
          <div className="grid gap-4">
            {weeklyData.map(week => {
              const isSelected = selectedWeek === week.weekNum;
              return (
                <div
                  key={week.weekNum}
                  onClick={() => setSelectedWeek(week.weekNum)}
                  className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all bg-slate-900/40 backdrop-blur-xl
                    ${isSelected
                      ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 hover:border-slate-600 hover:bg-slate-800/40'}
                  `}
                >
                  <div>
                    <h4 className={`font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                      Week {week.weekNum}
                    </h4>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-emerald-500/80' : 'text-slate-500'}`}>
                      {week.start.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {week.end.toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                    </p>
                    <p className={`text-xs mt-1 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>{week.count} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold font-mono ${isSelected ? 'text-emerald-100' : 'text-slate-100'}`}>
                      ₹{week.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 bg-slate-900/20 rounded-2xl border border-slate-800">
            No spending recorded for this year yet.
          </div>
        )}

        {/* Weekly Details Section */}
        {selectedWeek && selectedWeekExpensesGroupedByDay && (
          <div className="mt-8 bg-slate-900/40 rounded-2xl shadow-xl border border-slate-800 p-6 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
              Breakdown for Week {selectedWeek}
            </h3>
            <div className="space-y-6">
              {selectedWeekExpensesGroupedByDay.map(([date, expenses]) => (
                <div key={date}>
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2 uppercase tracking-wide">
                    {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h4>
                  <div className="space-y-2">
                    {expenses.map(expense => (
                      <div key={expense.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-transparent hover:border-slate-700 transition-colors">
                        <div>
                          <p className="font-medium text-slate-200">{expense.item}</p>
                          <p className="text-xs text-slate-500">{expense.category}</p>
                        </div>
                        <p className="font-bold text-slate-100 font-mono">₹{expense.amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMonthlyView = () => {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex justify-between items-center px-4 md:px-0">
          <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-full hover:bg-slate-800 text-slate-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Button>
          <h2 className="text-xl font-bold text-slate-100">Monthly Breakdown {currentDate.getFullYear()}</h2>
          <Button variant="ghost" size="icon" onClick={handleNext} className="rounded-full hover:bg-slate-800 text-slate-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {monthlyData.map(m => {
            const isSelected = selectedMonthIndex === m.index;
            return (
              <div
                key={m.name}
                onClick={() => m.total > 0 && setSelectedMonthIndex(m.index)}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between h-32 backdrop-blur-xl
                  ${m.total > 0
                    ? 'cursor-pointer ' + (isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900/40 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40')
                    : 'bg-slate-900/20 border-slate-800/50 opacity-40 cursor-default'}
                `}
              >
                <div className={`font-semibold ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>{m.name}</div>
                {m.total > 0 ? (
                  <div>
                    <div className={`text-xl font-bold font-mono ${isSelected ? 'text-emerald-100' : 'text-slate-100'}`}>
                      ₹{m.total.toLocaleString()}
                    </div>
                    <div className={`text-xs mt-1 ${isSelected ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {m.count} items
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">-</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Monthly Details Section */}
        {selectedMonthIndex !== null && selectedMonthExpensesGroupedByWeek && (
          <div className="mt-8 bg-slate-900/40 rounded-2xl shadow-xl border border-slate-800 p-6 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
              Weekly Breakdown for <span className="text-emerald-400">{new Date(currentDate.getFullYear(), selectedMonthIndex, 1).toLocaleString('default', { month: 'long' })}</span>
            </h3>
            <div className="space-y-6">
              {selectedMonthExpensesGroupedByWeek.map(([weekNum, expenses]) => (
                <div key={weekNum}>
                  <div className="flex justify-between items-baseline mb-2">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                      Week {weekNum}
                    </h4>
                    <span className="text-xs font-bold text-slate-500/80 font-mono">
                      Total: ₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {expenses.map(expense => (
                      <div key={expense.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-transparent hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-900 px-2 py-1 rounded text-xs font-bold text-slate-400 border border-slate-700 min-w-[3rem] text-center">
                            {new Date(expense.date).getDate()} {new Date(expense.date).toLocaleString('default', { month: 'short' })}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{expense.item}</p>
                            <p className="text-xs text-slate-500">{expense.category}</p>
                          </div>
                        </div>
                        <p className="font-bold text-slate-100 font-mono">₹{expense.amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Calendar</h1>
          <p className="text-slate-400 mt-1">View expenses by day, week, or month.</p>
        </div>

        <div className="bg-slate-900/50 p-1 rounded-xl inline-flex border border-slate-800">
          {(['daily', 'weekly', 'monthly'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                viewMode === mode
                  ? 'bg-slate-800 text-emerald-400 shadow-sm ring-1 ring-white/5'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </header>

      {viewMode === 'daily' && renderDailyView()}
      {viewMode === 'weekly' && renderWeeklyView()}
      {viewMode === 'monthly' && renderMonthlyView()}
    </div>
  );
};

export default CalendarView;
