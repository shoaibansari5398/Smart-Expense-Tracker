import React, { useState, useEffect, useRef } from 'react';
import { parseExpenseText } from '../services/geminiService';
import { Expense } from '../types';
import { Button } from './ui/Button';

interface ExpenseFormProps {
  onAddExpenses: (newExpenses: Omit<Expense, 'id' | 'createdAt'>[]) => void;
  onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpenses, onCancel }) => {
  const [inputText, setInputText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition if supported
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setIsSpeechSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript + ' ';
          }
        }
        setInputText(prev => {
          const separator = prev && !prev.endsWith(' ') ? ' ' : '';
          return prev + separator + newTranscript;
        });
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError("Microphone access denied. Please allow microphone permissions.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        console.error("Failed to start speech recognition", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const expenses = await parseExpenseText(inputText, selectedDate);
      if (expenses.length > 0) {
        onAddExpenses(expenses);
        setInputText('');
      } else {
        setError("Could not identify any expenses. Please try a different format.");
      }
    } catch (err) {
      setError("Failed to process expenses. Please check your API key or connection.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSample = () => {
    setInputText("Lunch at Cafe ₹250, Uber to work ₹180, Groceries ₹450, Coffee ₹80");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-900/40 rounded-2xl shadow-xl border border-slate-800 p-6 md:p-8 backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Log Expenses</h2>
        <p className="text-slate-400 mb-6">Describe your spending in natural language or use voice input. The AI will categorize it automatically.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full md:w-auto p-2.5 rounded-lg border border-slate-700 bg-slate-950/50 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-500"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="mb-4 relative">
            <textarea
              className="w-full p-4 pr-12 rounded-xl border border-slate-700 bg-slate-950/50 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-500 min-h-[150px] resize-none text-lg"
              placeholder="e.g., Breakfast ₹120, Taxi ₹150, Monthly Netflix subscription ₹499"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing}
            />
            {isSpeechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-3 top-3 p-2 rounded-full transition-all ${
                  isListening
                    ? 'bg-red-500/10 text-red-500 animate-pulse ring-2 ring-red-500/20'
                    : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'
                }`}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {isListening && (
              <span className="absolute right-12 top-4 text-xs font-medium text-red-400 animate-pulse">
                Listening...
              </span>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSample}
              disabled={isProcessing}
              className="text-slate-400 hover:text-emerald-400"
            >
              Try sample text
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
              >
                Back to Dashboard
              </Button>
              <Button
                type="submit"
                disabled={isProcessing || !inputText.trim()}
                className={`bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 ${
                  (isProcessing || !inputText.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Process Expenses'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
          <h3 className="font-semibold text-emerald-400 mb-1">Smart Parsing</h3>
          <p className="text-emerald-500/80 text-sm">Simply list your items. The AI automatically identifies the item name, amount, and assigns a category.</p>
        </div>
        <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
          <h3 className="font-semibold text-blue-400 mb-1">Date Handling</h3>
          <p className="text-blue-500/80 text-sm">Select a specific date above, or use terms like "Yesterday" in the text to override.</p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
