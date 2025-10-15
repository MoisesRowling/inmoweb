
export type Property = {
  id: string; 
  name: string;
  location: string;
  type: string;
  price: number;
  minInvestment: number;
  totalShares: number;
  image: string; 
  dailyReturn: number;
};

export type Transaction = {
  id: string; 
  userId: string;
  type: 'deposit' | 'withdraw' | 'investment' | 'investment-release';
  amount: number;
  description: string;
  date: string; // Changed from Timestamp
  // Optional fields for withdrawal details
  clabe?: string;
  accountHolderName?: string;
};

export type User = {
  id: string; // Changed from uid to id
  publicId: string;
  name: string;
  email: string;
};

export type UserBalance = {
    amount: number;
    lastUpdated: string; // Changed from Timestamp
}

export type Investment = {
    id: string;
    userId: string;
    propertyId: string;
    investedAmount: number;
    ownedShares: number;
    investmentDate: string; // Changed from Timestamp
    term: number; // in days
    currentValue?: number; // Calculated field for current value
};

export type WithdrawalRequest = {
    id: string;
    userId: string;
    amount: number;
    clabe: string;
    accountHolderName: string;
    date: string; // Changed from Timestamp
    status: 'pending' | 'approved' | 'rejected';
}
