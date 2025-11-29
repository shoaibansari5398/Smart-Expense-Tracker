import { User } from '../types';
import { auth } from '../firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

const SESSION_KEY = 'smartspend_current_user';

// Register with Firebase
export const register = async (name: string, email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Update display name
    await updateProfile(firebaseUser, { displayName: name });
    
    const user: User = {
      id: firebaseUser.uid,
      name: name,
      email: email,
    };
    
    return user;
  } catch (error: any) {
    console.error("Registration error", error);
    throw new Error(mapAuthError(error.code));
  }
};

// Login with Firebase
export const login = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
    };
  } catch (error: any) {
    console.error("Login error", error);
    throw new Error(mapAuthError(error.code));
  }
};

export const loginAsGuest = (): User => {
  const guestUser: User = { id: 'guest', name: 'Guest User', email: 'guest@local', isGuest: true };
  localStorage.setItem(SESSION_KEY, JSON.stringify(guestUser));
  return guestUser;
};

export const logout = async () => {
  const currentUser = getCurrentUser();
  if (currentUser?.isGuest) {
    localStorage.removeItem(SESSION_KEY);
  } else {
    await signOut(auth);
  }
};

// Helper to get synchronous user for initial render, mostly for Guest
export const getCurrentUser = (): User | null => {
  // Check Guest
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return JSON.parse(stored);
  
  // For Firebase users, we rely on the onAuthStateChanged listener in App.tsx
  // But we can return the current auth object if it's already initialized
  if (auth.currentUser) {
    return {
      id: auth.currentUser.uid,
      name: auth.currentUser.displayName || 'User',
      email: auth.currentUser.email || ''
    };
  }
  return null;
};

// Listen for auth state changes
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || ''
      });
    } else {
      // Check if guest exists
      const guest = localStorage.getItem(SESSION_KEY);
      if (guest) {
        callback(JSON.parse(guest));
      } else {
        callback(null);
      }
    }
  });
};

const mapAuthError = (code: string) => {
  switch (code) {
    case 'auth/email-already-in-use': return 'Email is already in use.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/weak-password': return 'Password should be at least 6 characters.';
    default: return 'Authentication failed. Please try again.';
  }
};