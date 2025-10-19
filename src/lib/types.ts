

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

export type Commission = {
  beneficiaryId: string;
  amount: number;
  level: number; // 1, 2, or 3
}

export type Transaction = {
  id: string; 
  userId: string;
  type: 'deposit' | 'withdraw' | 'investment' | 'investment-release' | 'withdraw-request' | 'investment-refund' | 'commission';
  amount: number;
  description: string;
  date: string;
  // Optional fields for withdrawal details
  clabe?: string;
  accountHolderName?: string;
  // Optional field for commission details
  sourceInvestmentId?: string;
};

export type User = {
  id: string;
  publicId: string;
  name: string;
  email: string;
  password?: string; // Password should not be sent to client
  referralCode: string;
  referredBy?: string; // ID of the user who referred this one
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
    commissions?: Commission[];
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
