import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { ApprovalRequest, IApprovalRequest } from '@/models/ApprovalRequest';
import { MOCK_APPROVALS } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  try {
    await connectToDatabase();
    const query = status === 'all' ? {} : { status: status as 'pending' | 'approved' | 'rejected' };
    const approvals = await ApprovalRequest.find(query).sort({ createdAt: -1 }).lean<IApprovalRequest[]>();

    return NextResponse.json({ approvals });
  } catch {
    let mock = [...MOCK_APPROVALS];
    if (status !== 'all') {
      mock = mock.filter((a) => a.status === status);
    }
    return NextResponse.json({ approvals: mock });
  }
}
