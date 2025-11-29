export interface User {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;
}

export interface Expense {
  id: string;
  item: string;
  amount: number;
  category: string;
  date: string; // ISO Date string YYYY-MM-DD
  createdAt: number;
}

export interface ExpenseSummary {
  dailyTotal: number;
  weeklyTotal: number;
  monthlyTotal: number;
  categoryBreakdown: { name: string; value: number; percentage: number }[];
}

export interface AIMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ParsedExpenseResponse {
  expenses: {
    item: string;
    amount: number;
    category: string;
    date?: string;
  }[];
}