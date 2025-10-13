// IMPORTANT: This file is a work-in-progress and is not fully implemented.
import { NextResponse, type NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { Investment, Property, User } from '@/lib/types';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Helper to get the full path to db.json
const dbPath = path.join(process.cwd(), 'db.json');

// Helper to read the database
const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading from db.json:", error);
    // If the file doesn't exist or is invalid, return a default structure
    return { users: [], balances: {}, investments: [], transactions: [], properties: [] };
  }
};

// Helper to write to the database
const writeDB = (data: any) => {
   try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing to db.json:", error);
  }
};

// Function to get current UTC time from an external service
async function getCurrentTime() {
    try {
        const response = await fetch('http://worldtimeapi.org/api/timezone/Etc/UTC', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Failed to fetch time');
        }
        const data = await response.json();
        return new Date(data.utc_datetime);
    } catch (error) {
        console.error("Could not fetch external time, falling back to server time:", error);
        // Fallback to server time in case the API fails
        return new Date();
    }
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-at-least-32-bytes-long');

async function getUserIdFromSession(): Promise<string | null> {
    const sessionToken = cookies().get('session')?.value;
    if (!sessionToken) {
        return null;
    }
    try {
        const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
        return payload.userId as string;
    } catch (error) {
        console.error("Failed to verify JWT:", error);
        return null;
    }
}


export async function GET(request: NextRequest) {
  const userId = await getUserIdFromSession();

  if (!userId) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const db = readDB();
  
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    // This case might happen if user was deleted but session is still valid
    // We should clear the cookie
    cookies().delete('session');
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  // --- Real-time return calculation ---
  let userBalanceInfo = db.balances[userId] || { amount: 0, lastUpdated: new Date().toISOString() };
  let userInvestments: Investment[] = db.investments.filter((i: any) => i.userId === userId);
  const properties: Property[] = db.properties;

  const now = await getCurrentTime();
  const lastUpdate = new Date(userBalanceInfo.lastUpdated);
  const secondsSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / 1000;
  
  let totalGains = 0;
  
  const updatedInvestments = userInvestments.map(investment => {
    const property = properties.find(p => p.id === investment.propertyId);
    if (!property || property.dailyReturn <= 0) {
      return { ...investment, currentValue: investment.investedAmount };
    }
    
    // This calculates gains from the investment's start date until now
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
  
  // We don't want to send the password to the client
  const { password, ...userSafe } = user;

  const userData = {
    user: userSafe,
    balance: userBalanceInfo.amount,
    investments: updatedInvestments,
    transactions: db.transactions.filter((t: any) => t.userId === userId).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    properties: db.properties
  };

  return NextResponse.json(userData);
}

export async function POST(request: NextRequest) {
    const userId = await getUserIdFromSession();
    if (!userId) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

  const body = await request.json();
  const { action, payload } = body;
  
  if (!action || !payload) {
    return NextResponse.json({ message: 'Action and payload are required' }, { status: 400 });
  }

  const db = readDB();

  const now = await getCurrentTime();
  let userBalance = db.balances[userId] || { amount: 0, lastUpdated: new Date().toISOString() };
  
  // Apply the requested action
  switch(action) {
    case 'invest': {
      const { amount, property, term } = payload;
      if (!amount || !property || !term) {
        return NextResponse.json({ message: 'Missing fields for investment' }, { status: 400 });
      }

      if (userBalance.amount < amount) {
        return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
      }
      
      userBalance.amount -= amount;

      const newInvestment: Omit<Investment, 'currentValue'> = {
        id: `inv-${Date.now()}`,
        userId,
        propertyId: property.id,
        investedAmount: amount,
        ownedShares: amount / property.price * property.totalShares,
        investmentDate: now.toISOString(),
        term,
      };
      db.investments.push(newInvestment);

      const newTransaction = {
        id: newInvestment.id, // Use same ID for consistency
        userId,
        type: 'investment',
        amount,
        description: `Inversión en ${property.name}`,
        date: now.toISOString(),
      };
      db.transactions.push(newTransaction);
      
      break;
    }

    case 'deposit': {
      const { amount } = payload;
      if (!amount) {
        return NextResponse.json({ message: 'Missing fields for deposit' }, { status: 400 });
      }
      userBalance.amount += amount;
       const newTransaction = {
        id: `trans-${Date.now()}`,
        userId,
        type: 'deposit',
        amount,
        description: 'Depósito simulado',
        date: now.toISOString(),
      };
      db.transactions.push(newTransaction);
      break;
    }

    case 'withdraw': {
       const { amount, clabe } = payload;
       if (!amount || !clabe) {
        return NextResponse.json({ message: 'Missing fields for withdrawal' }, { status: 400 });
      }

      if (userBalance.amount < amount) {
        return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
      }

      userBalance.amount -= amount;

      const newTransaction = {
        id: `trans-${Date.now()}`,
        userId,
        type: 'withdraw',
        amount,
        description: `Retiro a CLABE: ...${clabe.slice(-4)}`,
        date: now.toISOString(),
      };
      db.transactions.push(newTransaction);
      break;
    }

    default:
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  }

  userBalance.lastUpdated = now.toISOString();
  db.balances[userId] = userBalance;
  writeDB(db);
  
  // After a successful POST, we return the full updated dataset.
  // This helps SWR's `populateCache` to work correctly.
  const updatedData = await GET(request);
  return updatedData;
}
