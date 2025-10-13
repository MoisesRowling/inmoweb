// IMPORTANT: This file is a work-in-progress and is not fully implemented.
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { Investment, Property } from '@/lib/types';

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
        const response = await fetch('http://worldtimeapi.org/api/timezone/Etc/UTC');
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


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  const db = readDB();
  
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  // --- Real-time return calculation ---
  const now = await getCurrentTime();
  const userBalance = db.balances[userId] || { amount: 0, lastUpdated: now.toISOString() };
  const lastUpdated = new Date(userBalance.lastUpdated);
  const secondsElapsed = (now.getTime() - lastUpdated.getTime()) / 1000;

  let totalGains = 0;
  const userInvestments: Investment[] = db.investments.filter((i: any) => i.userId === userId);
  const properties: Property[] = db.properties;

  if (secondsElapsed > 0 && userInvestments.length > 0) {
    userInvestments.forEach(investment => {
      const property = properties.find(p => p.id === investment.propertyId);
      if (property && property.dailyReturn > 0) {
        const dailyReturn = property.dailyReturn; // e.g., 0.1 for 10%
        const gainPerSecond = (investment.investedAmount * dailyReturn) / 86400; // 86400 seconds in a day
        totalGains += gainPerSecond * secondsElapsed;
      }
    });
  }
  
  if (totalGains > 0) {
    userBalance.amount += totalGains;
    userBalance.lastUpdated = now.toISOString();
    db.balances[userId] = userBalance;
    writeDB(db);
  }
  // --- End of calculation ---
  
  // We don't want to send the password to the client
  const { password, ...userSafe } = user;

  const userData = {
    user: userSafe,
    balance: userBalance.amount,
    investments: userInvestments,
    transactions: db.transactions.filter((t: any) => t.userId === userId),
    properties: db.properties
  };

  return NextResponse.json(userData);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, payload } = body;
  
  if (!action || !payload) {
    return NextResponse.json({ message: 'Action and payload are required' }, { status: 400 });
  }

  const db = readDB();
  const { userId } = payload;

  // Before any modification, update gains to have the most current balance
  const now = await getCurrentTime();
  let userBalance = db.balances[userId] || { amount: 0, lastUpdated: now.toISOString() };
  
  const lastUpdated = new Date(userBalance.lastUpdated);
  const secondsElapsed = (now.getTime() - lastUpdated.getTime()) / 1000;
  
  if (secondsElapsed > 0) {
      let totalGains = 0;
      const userInvestments: Investment[] = db.investments.filter((i: any) => i.userId === userId);
      const properties: Property[] = db.properties;

      userInvestments.forEach(investment => {
          const property = properties.find(p => p.id === investment.propertyId);
          if (property && property.dailyReturn > 0) {
              const dailyReturn = property.dailyReturn;
              const gainPerSecond = (investment.investedAmount * dailyReturn) / 86400;
              totalGains += gainPerSecond * secondsElapsed;
          }
      });
      userBalance.amount += totalGains;
  }
  
  // Now, apply the requested action
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

      const newInvestment = {
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
        id: `trans-${Date.now()}`,
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

  // Update balance and timestamp after action
  userBalance.lastUpdated = now.toISOString();
  db.balances[userId] = userBalance;
  writeDB(db);
  
  // Return the updated state for the specific user
  const user = db.users.find((u: any) => u.id === payload.userId);
  const { password, ...userSafe } = user;

  const userData = {
    user: userSafe,
    balance: db.balances[payload.userId]?.amount || 0,
    investments: db.investments.filter((i: any) => i.userId === payload.userId),
    transactions: db.transactions.filter((t: any) => t.userId === payload.userId),
    properties: db.properties
  };


  return NextResponse.json({ message: 'Data updated successfully', data: userData }, { status: 200 });
}
