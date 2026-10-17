import mongoose, { Schema, Document, Model } from 'mongoose';
import { hashPassword } from '@/lib/auth/password';

export type UserRole = 'Admin' | 'Manager' | 'Member';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  team: string;
  status: 'Active' | 'On Leave';
  avatarInitials: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: {
      type: String,
      required: true,
      default: () => hashPassword('password123'),
    },
    role: { type: String, enum: ['Admin', 'Manager', 'Member'], required: true, default: 'Member' },
    team: { type: String, required: true, index: true },
    status: { type: String, enum: ['Active', 'On Leave'], default: 'Active' },
    avatarInitials: { type: String, required: true },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
