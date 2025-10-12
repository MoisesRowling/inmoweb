export type Property = {
  id: number;
  name: string;
  location: string;
  type: string;
  price: number;
  minInvestment: number;
  invested: number;
  initialInvestment: number; // Keep track of the original invested amount
  totalShares: number;
  ownedShares: number;
  image: string; // This will be the placeholder image id
  dailyReturn: number;
};

export type Transaction = {
  id: number;
  type: 'deposit' | 'withdraw' | 'investment';
  amount: number;
  description: string;
  date: string; // ISO string
  timestamp: string; // Localized string
};

export type User = {
  id: string;
  name: string;
  email: string;
};
