/**
 * Currency formatting utility
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (err) {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

/**
 * Date formatting utility
 */
export function formatDate(dateString: string | Date, format: 'short' | 'long' = 'short'): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (format === 'short') {
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } else {
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    }
  } catch (err) {
    return String(dateString);
  }
}

/**
 * Time formatting utility
 */
export function formatTime(dateString: string | Date): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    return String(dateString);
  }
}

/**
 * Relative time formatting (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | Date): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsAgo < 60) {
      return 'Just now';
    }
    if (secondsAgo < 3600) {
      const minutes = Math.floor(secondsAgo / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (secondsAgo < 86400) {
      const hours = Math.floor(secondsAgo / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (secondsAgo < 604800) {
      const days = Math.floor(secondsAgo / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    return formatDate(date, 'short');
  } catch (err) {
    return String(dateString);
  }
}

/**
 * Number formatting with abbreviations (e.g., 1.5K, 2.3M)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Percentage formatting
 */
export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`;
}

/**
 * Status badge formatting
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border?: string;
} {
  const statusMap: Record<string, { bg: string; text: string; border?: string }> = {
    // Generic statuses
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
    
    // Transaction statuses
    successful: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    reversed: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    
    // Delivery statuses
    shipped: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    
    // Adoption statuses
    active: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    expired: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    
    // Payment statuses
    paid: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    unpaid: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    overdue: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    
    // Wallet statuses
    verified: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    unverified: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  };

  const lowerStatus = status.toLowerCase();
  return statusMap[lowerStatus] || { bg: 'bg-gray-100', text: 'text-gray-800' };
}
