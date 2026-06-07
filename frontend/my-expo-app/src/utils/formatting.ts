export const formatting = {
  // Format date to readable string
  formatDate: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Format time to readable string
  formatTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Format currency
  formatCurrency: (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  },

  // Format percentage
  formatPercentage: (value: number): string => {
    return `${(value * 100).toFixed(0)}%`;
  },

  // Truncate string
  truncate: (text: string, length: number): string => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },

  // Capitalize first letter
  capitalize: (text: string): string => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  },
};
