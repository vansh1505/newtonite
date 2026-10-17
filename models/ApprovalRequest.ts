import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApprovalRequest extends Document {
  id: string;
  workItemId: string;
  workItemTitle: string;
  requestedBy: {
    name: string;
    email: string;
    role: string;
  };
  team: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
  impactLevel: 'High' | 'Medium' | 'Low';
  decidedBy?: {
    name: string;
    email: string;
    role: string;
  } | null;
  decidedAt?: Date | null;
  decisionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalRequestSchema = new Schema<IApprovalRequest>(
  {
    id: { type: String, required: true, unique: true, index: true },
    workItemId: { type: String, required: true, index: true },
    workItemTitle: { type: String, required: true },
    requestedBy: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      role: { type: String, required: true },
    },
    team: { type: String, required: true, index: true },
    requestDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      required: true,
      default: 'pending',
      index: true,
    },
    type: { type: String, required: true },
    impactLevel: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    decidedBy: {
      name: { type: String },
      email: { type: String },
      role: { type: String },
    },
    decidedAt: { type: Date, default: null },
    decisionReason: { type: String, default: null },
  },
  { timestamps: true }
);

export const ApprovalRequest: Model<IApprovalRequest> =
  mongoose.models.ApprovalRequest ||
  mongoose.model<IApprovalRequest>('ApprovalRequest', ApprovalRequestSchema);

export default ApprovalRequest;
