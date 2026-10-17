import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { User, IUser } from '@/models/User';
import { MOCK_TEAM_MEMBERS } from '@/lib/mock-data';

export async function GET() {
  try {
    await connectToDatabase();
    const members = await User.find({}).sort({ name: 1 }).lean<IUser[]>();
    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ members: MOCK_TEAM_MEMBERS });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, email, team, role = 'Member' } = body;

    if (!name || !email || !team) {
      return NextResponse.json(
        { error: 'Name, email, and team are required fields' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: 'A member with this email already exists' },
        { status: 409 }
      );
    }

    const avatarInitials = name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newMember = await User.create({
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      team,
      role,
      status: 'Active',
      avatarInitials,
    });

    return NextResponse.json({
      success: true,
      member: newMember,
      message: `Member ${newMember.name} added successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add member', details: String(error) },
      { status: 500 }
    );
  }
}
