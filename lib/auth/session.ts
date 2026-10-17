import { cookies, headers } from 'next/headers';
import connectToDatabase from '@/lib/db/mongodb';
import { User, IUser, UserRole } from '@/models/User';

export interface AuthContext {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team: string;
}

// Fallback user for tests or fallback scenarios
export const DEFAULT_USER: AuthContext = {
  id: 'usr-1',
  name: 'Alex Rivera',
  email: 'alex.rivera@newtonite.internal',
  role: 'Admin',
  team: 'Platform Ops',
};

const STATIC_DEMO_IDENTITIES: Record<string, AuthContext> = {
  'usr-1': {
    id: 'usr-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@newtonite.internal',
    role: 'Admin',
    team: 'Platform Ops',
  },
  'usr-2': {
    id: 'usr-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@newtonite.internal',
    role: 'Manager',
    team: 'Customer Support Ops',
  },
  'usr-3': {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@newtonite.internal',
    role: 'Manager',
    team: 'Security & Compliance',
  },
  'usr-4': {
    id: 'usr-4',
    name: 'Marcus Vance',
    email: 'marcus.vance@newtonite.internal',
    role: 'Member',
    team: 'Infrastructure',
  },
  'usr-5': {
    id: 'usr-5',
    name: 'David Kim',
    email: 'david.kim@newtonite.internal',
    role: 'Manager',
    team: 'Billing & Finance Ops',
  },
  'usr-6': {
    id: 'usr-6',
    name: 'Rachel Adams',
    email: 'rachel.adams@newtonite.internal',
    role: 'Member',
    team: 'Platform Ops',
  },
  'usr-7': {
    id: 'usr-7',
    name: 'Liam Patel',
    email: 'liam.patel@newtonite.internal',
    role: 'Member',
    team: 'Customer Support Ops',
  },
  'usr-8': {
    id: 'usr-8',
    name: 'Tanya Gomez',
    email: 'tanya.gomez@newtonite.internal',
    role: 'Member',
    team: 'Security & Compliance',
  },
};

/**
 * Returns the currently authenticated user from cookie or request header.
 * Returns null if no active session exists.
 */
export async function getSessionUser(): Promise<AuthContext | null> {
  let userId: string | null = null;

  try {
    const headersList = await headers();
    const headerUserId = headersList.get('x-user-id');
    if (headerUserId) {
      userId = headerUserId;
    }
  } catch {
    // Non-request context
  }

  if (!userId) {
    try {
      const cookieStore = await cookies();
      const cookieUserId = cookieStore.get('ops_user_id')?.value;
      if (cookieUserId) {
        userId = cookieUserId;
      }
    } catch {
      // Non-request context
    }
  }

  if (!userId) {
    return null;
  }

  try {
    await connectToDatabase();
    const dbUser = await User.findOne({ id: userId }).lean<IUser>();
    if (dbUser) {
      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        team: dbUser.team,
      };
    }
  } catch {
    // Database fallback to static mapping
  }

  return STATIC_DEMO_IDENTITIES[userId] || null;
}

/**
 * Returns current authenticated user, or DEFAULT_USER if unauthenticated.
 */
export async function getCurrentUser(): Promise<AuthContext> {
  const sessionUser = await getSessionUser();
  return sessionUser || DEFAULT_USER;
}

export function canApproveWorkItem(user: AuthContext): boolean {
  return user.role === 'Admin' || user.role === 'Manager';
}

export function canModifyWorkItem(user: AuthContext, workItemTeam: string): boolean {
  if (user.role === 'Admin') return true;
  if (user.role === 'Manager' && user.team === workItemTeam) return true;
  return user.team === workItemTeam;
}
