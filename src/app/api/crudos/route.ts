
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
    const { password, action, data } = await request.json();
    const secret = getCrudSecretKey();

    if (password !== secret) {
      return NextResponse.json({ message: 'Contraseña incorrecta.' }, { status: 401 });
    }

    if (action === 'read') {
      const dbData = await readDB();
      return NextResponse.json(dbData);
    }

    if (action === 'write') {
      if (!data) {
        return NextResponse.json({ message: 'No se proporcionaron datos para escribir.' }, { status: 400 });
      }
      await writeDB(data);
      return NextResponse.json({ message: 'Base de datos actualizada correctamente.' });
    }

    return NextResponse.json({ message: 'Acción no válida.' }, { status: 400 });

  } catch (error) {
    console.error('[CRUD_API_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor.' }, { status: 500 });
  }
}
