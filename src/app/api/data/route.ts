import { NextResponse, type NextRequest } from 'next/server';
import type { Investment, Property, Transaction, User } from '@/lib/types';

const DB_URL = 'https://satdevoluciones.com/db.json';

// Helper to read the database from the remote URL
const readDB = async () => {
  try {
    const response = await fetch(DB_URL, { cache: 'no-store' });
     if (!response.ok) {
        throw new Error(`Failed to fetch db.json: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error reading from remote db.json:", error);
    // If the fetch fails, return a default structure
    return { users: [], balances: {}, investments: [], transactions: [], properties: [] };
  }
};


async function getCurrentTime() {
    return new Date();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  const db = await readDB();
  
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  let userBalanceInfo = db.balances[userId] || { amount: 0, lastUpdated: new Date().toISOString() };
  let allInvestments: Investment[] = db.investments;
  const properties: Property[] = db.properties;
  const now = await getCurrentTime();
  
  // Since we cannot write, we will simulate investment expiration for the response only
  const userInvestments = allInvestments.filter(inv => inv.userId === userId);
  let simulatedBalance = userBalanceInfo.amount;
  const activeInvestmentsForDisplay: Investment[] = [];
  
  for (const investment of userInvestments) {
      const investmentDate = new Date(investment.investmentDate);
      const expirationDate = new Date(investmentDate);
      expirationDate.setDate(expirationDate.getDate() + investment.term);

      if (now >= expirationDate) {
          const property = properties.find(p => p.id === investment.propertyId);
          if (!property) continue;

          const secondsElapsedTotal = (expirationDate.getTime() - investmentDate.getTime()) / 1000;
          const gainPerSecond = (investment.investedAmount * property.dailyReturn) / 86400;
          const investmentTotalGains = gainPerSecond * secondsElapsedTotal;
          const finalValue = investment.investedAmount + investmentTotalGains;
          simulatedBalance += finalValue;
      } else {
          activeInvestmentsForDisplay.push(investment);
      }
  }


  // --- Real-time return calculation for still active investments ---
  const updatedInvestments = activeInvestmentsForDisplay.map(investment => {
    const property = properties.find(p => p.id === investment.propertyId);
    if (!property || property.dailyReturn <= 0) {
      return { ...investment, currentValue: investment.investedAmount };
    }
    
    const investmentDate = new Date(investment.investmentDate);
    const secondsElapsedTotal = (now.getTime() - investmentDate.getTime()) / 1000;
    
    if (secondsElapsedTotal <= 0) {
        return { ...investment, currentValue: investment.investedAmount };
    }

    const gainPerSecond = (investment.investedAmount * property.dailyReturn) / 86400; // 86400 seconds in a day
    const investmentTotalGains = gainPerSecond * secondsElapsedTotal;
    
    return {
      ...investment,
      currentValue: investment.investedAmount + investmentTotalGains
    };
  });
  // --- End of calculation ---
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userSafe } = user;

  const userData = {
    user: userSafe,
    balance: simulatedBalance, // Use the simulated balance
    investments: updatedInvestments,
    transactions: db.transactions.filter((t: any) => t.userId === userId).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    properties: db.properties
  };

  return NextResponse.json(userData);
}

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // Writing to a remote db.json is not possible.
    return NextResponse.json({ message: 'Las operaciones de escritura no están disponibles.' }, { status: 403 });
}
