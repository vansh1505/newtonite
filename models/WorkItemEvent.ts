import mongoose, { Schema, Document, Model } from 'mongoose';

export type EventType =
  | 'created'
  | 'status_change'
  | 'claimed'
  | 'reassigned'
  | 'priority_change'
  | 'approved'
  | 'rejected'
  | 'conflict_rejected'
  | 'edited';

export interface IWorkItemEvent extends Document {
  id: string;
  workItemId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  type: EventType;
  action: string;
  target: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

const WorkItemEventSchema = new Schema<IWorkItemEvent>(
  {
    id: { type: String, required: true, unique: true, index: true },
    workItemId: { type: String, required: true, index: true },
    actorName: { type: String, required: true },
    actorEmail: { type: String, default: '' },
    actorRole: { type: String, default: 'Member' },
    type: {
      type: String,
      enum: [
        'created',
        'status_change',
        'claimed',
        'reassigned',
        'priority_change',
        'approved',
        'rejected',
        'conflict_rejected',
        'edited',
      ],
      required: true,
      index: true,
    },
    action: { type: String, required: true },
    target: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const WorkItemEvent: Model<IWorkItemEvent> =
  mongoose.models.WorkItemEvent ||
  mongoose.model<IWorkItemEvent>('WorkItemEvent', WorkItemEventSchema);

export default WorkItemEvent;
