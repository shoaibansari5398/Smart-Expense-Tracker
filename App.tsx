import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import CalendarView from './components/CalendarView';
import Auth from './components/Auth';
import { getExpenses, addExpenses, deleteExpense } from './services/storageService';
import { generateInsights } from './services/geminiService';
import { subscribeToAuthChanges, logout } from './services/authService';
import { Expense, ExpenseSummary, User } from './types';

import { Toaster, toast } from 'react-hot-toast';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'history' | 'calendar'>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Load user data when user changes
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setIsDataLoading(true);
        const data = await getExpenses(user.id);
        setExpenses(data);
        setInsights(''); // Clear insights from previous session
        setActiveTab('dashboard');
        setIsDataLoading(false);
      } else {
        setExpenses([]);
      }
    };

    if (!isAuthChecking) {
      loadData();
    }
  }, [user, isAuthChecking]);

  // Calculate summaries efficiently
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

  const handleLogin = (loggedInUser: User) => {
    // State update handled by auth listener
  };

  const handleLogout = async () => {
    await logout();
    // State update handled by auth listener
  };

  const handleAddExpenses = async (newItems: Omit<Expense, 'id' | 'createdAt'>[]) => {
    if (!user) return;

    // Optimistic UI update (optional, but implemented strictly via DB return here for safety)
    try {
      const addedItems = await addExpenses(user.id, newItems);
      setExpenses(prev => [...prev, ...addedItems]);
      setActiveTab('dashboard');
      toast.success('Expense added successfully!');
    } catch (error) {
      console.error(error);
      toast.error("Failed to save expenses to database");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user) return;
    try {
      await deleteExpense(user.id, id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Expense deleted successfully!');
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete expense");
    }
  };

  const fetchInsights = useCallback(async () => {
    if (expenses.length === 0) return;
    setLoadingInsights(true);
    try {
      const text = await generateInsights(expenses, summary);
      setInsights(text);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  }, [expenses, summary]);

  // Initial insight fetch removed for lazy loading


  if (isAuthChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600">Initializing App...</div>;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <>
      <Toaster position="top-right" />
      <Layout activeTab={activeTab} onTabChange={setActiveTab} user={user} onLogout={handleLogout}>
        {activeTab === 'dashboard' && (
          <Dashboard
            summary={summary}
            insights={insights}
            loadingInsights={loadingInsights}
            refreshInsights={fetchInsights}
            expenses={expenses}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView expenses={expenses} />
        )}
        {activeTab === 'add' && (
          <ExpenseForm
            onAddExpenses={handleAddExpenses}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}
        {activeTab === 'history' && (
          <ExpenseList
            expenses={expenses}
            onDelete={handleDeleteExpense}
          />
        )}
      </Layout>
    </>
  );
};

export default App;
