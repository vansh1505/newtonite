import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
  id: string;
  name: string;
  lead: string;
  memberCount: number;
  openItemsCount: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    lead: { type: String, required: true },
    memberCount: { type: Number, default: 0 },
    openItemsCount: { type: Number, default: 0 },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
