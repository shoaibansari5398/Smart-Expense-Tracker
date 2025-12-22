import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { ExpenseSummary } from '../../types';
import { Skeleton } from '../ui/Skeleton';

interface SummaryCardsProps {
  summary: ExpenseSummary;
  loading?: boolean;
  showAmounts: boolean;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, loading, showAmounts }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-l-4 border-slate-700">
             <CardHeader className="pb-2">
               <Skeleton className="h-4 w-24 mb-1" />
             </CardHeader>
             <CardContent>
               <Skeleton className="h-9 w-32 mb-2" />
               <Skeleton className="h-3 w-40" />
             </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div variants={item}>
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-slate-400">Daily Total</p>
          </CardHeader>
          <CardContent>
            <h2 className="text-3xl font-bold text-slate-100">
              {showAmounts ? `₹${summary.dailyTotal.toFixed(2)}` : '****'}
            </h2>
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
            <h2 className="text-3xl font-bold text-slate-100">
              {showAmounts ? `₹${summary.weeklyTotal.toFixed(2)}` : '****'}
            </h2>
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
            <h2 className="text-3xl font-bold text-slate-100">
              {showAmounts ? `₹${summary.monthlyTotal.toFixed(2)}` : '****'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Expenses last 30 days</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
