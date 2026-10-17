import mongoose, { Schema, Document, Model } from 'mongoose';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type WorkItemStatus = 'open' | 'in_progress' | 'blocked' | 'awaiting_approval' | 'resolved';

export interface IWorkItem extends Document {
  id: string;
  title: string;
  description: string;
  reason: string;
  priority: Priority;
  status: WorkItemStatus;
  team: string;
  assignee: {
    name: string;
    email: string;
    avatarInitials: string;
  };
  assigneeId: string | null;
  claimedAt: Date | null;
  version: number;
  idempotencyKey?: string | null;
  needsAttention: boolean;
  requiresApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkItemSchema = new Schema<IWorkItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: 'text' },
    description: { type: String, required: true },
    reason: { type: String, required: true },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      required: true,
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'blocked', 'awaiting_approval', 'resolved'],
      required: true,
      default: 'open',
      index: true,
    },
    team: { type: String, required: true, index: true },
    assignee: {
      name: { type: String, required: true, default: 'Unassigned' },
      email: { type: String, default: '' },
      avatarInitials: { type: String, default: 'UA' },
    },
    assigneeId: { type: String, default: null, index: true },
    claimedAt: { type: Date, default: null },
    version: { type: Number, required: true, default: 1, index: true },
    idempotencyKey: { type: String, default: null, sparse: true, index: true },
    needsAttention: { type: Boolean, default: false, index: true },
    requiresApproval: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound indexes for performant query patterns
WorkItemSchema.index({ status: 1, priority: 1 });
WorkItemSchema.index({ team: 1, status: 1 });
WorkItemSchema.index({ assigneeId: 1, status: 1 });

export const WorkItem: Model<IWorkItem> =
  mongoose.models.WorkItem || mongoose.model<IWorkItem>('WorkItem', WorkItemSchema);

export default WorkItem;
