import { Expense } from '../types';

export const exportExpensesToCSV = (expenses: Expense[]) => {
  if (expenses.length === 0) return;

  const headers = ['Date', 'Item', 'Category', 'Amount (INR)'];
  const csvRows = [headers.join(',')];

  // Sort by date descending
  const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const row of sorted) {
    const values = [
      `"${row.date}"`,
      `"${row.item.replace(/"/g, '""')}"`, // Escape quotes
      `"${row.category}"`,
      row.amount.toFixed(2),
    ];
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
