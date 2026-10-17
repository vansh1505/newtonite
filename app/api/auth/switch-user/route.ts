import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db/mongodb';
import { User, IUser } from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find({}).sort({ role: 1 }).lean<IUser[]>();
    return NextResponse.json({ users });
  } catch {
    // Return default available operators if DB is not yet running
    const defaultUsers = [
      { id: 'usr-1', name: 'Alex Rivera', role: 'Admin', team: 'Platform Ops' },
      { id: 'usr-2', name: 'Sarah Chen', role: 'Manager', team: 'Customer Support Ops' },
      { id: 'usr-3', name: 'Elena Rostova', role: 'Manager', team: 'Security & Compliance' },
      { id: 'usr-4', name: 'Marcus Vance', role: 'Member', team: 'Infrastructure' },
    ];
    return NextResponse.json({ users: defaultUsers });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set('ops_user_id', userId, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      activeUserId: userId,
      message: `Active operator switched to ${userId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to switch user', details: String(error) },
      { status: 500 }
    );
  }
}
