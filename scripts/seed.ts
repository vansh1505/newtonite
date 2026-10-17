import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Team } from '../models/Team';
import { WorkItem } from '../models/WorkItem';
import { WorkItemEvent } from '../models/WorkItemEvent';
import { ApprovalRequest } from '../models/ApprovalRequest';
import {
  SEED_USERS,
  SEED_TEAMS,
  SEED_WORK_ITEMS,
  SEED_APPROVALS,
  SEED_EVENTS,
} from '../lib/db/auto-seed';

// Auto-load .env.local if MONGODB_URI is not present in process.env
if (!process.env.MONGODB_URI) {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      process.env.MONGODB_URI = match[1];
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newtonite_ops';

async function seed() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully. Seeding Newtonite Ops database...');

  await Promise.all([
    User.deleteMany({}),
    Team.deleteMany({}),
    WorkItem.deleteMany({}),
    ApprovalRequest.deleteMany({}),
    WorkItemEvent.deleteMany({}),
  ]);

  await User.insertMany(SEED_USERS);
  await Team.insertMany(SEED_TEAMS);
  await WorkItem.insertMany(SEED_WORK_ITEMS);
  await ApprovalRequest.insertMany(SEED_APPROVALS);
  await WorkItemEvent.insertMany(SEED_EVENTS);

  console.log('✅ Database seeded successfully:');
  console.log(`- ${SEED_USERS.length} Operators (Default password: password123)`);
  console.log(`- ${SEED_TEAMS.length} Teams`);
  console.log(`- ${SEED_WORK_ITEMS.length} Work Items`);
  console.log(`- ${SEED_APPROVALS.length} Approval Requests`);
  console.log(`- ${SEED_EVENTS.length} Audit Events`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
