import { NextResponse, type NextRequest } from 'next/server';
import type { Investment, Property, Transaction, User } from '@/lib/types';
import { readDB, writeDB } from '@/lib/db';

async function getCurrentTime() {
    return new Date();
}

// Function to check and mature investments
async function checkAndMatureInvestments(userId: string, db: any) {
    const now = await getCurrentTime();
    const userInvestments = (db.investments || []).filter((inv: Investment) => inv.userId === userId);
    let balanceUpdated = false;

    const remainingInvestments: Investment[] = [];

    for (const investment of userInvestments) {
        const investmentDate = new Date(investment.investmentDate);
        const expirationDate = new Date(investmentDate);
        expirationDate.setDate(expirationDate.getDate() + investment.term);

        if (now >= expirationDate) {
            const property = db.properties.find((p: Property) => p.id === investment.propertyId);
            if (!property) {
                remainingInvestments.push(investment); // Keep it if property not found
                continue;
            };

            const secondsInTerm = investment.term * 86400;
            const gainPerSecond = (investment.investedAmount * property.dailyReturn) / 86400;
            const totalGains = gainPerSecond * secondsInTerm;
            const finalValue = investment.investedAmount + totalGains;

            if (!db.balances[userId]) {
                db.balances[userId] = { amount: 0, lastUpdated: new Date().toISOString() };
            }
            db.balances[userId].amount += finalValue;
            balanceUpdated = true;

            if (!db.transactions) db.transactions = [];
            db.transactions.push({
                id: `txn-release-${Date.now()}-${investment.id}`,
                userId,
                type: 'investment-release',
                amount: finalValue,
                description: `Liberación de inversión: ${property.name}`,
                date: new Date().toISOString(),
            });
            // This investment is now finished, so it's not added to remainingInvestments
        } else {
            remainingInvestments.push(investment);
        }
    }
    
    // Only write to DB if there was a change
    if (balanceUpdated) {
        const otherUsersInvestments = (db.investments || []).filter((inv: Investment) => inv.userId !== userId);
        db.investments = [...otherUsersInvestments, ...remainingInvestments];
        await writeDB(db);
    }
}


export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const db = await readDB();
    
    // Check and mature investments *before* sending data to the client.
    await checkAndMatureInvestments(userId, db);

    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userBalanceInfo = db.balances[userId] || { amount: 0, lastUpdated: new Date().toISOString() };
    const allInvestments: Investment[] = db.investments || [];
    
    const activeInvestments: Investment[] = allInvestments.filter(inv => inv.userId === userId);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userSafe } = user;

    const userData = {
      user: userSafe,
      balance: userBalanceInfo.amount,
      investments: activeInvestments, // Send raw investments, calculation will happen on client
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
    const { action, payload, userId } = await request.json();

    if (!userId) {
        return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    try {
        const db = await readDB();
        
        const user = db.users.find((u:any) => u.id === userId);
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        switch(action) {
            case 'deposit': {
                const { amount } = payload;
                if (typeof amount !== 'number' || amount <= 0) {
                    return NextResponse.json({ message: "Invalid deposit amount" }, { status: 400 });
                }
                if (!db.balances[userId]) {
                    db.balances[userId] = { amount: 0, lastUpdated: new Date().toISOString() };
                }
                db.balances[userId].amount += amount;

                if (!db.transactions) db.transactions = [];
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
                 if (!db.balances[userId] || db.balances[userId].amount < amount) {
                    return NextResponse.json({ message: "Insufficient funds" }, { status: 400 });
                 }

                 if (!db.withdrawalRequests) db.withdrawalRequests = [];
                 db.withdrawalRequests.push({
                    id: `wd-req-${Date.now()}`,
                    userId,
                    amount,
                    clabe,
                    accountHolderName,
                    status: 'pending',
                    date: new Date().toISOString(),
                 });
                
                // Balance is NOT reduced here. It's reduced on approval.
                break;
            }
            case 'invest': {
                const { amount, property, term } = payload;
                if (typeof amount !== 'number' || amount <= 0 || !property || typeof term !== 'number') {
                    return NextResponse.json({ message: "Invalid investment payload" }, { status: 400 });
                }
                 if (!db.balances[userId] || db.balances[userId].amount < amount) {
                    return NextResponse.json({ message: "Insufficient funds" }, { status: 400 });
                }
                
                db.balances[userId].amount -= amount;

                const sharePrice = property.price / property.totalShares;
                const ownedShares = amount / sharePrice;

                if (!db.investments) db.investments = [];
                db.investments.push({
                    id: `inv-${Date.now()}`,
                    userId,
                    propertyId: property.id,
                    investedAmount: amount,
                    ownedShares,
                    investmentDate: new Date().toISOString(),
                    term,
                });
                
                if (!db.transactions) db.transactions = [];
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
