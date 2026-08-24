import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/user-auth';

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    return NextResponse.json({
      authenticated: true,
      sessionId: session.sessionId,
      username1: session.username1,
      username2: session.username2
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
