'use server';

import { NextResponse, type NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db.json');
const CRUD_PASSWORD = process.env.CRUD_PASSWORD || "caballos1212";

const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading from db.json:", error);
    return { users: [], balances: {}, investments: [], transactions: [], properties: [], withdrawalRequests: [] };
  }
};

const writeDB = (data: any) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing to db.json:", error);
  }
};

async function authorizeRequest(request: NextRequest): Promise<boolean> {
    const password = request.headers.get('Authorization');
    return password === CRUD_PASSWORD;
}

export async function GET(request: NextRequest) {
    if (!(await authorizeRequest(request))) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const db = readDB();
    return NextResponse.json(db);
}


export async function POST(request: NextRequest) {
    if (!(await authorizeRequest(request))) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, payload } = body;
    
    if (!action || !payload) {
        return NextResponse.json({ message: 'Action and payload are required' }, { status: 400 });
    }

    let db = readDB();

    try {
        switch(action) {
            case 'updateUser': {
                const { userId, newName } = payload;
                const userIndex = db.users.findIndex((u: any) => u.id === userId);
                if (userIndex === -1) throw new Error('User not found');
                db.users[userIndex].name = newName;
                break;
            }

            case 'updateBalance': {
                const { userId, newBalance } = payload;
                if (!db.balances[userId]) throw new Error('Balance info not found for user');
                db.balances[userId].amount = parseFloat(newBalance);
                db.balances[userId].lastUpdated = new Date().toISOString();
                break;
            }
            
            case 'deleteUser': {
                const { userId } = payload;
                db.users = db.users.filter((u: any) => u.id !== userId);
                delete db.balances[userId];
                db.investments = db.investments.filter((inv: any) => inv.userId !== userId);
                db.transactions = db.transactions.filter((t: any) => t.userId !== userId);
                break;
            }
            
            case 'deleteTransaction': {
                const { transactionId } = payload;
                db.transactions = db.transactions.filter((t: any) => t.id !== transactionId);
                break;
            }

            case 'deleteInvestment': {
                const { investmentId, userId } = payload;
                const investmentIndex = db.investments.findIndex((inv: any) => inv.id === investmentId);
                if (investmentIndex === -1) throw new Error('Investment not found');
                
                const investment = db.investments[investmentIndex];
                const investedAmount = investment.investedAmount;

                // Return funds to user
                if (!db.balances[userId]) throw new Error('User balance not found');
                db.balances[userId].amount += investedAmount;
                db.balances[userId].lastUpdated = new Date().toISOString();

                // Create a refund transaction
                const property = db.properties.find((p: any) => p.id === investment.propertyId);
                const refundTransaction = {
                    id: `trans-refund-${Date.now()}`,
                    userId,
                    type: 'deposit' as const,
                    amount: investedAmount,
                    description: `Reembolso por inversión cancelada en ${property?.name || 'N/A'}`,
                    date: new Date().toISOString(),
                };
                db.transactions.push(refundTransaction);

                // Remove investment
                db.investments.splice(investmentIndex, 1);
                
                break;
            }
            
            case 'addTransaction': {
                const { userId, type, amount, description } = payload;
                if (!userId || !type || !amount || !description) {
                    throw new Error('Missing fields for transaction');
                }
                const parsedAmount = parseFloat(amount);
                if (isNaN(parsedAmount)) throw new Error('Invalid amount');

                if (!db.balances[userId]) throw new Error('User balance not found');

                // Create transaction
                 const newTransaction = {
                    id: `trans-${Date.now()}`,
                    userId,
                    type,
                    amount: parsedAmount,
                    description,
                    date: new Date().toISOString(),
                };
                db.transactions.push(newTransaction);
                
                // Update balance
                if (type === 'deposit') {
                    db.balances[userId].amount += parsedAmount;
                } else if (type === 'withdraw') {
                    if (db.balances[userId].amount < parsedAmount) {
                        throw new Error('Insufficient funds for withdrawal');
                    }
                    db.balances[userId].amount -= parsedAmount;
                }
                db.balances[userId].lastUpdated = new Date().toISOString();
                break;
            }

            case 'approveWithdrawal': {
                const { requestId } = payload;
                const requestIndex = db.withdrawalRequests.findIndex((req: any) => req.id === requestId);
                if (requestIndex === -1) throw new Error('Withdrawal request not found');

                const request = db.withdrawalRequests[requestIndex];
                
                if (!db.balances[request.userId]) throw new Error('User balance not found');
                if (db.balances[request.userId].amount < request.amount) throw new Error('Insufficient funds to approve withdrawal');

                // Process withdrawal
                db.balances[request.userId].amount -= request.amount;

                // Create transaction
                const newTransaction = {
                    id: `trans-${Date.now()}`,
                    userId: request.userId,
                    type: 'withdraw' as const,
                    amount: request.amount,
                    description: 'Retiro procesado con éxito',
                    date: new Date().toISOString(),
                    clabe: request.clabe,
                    accountHolderName: request.accountHolderName,
                };
                db.transactions.push(newTransaction);

                // Remove request from pending list
                db.withdrawalRequests.splice(requestIndex, 1);

                break;
            }

            default:
                return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }
        
        writeDB(db);
        return NextResponse.json({ success: true, message: `${action} successful.` }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'An internal error occurred' }, { status: 500 });
    }
}
