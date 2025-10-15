import { NextResponse, type NextRequest } from 'next/server';
import type { Investment, Property, Transaction, User } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';
const CRUD_PASSWORD = process.env.CRUD_PASSWORD || "caballos1212";

// This function now reads the DB via the new CRUD API route
const readDB = async () => {
  const response = await fetch(`${API_URL}/api/crud`, {
    headers: { 'Authorization': CRUD_PASSWORD },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Failed to fetch DB');
  return response.json();
};

// This function now writes the DB via the new CRUD API route
const writeDB = async (data: any) => {
  const response = await fetch(`${API_URL}/api/crud`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': CRUD_PASSWORD
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to write DB');
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

  try {
    const db = await readDB();
    
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let userBalanceInfo = db.balances[userId] || { amount: 0, lastUpdated: new Date().toISOString() };
    const allInvestments: Investment[] = db.investments || [];
    const properties: Property[] = db.properties || [];
    const now = await getCurrentTime();
    
    let currentBalance = userBalanceInfo.amount;
    const activeInvestments: Investment[] = [];
    const investmentsToRemove: string[] = [];

    const userInvestments = allInvestments.filter(inv => inv.userId === userId);

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
            
            // This logic will now be handled by a POST request to avoid changing data on GET
            // We just calculate values for display
            activeInvestments.push({
                ...investment,
                status: 'expired' 
            });

        } else {
            activeInvestments.push(investment);
        }
    }

    // Real-time return calculation for still active investments
    const updatedInvestments = activeInvestments.map(investment => {
      if (investment.status === 'expired') {
          // If expired, we can calculate the final value for display but not alter the balance
           const property = properties.find(p => p.id === investment.propertyId);
            if (!property) return { ...investment, currentValue: investment.investedAmount };
            const investmentDate = new Date(investment.investmentDate);
            const expirationDate = new Date(investmentDate);
            expirationDate.setDate(expirationDate.getDate() + investment.term);
            const secondsElapsedTotal = (expirationDate.getTime() - investmentDate.getTime()) / 1000;
            const gainPerSecond = (investment.investedAmount * property.dailyReturn) / 86400;
            const investmentTotalGains = gainPerSecond * secondsElapsedTotal;
            return {
                ...investment,
                currentValue: investment.investedAmount + investmentTotalGains
            };
      }

      const property = properties.find(p => p.id === investment.propertyId);
      if (!property || property.dailyReturn <= 0) {
        return { ...investment, currentValue: investment.investedAmount };
      }
      
      const investmentDate = new Date(investment.investmentDate);
      const secondsElapsedTotal = (now.getTime() - investmentDate.getTime()) / 1000;
      
      if (secondsElapsedTotal <= 0) {
          return { ...investment, currentValue: investment.investedAmount };
      }

      const gainPerSecond = (investment.investedAmount * property.dailyReturn) / 86400;
      const investmentTotalGains = gainPerSecond * secondsElapsedTotal;
      
      return {
        ...investment,
        currentValue: investment.investedAmount + investmentTotalGains
      };
    });
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userSafe } = user;

    const userData = {
      user: userSafe,
      balance: currentBalance,
      investments: updatedInvestments,
      transactions: (db.transactions || []).filter((t: any) => t.userId === userId).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      properties: db.properties || []
    };

    return NextResponse.json(userData);
  } catch (err) {
      console.error("[GET /api/data] Error:", err);
      return NextResponse.json({ message: "Error fetching user data." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    try {
        const db = await readDB();
        const { action, payload } = await request.json();
        
        const user = db.users.find((u:any) => u.id === userId);
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        switch(action) {
            case 'deposit': {
                const { amount } = payload;
                if (typeof amount !== 'number' || amount <= 0) {
                    return NextResponse.json({ message: "Invalid deposit amount" }, { status: 400 });
                }
                db.balances[userId].amount += amount;

                db.transactions.push({
                    id: `txn-${Date.now()}`,
                    userId,
                    type: 'deposit',
                    amount,
                    description: 'Depósito simulado',
                    date: new Date().toISOString(),
                });
                break;
            }
            case 'withdraw': {
                 const { amount, clabe, accountHolderName } = payload;
                 if (typeof amount !== 'number' || amount <= 0 || !clabe || !accountHolderName) {
                    return NextResponse.json({ message: "Invalid withdrawal payload" }, { status: 400 });
                 }
                 if (db.balances[userId].amount < amount) {
                    return NextResponse.json({ message: "Insufficient funds" }, { status: 400 });
                 }

                 // Create a withdrawal request instead of directly changing the balance
                 db.withdrawalRequests.push({
                    id: `wd-req-${Date.now()}`,
                    userId,
                    amount,
                    clabe,
                    accountHolderName,
                    status: 'pending',
                    date: new Date().toISOString(),
                 });
                 // For now, we'll auto-approve and process for simulation
                 db.balances[userId].amount -= amount;
                 db.transactions.push({
                    id: `txn-${Date.now()}`,
                    userId,
                    type: 'withdraw',
                    amount,
                    description: 'Retiro de fondos',
                    clabe,
                    accountHolderName,
                    date: new Date().toISOString(),
                });
                break;
            }
            case 'invest': {
                const { amount, property, term } = payload;
                if (typeof amount !== 'number' || amount <= 0 || !property || typeof term !== 'number') {
                    return NextResponse.json({ message: "Invalid investment payload" }, { status: 400 });
                }
                if (db.balances[userId].amount < amount) {
                    return NextResponse.json({ message: "Insufficient funds" }, { status: 400 });
                }
                
                db.balances[userId].amount -= amount;

                const sharePrice = property.price / property.totalShares;
                const ownedShares = amount / sharePrice;

                db.investments.push({
                    id: `inv-${Date.now()}`,
                    userId,
                    propertyId: property.id,
                    investedAmount: amount,
                    ownedShares,
                    investmentDate: new Date().toISOString(),
                    term,
                });
                
                db.transactions.push({
                    id: `txn-${Date.now()}`,
                    userId,
                    type: 'investment',
                    amount,
                    description: `Inversión en ${property.name}`,
                    date: new Date().toISOString(),
                });
                break;
            }
            default:
                return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }

        await writeDB(db);
        return NextResponse.json({ success: true, message: "Action completed successfully." });

    } catch (error) {
        console.error("[POST /api/data] Error:", error);
        return NextResponse.json({ message: 'Server error processing request.' }, { status: 500 });
    }
}
