import { useMemo } from 'react';
import { Expense, ExpenseSummary } from '../types';

export const useExpenseAnalysis = (expenses: Expense[]) => {
  const summary: ExpenseSummary = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let daily = 0;
    let weekly = 0;
    let monthly = 0;
    const categoryMap: Record<string, number> = {};

    expenses.forEach(e => {
      const eDate = new Date(e.date);
      const val = e.amount;

      // Daily
      if (e.date === todayStr) {
        daily += val;
      }

      // Weekly
      if (eDate >= sevenDaysAgo) {
        weekly += val;
      }

      // Monthly
      if (eDate >= thirtyDaysAgo) {
        monthly += val;
      }

      // Category breakdown (Monthly)
      if (eDate >= thirtyDaysAgo) {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + val;
      }
    });

    const totalMonthly = monthly > 0 ? monthly : 1;
    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / totalMonthly) * 100
      }))
      .sort((a, b) => b.value - a.value);

    return {
      dailyTotal: daily,
      weeklyTotal: weekly,
      monthlyTotal: monthly,
      categoryBreakdown
    };
  }, [expenses]);

  return { summary };
};
