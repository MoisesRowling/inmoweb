import { NextResponse, type NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { Investment, Property, Transaction, User } from '@/lib/types';

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

async function getCurrentTime() {
    return new Date();
}

export async function GET(request: NextRequest) {
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

  let userBalanceInfo = db.balances[userId] || { amount: 0, lastUpdated: new Date().toISOString() };
  let allInvestments: Investment[] = db.investments;
  const properties: Property[] = db.properties;
  const now = await getCurrentTime();
  
  // --- Process Expired Investments ---
  const userInvestments = allInvestments.filter(inv => inv.userId === userId);
  const stillActiveInvestments: Investment[] = [];
  let writeChanges = false;

  for (const investment of userInvestments) {
      const investmentDate = new Date(investment.investmentDate);
      const expirationDate = new Date(investmentDate);
      expirationDate.setDate(expirationDate.getDate() + investment.term);

      if (now >= expirationDate) {
          // Investment expired
          const property = properties.find(p => p.id === investment.propertyId);
          if (!property) continue; // Should not happen

          const secondsElapsedTotal = (expirationDate.getTime() - investmentDate.getTime()) / 1000;
          const gainPerSecond = (investment.investedAmount * property.dailyReturn) / 86400;
          const investmentTotalGains = gainPerSecond * secondsElapsedTotal;
          const finalValue = investment.investedAmount + investmentTotalGains;

          // Add final value to balance
          userBalanceInfo.amount += finalValue;
          
          // Create transaction for released investment
          const releaseTransaction = {
              id: `trans-release-${investment.id}`,
              userId,
              type: 'deposit' as const,
              amount: finalValue,
              description: `Liberación de inversión en ${property.name}`,
              date: now.toISOString(),
          };
          db.transactions.push(releaseTransaction);
          
          writeChanges = true;
      } else {
          // Investment is still active
          stillActiveInvestments.push(investment);
      }
  }

  if (writeChanges) {
    db.investments = allInvestments.filter(inv => {
        const isUserInvestment = inv.userId === userId;
        if (!isUserInvestment) return true; // Keep investments of other users
        // For the current user, only keep investments that are still active
        return stillActiveInvestments.some(activeInv => activeInv.id === inv.id);
    });
    db.balances[userId] = userBalanceInfo;
    writeDB(db);
  }
  // --- End of processing ---


  // --- Real-time return calculation for still active investments ---
  const updatedInvestments = stillActiveInvestments.map(investment => {
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
    balance: userBalanceInfo.amount,
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

    const body = await request.json();
    const { action, payload } = body;
    
    if (!action || !payload) {
        return NextResponse.json({ message: 'Action and payload are required' }, { status: 400 });
    }

    const db = readDB();

    const now = await getCurrentTime();
    let userBalance = db.balances[userId] || { amount: 0, lastUpdated: new Date().toISOString() };
    
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
            id: newInvestment.id,
            userId,
            type: 'investment' as const,
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
            type: 'deposit' as const,
            amount,
            description: 'Depósito simulado',
            date: now.toISOString(),
        };
        db.transactions.push(newTransaction);
        break;
        }

        case 'withdraw': {
            const { amount, clabe, accountHolderName } = payload;
            if (!amount || !clabe || !accountHolderName) {
                return NextResponse.json({ message: 'Missing fields for withdrawal request' }, { status: 400 });
            }

            if (userBalance.amount < amount) {
                return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
            }
            
            const newRequest = {
                id: `req-${Date.now()}`,
                userId,
                amount,
                clabe,
                accountHolderName,
                date: now.toISOString(),
                status: 'pending',
            };
            
            if (!db.withdrawalRequests) {
                db.withdrawalRequests = [];
            }
            db.withdrawalRequests.push(newRequest);
            break;
        }

        default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    userBalance.lastUpdated = now.toISOString();
    db.balances[userId] = userBalance;
    writeDB(db);
    
    // After a successful POST, we can return just a success message
    return NextResponse.json({ success: true, message: `${action} successful.` }, { status: 200 });
}
