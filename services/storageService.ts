import { Expense } from '../types';
import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  orderBy 
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY_PREFIX = 'smartspend_expenses';

// --- GUEST MODE (LocalStorage) ---

const getLocalKey = (userId: string) => 
  userId === 'guest' ? 'smartspend_expenses' : `${LOCAL_STORAGE_KEY_PREFIX}_${userId}`;

const getLocalExpenses = (userId: string): Expense[] => {
  try {
    const data = localStorage.getItem(getLocalKey(userId));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

const saveLocalExpenses = (userId: string, expenses: Expense[]) => {
  localStorage.setItem(getLocalKey(userId), JSON.stringify(expenses));
};

// --- MAIN FUNCTIONS (Hybrid: Firestore + LocalStorage) ---

export const getExpenses = async (userId: string): Promise<Expense[]> => {
  if (!userId) return [];

  // Guest Mode
  if (userId === 'guest') {
    return getLocalExpenses(userId);
  }

  // Firestore Mode
  try {
    const q = query(
      collection(db, "expenses"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    querySnapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() } as Expense);
    });
    
    return expenses;
  } catch (error) {
    console.error("Error fetching expenses from DB:", error);
    return [];
  }
};

export const addExpenses = async (userId: string, newExpenses: Omit<Expense, 'id' | 'createdAt'>[]): Promise<Expense[]> => {
  // Guest Mode
  if (userId === 'guest') {
    const current = getLocalExpenses(userId);
    const added: Expense[] = newExpenses.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    }));
    saveLocalExpenses(userId, [...current, ...added]);
    return added;
  }

  // Firestore Mode
  const addedExpenses: Expense[] = [];
  try {
    const batchPromises = newExpenses.map(async (item) => {
      const docRef = await addDoc(collection(db, "expenses"), {
        ...item,
        userId, // Attach userId to the document
        createdAt: Date.now()
      });
      return { id: docRef.id, ...item, createdAt: Date.now() } as Expense;
    });

    const results = await Promise.all(batchPromises);
    return results;
  } catch (error) {
    console.error("Error adding expenses to DB:", error);
    throw error;
  }
};

export const deleteExpense = async (userId: string, expenseId: string): Promise<void> => {
  // Guest Mode
  if (userId === 'guest') {
    const current = getLocalExpenses(userId);
    const updated = current.filter(e => e.id !== expenseId);
    saveLocalExpenses(userId, updated);
    return;
  }

  // Firestore Mode
  try {
    await deleteDoc(doc(db, "expenses", expenseId));
  } catch (error) {
    console.error("Error deleting expense from DB:", error);
    throw error;
  }
};