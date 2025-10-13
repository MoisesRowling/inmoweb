// IMPORTANT: This file is a work-in-progress and is not fully implemented.
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  
  // We don't want to send the password to the client
  const { password, ...userSafe } = user;

  const userData = {
    user: userSafe,
    balance: db.balances[userId] || 0,
    investments: db.investments.filter((i: any) => i.userId === userId),
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

  switch(action) {
    case 'invest': {
      const { userId, amount, property, term } = payload;
      if (!userId || !amount || !property || !term) {
        return NextResponse.json({ message: 'Missing fields for investment' }, { status: 400 });
      }

      if (db.balances[userId] < amount) {
        return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
      }
      
      db.balances[userId] -= amount;

      const newInvestment = {
        id: `inv-${Date.now()}`,
        userId,
        propertyId: property.id,
        investedAmount: amount,
        ownedShares: amount / property.price * property.totalShares,
        investmentDate: new Date().toISOString(),
        term,
      };
      db.investments.push(newInvestment);

      const newTransaction = {
        id: `trans-${Date.now()}`,
        userId,
        type: 'investment',
        amount,
        description: `Inversión en ${property.name}`,
        date: new Date().toISOString(),
      };
      db.transactions.push(newTransaction);
      
      break;
    }

    case 'deposit': {
      const { userId, amount } = payload;
      if (!userId || !amount) {
        return NextResponse.json({ message: 'Missing fields for deposit' }, { status: 400 });
      }
      db.balances[userId] = (db.balances[userId] || 0) + amount;
       const newTransaction = {
        id: `trans-${Date.now()}`,
        userId,
        type: 'deposit',
        amount,
        description: 'Depósito simulado',
        date: new Date().toISOString(),
      };
      db.transactions.push(newTransaction);
      break;
    }

    case 'withdraw': {
       const { userId, amount, clabe } = payload;
       if (!userId || !amount || !clabe) {
        return NextResponse.json({ message: 'Missing fields for withdrawal' }, { status: 400 });
      }

      if (db.balances[userId] < amount) {
        return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
      }

      db.balances[userId] -= amount;

      const newTransaction = {
        id: `trans-${Date.now()}`,
        userId,
        type: 'withdraw',
        amount,
        description: `Retiro a CLABE: ...${clabe.slice(-4)}`,
        date: new Date().toISOString(),
      };
      db.transactions.push(newTransaction);
      break;
    }

    default:
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  }

  writeDB(db);
  
  // Return the updated state for the specific user
  const user = db.users.find((u: any) => u.id === payload.userId);
  const { password, ...userSafe } = user;

  const userData = {
    user: userSafe,
    balance: db.balances[payload.userId] || 0,
    investments: db.investments.filter((i: any) => i.userId === payload.userId),
    transactions: db.transactions.filter((t: any) => t.userId === payload.userId),
    properties: db.properties
  };


  return NextResponse.json({ message: 'Data updated successfully', data: userData }, { status: 200 });
}
