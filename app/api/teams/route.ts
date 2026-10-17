import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { Team, ITeam } from '@/models/Team';
import { WorkItem } from '@/models/WorkItem';
import { MOCK_TEAMS } from '@/lib/mock-data';

export async function GET() {
  try {
    await connectToDatabase();
    const teams = await Team.find({}).lean<ITeam[]>();

    // Dynamically update open items count for each team
    const enrichedTeams = await Promise.all(
      teams.map(async (t) => {
        const count = await WorkItem.countDocuments({
          team: t.name,
          status: { $in: ['open', 'in_progress', 'awaiting_approval', 'blocked'] },
        });
        return {
          ...t,
          openItemsCount: count,
        };
      })
    );

    return NextResponse.json({ teams: enrichedTeams });
  } catch {
    return NextResponse.json({ teams: MOCK_TEAMS });
  }
}
