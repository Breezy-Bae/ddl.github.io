
export const formatIndianCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
};

export const parseIndianCurrency = (formattedAmount: string): number => {
  const cleanAmount = formattedAmount.replace(/[₹,\s]/g, '');
  if (cleanAmount.includes('Cr')) {
    return parseFloat(cleanAmount.replace('Cr', '')) * 10000000;
  } else if (cleanAmount.includes('L')) {
    return parseFloat(cleanAmount.replace('L', '')) * 100000;
  }
  return parseFloat(cleanAmount) || 0;
};
