import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { IdempotencyRecord } from '@/models/IdempotencyRecord';

export async function handleWithIdempotency(
  key: string | null,
  path: string,
  execute: () => Promise<{ status: number; body: unknown }>
): Promise<NextResponse> {
  if (!key) {
    // No idempotency key provided: execute normally
    const result = await execute();
    return NextResponse.json(result.body, { status: result.status });
  }

  try {
    await connectToDatabase();

    // Check if key has already been recorded
    const existing = await IdempotencyRecord.findOne({ key, path });
    if (existing) {
      // Return cached response with custom header indicating idempotency replay
      return NextResponse.json(existing.responseBody, {
        status: existing.statusCode,
        headers: {
          'X-Idempotent-Replay': 'true',
        },
      });
    }

    // Execute the primary action
    const result = await execute();

    // Save record if execution was successful (2xx status)
    if (result.status >= 200 && result.status < 300) {
      await IdempotencyRecord.create({
        key,
        path,
        statusCode: result.status,
        responseBody: result.body,
      });
    }

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    // If concurrent race inserted the same key, fetch and return it
    if ((error as { code?: number }).code === 11000) {
      const existing = await IdempotencyRecord.findOne({ key, path });
      if (existing) {
        return NextResponse.json(existing.responseBody, {
          status: existing.statusCode,
          headers: { 'X-Idempotent-Replay': 'true' },
        });
      }
    }
    throw error;
  }
}
