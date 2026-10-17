import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db/mongodb';
import { User, IUser } from '@/models/User';
import { verifyPassword } from '@/lib/auth/password';
import { MOCK_TEAM_MEMBERS } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    let authenticatedUser: {
      id: string;
      name: string;
      email: string;
      role: 'Admin' | 'Manager' | 'Member';
      team: string;
    } | null = null;

    try {
      await connectToDatabase();
      const dbUser = await User.findOne({ email: normalizedEmail }).lean<IUser>();

      if (dbUser) {
        const isMatch = verifyPassword(password, dbUser.password || 'password123');
        if (!isMatch) {
          return NextResponse.json(
            { error: 'Invalid password. (Default seed password is: password123)' },
            { status: 401 }
          );
        }
        authenticatedUser = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          team: dbUser.team,
        };
      }
    } catch {
      // Database offline fallback check against mock members
    }

    // Fallback against mock demo credentials if DB user not found or DB offline
    if (!authenticatedUser) {
      const mockUser = MOCK_TEAM_MEMBERS.find(
        (m) => m.email.toLowerCase() === normalizedEmail
      );
      if (mockUser) {
        if (password !== 'password123' && password.length < 6) {
          return NextResponse.json(
            { error: 'Invalid password. (Default password: password123)' },
            { status: 401 }
          );
        }
        authenticatedUser = {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          team: mockUser.team,
        };
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: `No operator account found with email "${normalizedEmail}"` },
        { status: 401 }
      );
    }

    // Set active session cookie
    const cookieStore = await cookies();
    cookieStore.set('ops_user_id', authenticatedUser.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: authenticatedUser,
      message: `Signed in as ${authenticatedUser.name}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed', details: String(error) },
      { status: 500 }
    );
  }
}
