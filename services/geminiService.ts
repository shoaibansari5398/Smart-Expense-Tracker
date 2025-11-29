import { GoogleGenAI, Type } from "@google/genai";
import { Expense, ExpenseSummary } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const parseExpenseText = async (text: string, referenceDate?: string): Promise<Omit<Expense, 'id' | 'createdAt'>[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  // Use provided date or today
  const dateContext = referenceDate || new Date().toISOString().split('T')[0];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Reference date: ${dateContext}. Extract expenses from the following text: "${text}". 
    If a date is not explicitly mentioned for an item, use the reference date (${dateContext}).
    If relative dates like "yesterday" are used, calculate them based on the reference date.
    Categorize each item logically (e.g., Food, Transport, Utilities, Entertainment, Shopping, Health).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          expenses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING },
                date: { type: Type.STRING, description: "YYYY-MM-DD format" }
              },
              required: ["item", "amount", "category", "date"]
            }
          }
        }
      }
    }
  });

  const json = JSON.parse(response.text || '{"expenses": []}');
  return json.expenses;
};

export const generateInsights = async (expenses: Expense[], summary: ExpenseSummary): Promise<string> => {
  if (!apiKey) return "API Key missing. Unable to generate insights.";
  if (expenses.length === 0) return "No expenses recorded yet. Add some expenses to see insights!";

  // We filter to last 50 items to keep context small but relevant for recent trends
  const recentExpenses = expenses
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50);

  const prompt = `
    Analyze the following expense data and summary statistics.
    
    Summary:
    - Daily Total (Today): ₹${summary.dailyTotal.toFixed(2)}
    - Weekly Total (Last 7 days): ₹${summary.weeklyTotal.toFixed(2)}
    - Monthly Total (Last 30 days): ₹${summary.monthlyTotal.toFixed(2)}
    - Top Categories: ${summary.categoryBreakdown.slice(0, 3).map(c => `${c.name} (${c.percentage.toFixed(1)}%)`).join(', ')}

    Recent Transactions (JSON):
    ${JSON.stringify(recentExpenses.map(e => ({ i: e.item, a: e.amount, c: e.category, d: e.date })))}

    Task:
    Identify spending patterns, unusual spikes, and opportunities to save.
    Be concise, encouraging, and actionable. 
    Format the response using Markdown.
    Focus on specific advice based on the data provided.
    Use Indian Rupee (₹) symbol in your response.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful financial assistant. Keep insights brief (under 150 words) and use bullet points.",
      }
    });

    return response.text || "Could not generate insights at this time.";
  } catch (error) {
    console.error("Insight generation failed", error);
    return "Unable to generate insights due to an error.";
  }
};