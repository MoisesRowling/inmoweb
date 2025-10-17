

import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { password, action, payload } = await request.json();
    const db = await readDB();

    if (password !== db.admin.password) {
      return NextResponse.json({ message: 'Contraseña incorrecta.' }, { status: 401 });
    }
    
    switch(action) {
        case 'read':
            return NextResponse.json(db);

        case 'write_all':
            if (!payload) {
                return NextResponse.json({ message: 'No se proporcionaron datos para escribir.' }, { status: 400 });
            }
            await writeDB(payload);
            return NextResponse.json({ message: 'Base de datos actualizada correctamente.' });

        case 'update_user': {
            const userIndex = db.users.findIndex((u: any) => u.id === payload.id);
            if (userIndex === -1) {
                return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
            }
            db.users[userIndex] = { ...db.users[userIndex], ...payload };
            await writeDB(db);
            return NextResponse.json({ message: 'Usuario actualizado.' });
        }
        
        case 'approve_withdrawal': {
            const reqIndex = db.withdrawalRequests.findIndex((wr: any) => wr.id === payload.id);
            if (reqIndex === -1) {
                return NextResponse.json({ message: 'Solicitud no encontrada.' }, { status: 404 });
            }
            const withdrawalRequest = db.withdrawalRequests[reqIndex];
            if (withdrawalRequest.status !== 'pending') {
                return NextResponse.json({ message: 'La solicitud ya ha sido procesada.' }, { status: 400 });
            }
            
            const userBalance = db.balances[withdrawalRequest.userId];
            if (!userBalance || userBalance.amount < withdrawalRequest.amount) {
                db.withdrawalRequests[reqIndex].status = 'rejected';
                await writeDB(db);
                return NextResponse.json({ message: 'Fondos insuficientes. Solicitud rechazada automáticamente.' }, { status: 400 });
            }
            
            // Process the withdrawal
            userBalance.amount -= withdrawalRequest.amount;
            db.withdrawalRequests[reqIndex].status = 'approved';

            if (!db.transactions) db.transactions = [];
            db.transactions.push({
                id: `txn-${Date.now()}`,
                userId: withdrawalRequest.userId,
                type: 'withdraw',
                amount: withdrawalRequest.amount,
                description: 'Retiro aprobado y procesado exitosamente',
                clabe: withdrawalRequest.clabe,
                accountHolderName: withdrawalRequest.accountHolderName,
                date: new Date().toISOString(),
            });
            
            await writeDB(db);
            return NextResponse.json({ message: 'Solicitud aprobada y procesada.' });
        }
        
        case 'reject_withdrawal': {
             const reqIndex = db.withdrawalRequests.findIndex((wr: any) => wr.id === payload.id);
            if (reqIndex === -1) {
                return NextResponse.json({ message: 'Solicitud no encontrada.' }, { status: 404 });
            }
             if (db.withdrawalRequests[reqIndex].status !== 'pending') {
                return NextResponse.json({ message: 'La solicitud ya ha sido procesada.' }, { status: 400 });
            }
            db.withdrawalRequests[reqIndex].status = 'rejected';
            
            // No need to refund, balance was never debited
            await writeDB(db);
            return NextResponse.json({ message: 'Solicitud rechazada.' });
        }
        
        case 'deposit_to_user': {
            const { publicId, amount } = payload;
            if (!publicId || !amount || amount <= 0) {
                 return NextResponse.json({ message: 'ID de usuario y cantidad son requeridos.' }, { status: 400 });
            }
            const user = db.users.find((u: any) => u.publicId === publicId);
            if (!user) {
                return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
            }

            if (!db.balances[user.id]) {
                db.balances[user.id] = { amount: 0, lastUpdated: new Date().toISOString() };
            }
            db.balances[user.id].amount += amount;

            if (!db.transactions) db.transactions = [];
            db.transactions.push({
                id: `txn-${Date.now()}`,
                userId: user.id,
                type: 'deposit',
                amount,
                description: 'Depósito realizado con éxito',
                date: new Date().toISOString(),
            });

            await writeDB(db);
            return NextResponse.json({ message: `Depósito de ${amount} realizado a ${user.name}.` });
        }
        
        case 'withdraw_from_user': {
            const { publicId, amount } = payload;
            if (!publicId || !amount || amount <= 0) {
                 return NextResponse.json({ message: 'ID de usuario y cantidad son requeridos.' }, { status: 400 });
            }
            const user = db.users.find((u: any) => u.publicId === publicId);
            if (!user) {
                return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
            }

            if (!db.balances[user.id] || db.balances[user.id].amount < amount) {
                return NextResponse.json({ message: 'Fondos insuficientes en la cuenta del usuario.' }, { status: 400 });
            }
            
            db.balances[user.id].amount -= amount;

            if (!db.transactions) db.transactions = [];
            db.transactions.push({
                id: `txn-${Date.now()}`,
                userId: user.id,
                type: 'withdraw',
                amount,
                description: 'Retiro realizado con éxito',
                date: new Date().toISOString(),
            });

            await writeDB(db);
            return NextResponse.json({ message: `Retiro de ${amount} realizado a ${user.name}.` });
        }

        case 'delete_transaction': {
            const { transactionId } = payload;
            if (!transactionId) {
                return NextResponse.json({ message: 'ID de transacción es requerido.' }, { status: 400 });
            }
            const initialLength = db.transactions.length;
            db.transactions = db.transactions.filter((t: any) => t.id !== transactionId);

            if (db.transactions.length === initialLength) {
                return NextResponse.json({ message: 'Transacción no encontrada.' }, { status: 404 });
            }
            
            await writeDB(db);
            return NextResponse.json({ message: 'Transacción eliminada correctamente.' });
        }

        case 'delete_investment': {
            const { investmentId } = payload;
            if (!investmentId) {
                return NextResponse.json({ message: 'ID de inversión es requerido.' }, { status: 400 });
            }
            const investmentIndex = db.investments.findIndex((i: any) => i.id === investmentId);
            if (investmentIndex === -1) {
                return NextResponse.json({ message: 'Inversión no encontrada.' }, { status: 404 });
            }
            
            const investment = db.investments[investmentIndex];
            const user = db.users.find((u: any) => u.id === investment.userId);
            if (!user) {
                return NextResponse.json({ message: 'Usuario de la inversión no encontrado.' }, { status: 404 });
            }

            // Refund the invested amount
            if (db.balances[investment.userId]) {
                db.balances[investment.userId].amount += investment.investedAmount;
            } else {
                 return NextResponse.json({ message: 'Balance del usuario no encontrado.' }, { status: 404 });
            }

            // Create a refund transaction
            if (!db.transactions) db.transactions = [];
            db.transactions.push({
                id: `txn-refund-${Date.now()}`,
                userId: investment.userId,
                type: 'investment-refund',
                amount: investment.investedAmount,
                description: `Reembolso de inversión (ID: ${investment.id})`,
                date: new Date().toISOString(),
            });

            // Remove the investment
            db.investments.splice(investmentIndex, 1);
            
            await writeDB(db);
            return NextResponse.json({ message: 'Inversión deshecha. El monto ha sido reembolsado al usuario.' });
        }

        default:
            return NextResponse.json({ message: 'Acción no válida.' }, { status: 400 });
    }

  } catch (error) {
    console.error('[CRUD_API_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor.' }, { status: 500 });
  }
}
