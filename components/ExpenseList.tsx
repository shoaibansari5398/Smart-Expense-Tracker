import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense } from '../types';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  showAmounts?: boolean;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, showAmounts = true }) => {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-xl">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-200">No expenses yet</h3>
        <p className="text-slate-500 mt-1">Start by adding your daily expense summary.</p>
      </div>
    );
  }

  // Sort by date descending
  const sortedExpenses = [...expenses].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt;
  });

  return (
    <div className="bg-slate-900/40 rounded-2xl shadow-xl border border-slate-800 overflow-hidden backdrop-blur-xl">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Transaction History</h2>
        <div className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-400 border border-slate-700">
          {expenses.length} records
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950/50 text-slate-400 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Item</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedExpenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-300">
                  {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 font-medium text-slate-100 group-hover:text-emerald-400 transition-colors">{expense.item}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {expense.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-100 font-mono">
                  {showAmounts ? `₹${expense.amount.toFixed(2)}` : '****'}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden">
        {sortedExpenses.map((expense) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="relative overflow-hidden"
          >
            {/* Background Delete Action */}
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-end px-6">
              <span className="text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                Delete
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
            </div>

            {/* Draggable Card */}
            <motion.div
              drag="x"
              dragConstraints={{ left: -100, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) {
                   onDelete(expense.id);
                }
              }}
              className="relative bg-[#020617] p-4 flex justify-between items-center group active:bg-slate-900 z-10 border-b border-slate-800/50"
              style={{ x: 0 }}
              whileTap={{ cursor: "grabbing" }}
            >
             <div className="flex-1 min-w-0 pr-4">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-semibold text-slate-200 truncate pr-2 group-hover:text-emerald-400 transition-colors">{expense.item}</h4>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    {expense.category}
                  </span>
                  <span className="font-bold text-slate-100 text-sm font-mono">{showAmounts ? `₹${expense.amount.toFixed(2)}` : '****'}</span>
                </div>
             </div>
             {/* Delete button (visible but behind drag on very small screens, or kept as fallback) */}
             <button
                onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                className="text-slate-600 hover:text-red-400 p-2 -mr-2 transition-colors md:hidden"
                aria-label="Delete expense"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
              </button>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseList;
