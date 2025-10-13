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
  
  // User-specific investment data (denormalized or from a separate investment document)
  invested?: number;
  initialInvestment?: number;
  ownedShares?: number;
  investmentTerm?: number;
};

export type Transaction = {
  id: string; 
  userId: string;
  type: 'deposit' | 'withdraw' | 'investment';
  amount: number;
  description: string;
  date: string; // ISO string
};

export type User = {
  id: string; // Simulated user ID
  publicId: string; // This is the 5-digit user-facing ID
  name: string;
  email: string;
};

export type Investment = {
    id: string;
    userId: string;
    propertyId: string;
    investedAmount: number;
    ownedShares: number;
    investmentDate: string; // ISO String
    term: number; // in days
};
