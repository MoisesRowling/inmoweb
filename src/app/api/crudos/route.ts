

import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

const getCrudSecretKey = () => {
    const secret = process.env.CRUD_SECRET_KEY;
    if (!secret) {
        throw new Error('La variable de entorno CRUD_SECRET_KEY no está configurada.');
    }
    return secret;
};

export async function POST(request: Request) {
  try {
    const { password, action, payload } = await request.json();
    const secret = getCrudSecretKey();

    if (password !== secret) {
      return NextResponse.json({ message: 'Contraseña incorrecta.' }, { status: 401 });
    }
    
    const db = await readDB();

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
            if (db.withdrawalRequests[reqIndex].status !== 'pending') {
                return NextResponse.json({ message: 'La solicitud ya ha sido procesada.' }, { status: 400 });
            }
            db.withdrawalRequests[reqIndex].status = 'approved';
            
            await writeDB(db);
            return NextResponse.json({ message: 'Solicitud aprobada.' });
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

            // Refund the amount to the user's balance
            const request = db.withdrawalRequests[reqIndex];
            if (db.balances[request.userId]) {
                db.balances[request.userId].amount += request.amount;
            }
            
            await writeDB(db);
            return NextResponse.json({ message: 'Solicitud rechazada y fondos devueltos.' });
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
                description: 'Depósito manual de administrador',
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
                description: 'Retiro manual de administrador',
                date: new Date().toISOString(),
            });

            await writeDB(db);
            return NextResponse.json({ message: `Retiro de ${amount} realizado a ${user.name}.` });
        }

        default:
            return NextResponse.json({ message: 'Acción no válida.' }, { status: 400 });
    }

  } catch (error) {
    console.error('[CRUD_API_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor.' }, { status: 500 });
  }
}
