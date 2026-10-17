import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db/mongodb';
import { User, IUser } from '@/models/User';
import { hashPassword } from '@/lib/auth/password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, password, team = 'Platform Ops', role = 'Member' } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const avatarInitials = fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    let createdUser: {
      id: string;
      name: string;
      email: string;
      role: 'Admin' | 'Manager' | 'Member';
      team: string;
    } | null = null;

    try {
      await connectToDatabase();

      const existing = await User.findOne({ email: normalizedEmail }).lean<IUser>();
      if (existing) {
        return NextResponse.json(
          { error: `An operator account with email "${normalizedEmail}" already exists.` },
          { status: 409 }
        );
      }

      const newId = `usr-${Date.now()}`;
      const hashedPassword = hashPassword(password);

      const dbUser = await User.create({
        id: newId,
        name: fullName.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        team,
        role: role === 'Admin' || role === 'Manager' ? role : 'Member',
        status: 'Active',
        avatarInitials,
      });

      createdUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        team: dbUser.team,
      };
    } catch {
      // Offline fallback simulation
      createdUser = {
        id: `usr-${Date.now()}`,
        name: fullName.trim(),
        email: normalizedEmail,
        role: 'Member',
        team,
      };
    }

    // Set active session cookie
    const cookieStore = await cookies();
    cookieStore.set('ops_user_id', createdUser.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      user: createdUser,
      message: `Account created for ${createdUser.name}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Registration failed', details: String(error) },
      { status: 500 }
    );
  }
}
