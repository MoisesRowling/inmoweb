import type { Timestamp } from 'firebase/firestore';

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
  date: Timestamp; 
  // Optional fields for withdrawal details
  clabe?: string;
  accountHolderName?: string;
};

export type User = {
  uid: string; // Firebase Auth UID
  publicId: string; // This is the 5-digit user-facing ID
  name: string;
  email: string;
};

export type UserBalance = {
    amount: number;
    lastUpdated: Timestamp;
}

export type Investment = {
    id: string;
    userId: string;
    propertyId: string;
    investedAmount: number;
    ownedShares: number;
    investmentDate: Timestamp; 
    term: number; // in days
    status: 'active' | 'released';
    expirationDate: Timestamp;
    currentValue?: number; // Calculated field for current value
};

export type WithdrawalRequest = {
    id: string;
    userId: string;
    amount: number;
    clabe: string;
    accountHolderName: string;
    date: Timestamp;
    status: 'pending' | 'approved' | 'rejected';
}
