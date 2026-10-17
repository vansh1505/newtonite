import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIdempotencyRecord extends Document {
  key: string;
  path: string;
  statusCode: number;
  responseBody: unknown;
  createdAt: Date;
}

const IdempotencyRecordSchema = new Schema<IIdempotencyRecord>(
  {
    key: { type: String, required: true, unique: true, index: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseBody: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // 24 hour TTL
  },
  { timestamps: false }
);

export const IdempotencyRecord: Model<IIdempotencyRecord> =
  mongoose.models.IdempotencyRecord ||
  mongoose.model<IIdempotencyRecord>('IdempotencyRecord', IdempotencyRecordSchema);

export default IdempotencyRecord;
