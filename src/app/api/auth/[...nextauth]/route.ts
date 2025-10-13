// This file is intentionally left blank.
// We are using a custom auth implementation.
// To be implemented.
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db.json');

const readDB = () => {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

const writeDB = (data: any) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

export async function POST(request: Request) {
  const { action, payload } = await request.json();

  const db = readDB();

  switch(action) {
    case 'login': {
      const { email, password } = payload;
      const user = db.users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        // In a real app, you'd return a JWT or session token.
        // Here, we return the user object (without password).
        const { password, ...userSafe } = user;
        return NextResponse.json({ user: userSafe });
      }
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    
    case 'register': {
      const { name, email, password } = payload;
       if (db.users.find((u: any) => u.email === email)) {
        return NextResponse.json({ message: 'User already exists' }, { status: 409 });
      }
      const newUser = {
        id: `user-${Date.now()}`,
        publicId: Math.floor(10000 + Math.random() * 90000).toString(),
        name,
        email,
        password, // In a real app, you would hash this password
      };
      db.users.push(newUser);
      db.balances[newUser.id] = 0;
      writeDB(db);

      const { password: _, ...userSafe } = newUser;
      return NextResponse.json({ user: userSafe }, { status: 201 });
    }

    default:
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  }
}
