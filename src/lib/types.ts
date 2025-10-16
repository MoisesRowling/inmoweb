

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
  date: string;
  // Optional fields for withdrawal details
  clabe?: string;
  accountHolderName?: string;
};

export type User = {
  id: string;
  publicId: string;
  name: string;
  email: string;
  password?: string; // Password should not be sent to client
};

export type UserBalance = {
    amount: number;
    lastUpdated: string;
}

export type Investment = {
    id: string;
    userId: string;
    propertyId: string;
    investedAmount: number;
    ownedShares: number;
    investmentDate: string;
    term: number; // in days
    currentValue?: number; // Calculated field for current value
    status?: 'active' | 'expired'; // Calculated field
};

export type WithdrawalRequest = {
    id: string;
    userId: string;
    amount: number;
    clabe: string;
    accountHolderName: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
}
