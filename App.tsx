import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
// Remove static imports for route components
import Auth from './components/Auth';
import ErrorBoundary from './components/ErrorBoundary';
import { getExpenses, addExpenses, deleteExpense } from './services/storageService';
import { generateInsights } from './services/geminiService';
import { subscribeToAuthChanges, logout } from './services/authService';
import { Expense, User } from './types';
import { useExpenseAnalysis } from './hooks/useExpenseAnalysis';
import { Toaster, toast } from 'react-hot-toast';
import { PageTransition } from './components/ui/PageTransition';

// Lazy load components
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const ExpenseForm = React.lazy(() => import('./components/ExpenseForm'));
const ExpenseList = React.lazy(() => import('./components/ExpenseList'));
const CalendarView = React.lazy(() => import('./components/CalendarView'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      <p className="text-slate-400 text-sm animate-pulse">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const location = useLocation();

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
        setInsights('');
        setIsDataLoading(false);
      } else {
        setExpenses([]);
      }
    };

    if (!isAuthChecking) {
      loadData();
    }
  }, [user, isAuthChecking]);

  const { summary } = useExpenseAnalysis(expenses);

  const handleLogin = (loggedInUser: User) => {
    if (loggedInUser.isGuest) {
      setUser(loggedInUser);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleAddExpenses = async (newItems: Omit<Expense, 'id' | 'createdAt'>[]) => {
    if (!user) return;
    try {
      const addedItems = await addExpenses(user.id, newItems);
      setExpenses(prev => [...prev, ...addedItems]);
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

  if (isAuthChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600">Initializing App...</div>;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <>
      <Toaster position="top-right" />
      <ErrorBoundary>
        <Layout user={user} onLogout={handleLogout}>
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                  <PageTransition>
                    <Dashboard
                      summary={summary}
                      insights={insights}
                      loadingInsights={loadingInsights}
                      refreshInsights={fetchInsights}
                      expenses={expenses}
                      onDeleteExpense={handleDeleteExpense}
                      loading={isDataLoading}
                    />
                  </PageTransition>
                } />
                <Route path="/calendar" element={
                  <PageTransition>
                    <CalendarView expenses={expenses} />
                  </PageTransition>
                } />
                <Route path="/add" element={
                  <PageTransition>
                    <ExpenseForm
                      onAddExpenses={handleAddExpenses}
                    />
                  </PageTransition>
                } />
                <Route path="/history" element={
                  <PageTransition>
                    <ExpenseList
                      expenses={expenses}
                      onDelete={handleDeleteExpense}
                    />
                  </PageTransition>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </Layout>
      </ErrorBoundary>
    </>
  );
};

export default App;
