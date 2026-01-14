import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    const isConnected = await testConnection();

    if (isConnected) {
      return NextResponse.json({
        status: 'ok',
        message: 'Database connection successful',
      });
    } else {
      return NextResponse.json(
        { status: 'error', message: 'Database connection failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
